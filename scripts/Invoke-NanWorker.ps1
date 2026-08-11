[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('code', 'bulletin')]
    [string]$TaskType,
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$Objective,
    [string[]]$AllowedPath = @(),
    [string[]]$InputPath = @(),
    [string[]]$ValidationCommand = @(),
    [ValidateSet('default', 'json')]
    [string]$Format = 'default'
)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$repoPrefix = $repoRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
$AllowedPath = @(
    $AllowedPath |
        ForEach-Object { $_ -split ',' } |
        ForEach-Object { $_.Trim() } |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
)

function Resolve-RepositoryPath {
    param([Parameter(Mandatory)][string]$Path)
    $candidate = if ([System.IO.Path]::IsPathRooted($Path)) {
        [System.IO.Path]::GetFullPath($Path)
    } else {
        [System.IO.Path]::GetFullPath((Join-Path $repoRoot $Path))
    }
    if (-not $candidate.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "InputPath must stay inside the repository: $Path"
    }
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        throw "InputPath does not exist or is not a file: $Path"
    }
    return $candidate
}

function Get-RepositorySnapshot {
    $snapshot = @{}
    $paths = & git -C $repoRoot ls-files --cached --others --exclude-standard
    if ($LASTEXITCODE -ne 0) { throw 'Unable to enumerate repository files with git.' }
    foreach ($relative in $paths) {
        if ([string]::IsNullOrWhiteSpace($relative)) { continue }
        $absolute = Join-Path $repoRoot $relative
        if (Test-Path -LiteralPath $absolute -PathType Leaf) {
            $snapshot[$relative.Replace('\', '/')] = (Get-FileHash -Algorithm SHA256 -LiteralPath $absolute).Hash
        }
    }
    return $snapshot
}

function Get-ChangedPaths {
    param([hashtable]$Before, [hashtable]$After)
    $allPaths = @($Before.Keys) + @($After.Keys) | Sort-Object -Unique
    return @($allPaths | Where-Object {
        -not $Before.ContainsKey($_) -or -not $After.ContainsKey($_) -or $Before[$_] -ne $After[$_]
    })
}

function Test-AllowedPath {
    param([string]$ChangedPath, [string[]]$Patterns)
    foreach ($rawPattern in $Patterns) {
        $pattern = $rawPattern.Replace('\', '/').TrimStart('./')
        if ($ChangedPath -like $pattern) { return $true }
        if ($pattern -notmatch '[*?\[]' -and $ChangedPath.StartsWith($pattern.TrimEnd('/') + '/', [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }
    return $false
}

if ($TaskType -eq 'code' -and $AllowedPath.Count -eq 0) {
    throw 'Code delegation requires at least one -AllowedPath contract boundary.'
}
if ($TaskType -eq 'bulletin' -and $AllowedPath.Count -gt 0) {
    throw 'Bulletin delegation is read-only and does not accept -AllowedPath.'
}

$resolvedInputs = @($InputPath | ForEach-Object { Resolve-RepositoryPath -Path $_ })
$route = if ($TaskType -eq 'code') {
    [pscustomobject]@{ Agent = 'nan-code'; Model = 'nan/qwen3.6' }
} else {
    [pscustomobject]@{ Agent = 'nan-bulletin'; Model = 'nan/gemma4' }
}

$contractLines = @("TASK TYPE: $TaskType", "OBJECTIVE: $Objective")
if ($AllowedPath.Count -gt 0) {
    $contractLines += "ALLOWED PATHS: $($AllowedPath -join ', ')"
    $contractLines += 'Changing any other path is a contract violation.'
}
if ($ValidationCommand.Count -gt 0) {
    $contractLines += "REQUIRED VALIDATION: $($ValidationCommand -join ' ; ')"
}
if ($resolvedInputs.Count -gt 0) {
    $contractLines += "LOCAL INPUTS: $($resolvedInputs -join ', ')"
}
$contractLines += 'Do not commit, push, publish, deploy, or expand this contract.'
$contract = $contractLines -join [Environment]::NewLine

$before = if ($TaskType -eq 'code') { Get-RepositorySnapshot } else { @{} }
$arguments = @(
    'run', '--pure', '--model', $route.Model, '--agent', $route.Agent,
    '--format', $Format, '--title', "orchestrated-$TaskType"
)
foreach ($file in $resolvedInputs) { $arguments += @('--file', $file) }
$arguments += @('--', $contract)

Write-Host "Route: $($route.Agent) -> $($route.Model)" -ForegroundColor Cyan
& opencode @arguments
$workerExitCode = $LASTEXITCODE

if ($TaskType -eq 'code') {
    $after = Get-RepositorySnapshot
    $changed = Get-ChangedPaths -Before $before -After $after
    $violations = @($changed | Where-Object { -not (Test-AllowedPath -ChangedPath $_ -Patterns $AllowedPath) })
    if ($violations.Count -gt 0) {
        Write-Error "Contract violation. Paths outside AllowedPath changed: $($violations -join ', ')"
    }
    Write-Host "Observed changed paths: $($changed -join ', ')" -ForegroundColor DarkCyan
}
if ($workerExitCode -ne 0) { throw "OpenCode worker failed with exit code $workerExitCode." }
