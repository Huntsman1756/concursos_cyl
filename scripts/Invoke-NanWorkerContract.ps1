[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ContractPath,
    [string]$StateDirectory = '',
    [string]$WorktreeRoot = '',
    [switch]$TestMode
)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$coordinatorWorker = Join-Path $PSScriptRoot 'Invoke-NanWorker.ps1'
$workerPath = $coordinatorWorker
$utf8 = New-Object System.Text.UTF8Encoding($false)

# ── When WorktreeRoot is supplied and not TestMode: validate and use child worker ──
if ($WorktreeRoot -and -not $TestMode) {
    $resolvedWorktree = [System.IO.Path]::GetFullPath($WorktreeRoot).TrimEnd('\','/')
    $linkedWorktrees = @(& git -C $repoRoot worktree list --porcelain 2>&1 | ForEach-Object {
        if ($_ -match '^worktree (.+)$') {
            [System.IO.Path]::GetFullPath($Matches[1]).TrimEnd('\','/')
        }
    })
    if ($LASTEXITCODE -ne 0 -or -not @($linkedWorktrees | Where-Object {
        $_.Equals($resolvedWorktree, [System.StringComparison]::OrdinalIgnoreCase)
    }).Count) {
        throw "WorktreeRoot '$resolvedWorktree' is not a linked worktree of the repo."
    }
    $childWorker = Join-Path $resolvedWorktree 'scripts\Invoke-NanWorker.ps1'
    if (-not (Test-Path -LiteralPath $childWorker)) {
        throw "Child worker script not found at $childWorker"
    }
    $workerPath = $childWorker
} elseif (-not $WorktreeRoot -and -not $TestMode) {
    throw 'Live execution requires WorktreeRoot; no fallback to coordinator worker is allowed.'
}

# ── Helpers ──
function Get-Sha256Hex {
    param([byte[]]$Bytes)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return (($sha.ComputeHash($Bytes) | ForEach-Object { $_.ToString('x2') }) -join '') }
    finally { $sha.Dispose() }
}

function Write-NewJson {
    param([string]$Path, [object]$Value)
    $bytes = $utf8.GetBytes(($Value | ConvertTo-Json -Depth 12 -Compress))
    $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try { $stream.Write($bytes, 0, $bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
}

# ── Load and validate story contract ──
if (-not (Test-Path -LiteralPath $ContractPath -PathType Leaf)) {
    throw "Contract file not found: $ContractPath"
}
$contract = Get-Content -LiteralPath $ContractPath -Raw -Encoding UTF8 | ConvertFrom-Json

$requiredStoryFields = @('id','objective','allowedPaths','validationCommands','frontierPlan','acceptanceCriteria')
foreach ($field in $requiredStoryFields) {
    if (-not ($contract.PSObject.Properties.Name -contains $field)) {
        throw "Story contract missing field: $field"
    }
}

# Validate id format
if ($contract.id -notmatch '^[a-z0-9][a-z0-9-]{0,63}$') {
    throw "Story id '$($contract.id)' does not match ^[a-z0-9][a-z0-9-]{0,63}$"
}

# Non-empty fields
if ([string]::IsNullOrWhiteSpace($contract.objective)) { throw 'objective must be non-empty.' }
if ([string]::IsNullOrWhiteSpace($contract.frontierPlan)) { throw 'frontierPlan must be non-empty.' }
if (@($contract.allowedPaths).Count -eq 0) { throw 'allowedPaths must contain at least one path.' }
if (@($contract.validationCommands).Count -eq 0) { throw 'validationCommands must contain at least one command.' }
if (@($contract.acceptanceCriteria).Count -eq 0) { throw 'acceptanceCriteria must contain at least one item.' }

# Validate paths and profiles before launching the worker.
foreach ($allowedPath in @($contract.allowedPaths)) {
    $pathText = [string]$allowedPath
    if ([string]::IsNullOrWhiteSpace($pathText)) { throw 'allowedPaths cannot contain empty values.' }
    $normalizedPath = $pathText.Replace('\','/')
    if ($normalizedPath -match '^[a-zA-Z]:/' -or $normalizedPath.StartsWith('/')) { throw "Allowed path '$pathText' must be relative." }
    if ($normalizedPath -match '(^|/)\.\.(/|$)') { throw "Allowed path '$pathText' contains directory traversal." }
    if ($normalizedPath -match '[*?\[\]]') { throw "Allowed path '$pathText' contains a wildcard; batch paths must be exact." }
}

$modelProfile = if ($contract.PSObject.Properties.Name -contains 'modelProfile') { [string]$contract.modelProfile } else { 'mechanical' }
if ($modelProfile -match '(?i)glm5\.2') { throw "Model profile '$modelProfile' references unsupported glm5.2." }
if (@('mechanical','reasoning','long-context') -notcontains $modelProfile) {
    throw "Model profile '$modelProfile' is not valid."
}
$budgetProfile = if ($contract.PSObject.Properties.Name -contains 'budgetProfile') { [string]$contract.budgetProfile } else { 'small' }
if (@('small','batch','research','extended') -notcontains $budgetProfile) {
    throw "Budget profile '$budgetProfile' is not valid."
}

# Build worker parameters (splat)
$workerParameters = @{
    TaskType = 'code'
    Objective = $contract.objective
    AllowedPath = @($contract.allowedPaths)
    ValidationCommand = @($contract.validationCommands)
    FrontierPlan = $contract.frontierPlan
    AcceptanceCriteria = @($contract.acceptanceCriteria)
    PlannedBy = 'frontier'
    MaxRetries = 1
    FallbackModels = @()
    BudgetProfile = $budgetProfile
    ModelProfile = $modelProfile
    DuplicateWindowSeconds = 0
}

if ($contract.PSObject.Properties.Name -contains 'maxObservedTokens') {
    $workerParameters.MaxObservedTokens = [int]$contract.maxObservedTokens
}
if ($contract.PSObject.Properties.Name -contains 'maxExecutionSeconds') {
    $workerParameters.MaxExecutionSeconds = [int]$contract.maxExecutionSeconds
}

# ── Allocate state paths outside the source repository ──
$storyId = $contract.id
if ([string]::IsNullOrWhiteSpace($StateDirectory)) { throw 'StateDirectory is required.' }
$resolvedStateDirectory = [System.IO.Path]::GetFullPath($StateDirectory)
$sourcePrefix = $repoRoot.TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
$statePrefix = $resolvedStateDirectory.TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
if ($statePrefix.StartsWith($sourcePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'StateDirectory must be outside the source repository.'
}
$storyDir = Join-Path $resolvedStateDirectory "story-$storyId"
New-Item -ItemType Directory -Path $storyDir -Force | Out-Null
$telemetryPath = Join-Path $storyDir 'worker-telemetry.json'
$patchPath = Join-Path $storyDir 'candidate.patch'
$workerParameters.TelemetryOutputPath = $telemetryPath

# ── TestMode support ──
$mockPlan = $null
if ($TestMode) {
    $workerParameters.TestMode = $true
    if ($contract.PSObject.Properties.Name -contains 'mockPlan') {
        $mockPlan = if ($contract.mockPlan -is [array]) {
            ($contract.mockPlan | ConvertTo-Json -Depth 8 -Compress)
        } else {
            [string]$contract.mockPlan
        }
        $workerParameters.MockPlan = $mockPlan
    }
}

# ── Invoke worker ──
$previousErrorActionPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = 'Continue'
    $workerOutput = & $workerPath @workerParameters *>&1
    $workerExit = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $previousErrorActionPreference
}

# ── Capture results ──
if (-not (Test-Path -LiteralPath $telemetryPath -PathType Leaf)) {
    throw "Worker telemetry not produced at: $telemetryPath"
}
$telemetry = Get-Content -LiteralPath $telemetryPath -Raw -Encoding UTF8 | ConvertFrom-Json

# Capture patch if changes exist (TestMode writes a simulated patch)
$patchAvailable = @($telemetry.changedPaths).Count -gt 0 -and -not [bool]$telemetry.contractViolation
if ($patchAvailable) {
    if ($TestMode) {
        [System.IO.File]::WriteAllText($patchPath, "SIMULATED PATCH`n", $utf8)
    } else {
        $worktree = if (-not [string]::IsNullOrWhiteSpace($WorktreeRoot)) {
            $WorktreeRoot
        } else {
            $repoRoot
        }
        foreach ($changedPath in @($telemetry.changedPaths)) {
            & git -C $worktree add -N -- $changedPath | Out-Null
        }
        $patchText = (& git -C $worktree diff --binary --no-ext-diff HEAD -- | Out-String)
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($patchText)) {
            [System.IO.File]::WriteAllText($patchPath, $patchText, $utf8)
        } else {
            $patchAvailable = $false
        }
    }
}

$candidateReady = $workerExit -eq 0 -and $telemetry.status -eq 'awaiting-frontier-review'

$result = [ordered]@{
    storyId = $storyId
    exitCode = $workerExit
    candidateReady = $candidateReady
    patchAvailable = $patchAvailable
    status = $telemetry.status
    contractViolation = [bool]$telemetry.contractViolation
    validationFailed = [bool]$telemetry.validationFailed
    changedPaths = @($telemetry.changedPaths)
    tokensUsage = $telemetry.tokensUsage
    providerEvidence = @{
        verified = [bool]$telemetry.providerEvidence.verified
        evidenceClass = [string]$telemetry.providerEvidence.evidenceClass
        recordCount = [int]$telemetry.providerEvidence.recordCount
        providerReportedTokens = [long]$telemetry.providerEvidence.providerReportedTokens
        responseIdSetHash = $telemetry.providerEvidence.responseIdSetHash
    }
    telemetrySha256 = (Get-Sha256Hex -Bytes ([System.IO.File]::ReadAllBytes($telemetryPath)))
    patchSha256 = if ($patchAvailable -and (Test-Path -LiteralPath $patchPath)) {
        (Get-Sha256Hex -Bytes ([System.IO.File]::ReadAllBytes($patchPath)))
    } else { $null }
    patchPath = if ($patchAvailable) { $patchPath } else { $null }
    telemetryPath = $telemetryPath
    storyDir = $storyDir
    attempts = @($telemetry.attempts | ForEach-Object {
        @{
            model = $_.model; exitCode = $_.exitCode
            tokens = $_.tokens; changedPaths = @($_.changedPaths)
            validationExitCode = $_.validationExitCode
            terminationReason = $_.terminationReason
        }
    })
}

# Write story result
$resultPath = Join-Path $storyDir 'story-result.json'
Write-NewJson -Path $resultPath -Value $result

Write-Output ($result | ConvertTo-Json -Depth 12 -Compress)
exit $workerExit
