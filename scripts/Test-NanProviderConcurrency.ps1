[CmdletBinding()]
param(
    [ValidateRange(1,5)][int]$Contracts = 5,
    [string]$InputPath = 'docs/evidence/nan-shakedown-2026-08-13/fp-parallel-batch-2-summary.md'
)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$workerPath = Join-Path $PSScriptRoot 'Invoke-NanWorker.ps1'
$runId = [guid]::NewGuid().ToString('N')
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) "castilla-nan-concurrency-$runId"
$telemetryRoot = Join-Path $repoRoot '.agent-runs'
New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null
New-Item -ItemType Directory -Path $telemetryRoot -Force | Out-Null

$processes = @()

function ConvertTo-NativeArgument {
    param([AllowEmptyString()][string]$Argument)
    if ($Argument -notmatch '[\s"]') { return $Argument }
    return '"' + ($Argument -replace '(\\*)"','$1$1\"' -replace '(\\+)$','$1$1') + '"'
}

try {
    for ($index = 1; $index -le $Contracts; $index++) {
        $telemetryPath = Join-Path $telemetryRoot "$runId.$index.json"
        $arguments = @(
            '-NoProfile','-ExecutionPolicy','Bypass','-File',$workerPath,
            '-TaskType','bulletin',
            '-Objective',"provider-concurrency-shakedown-$runId-$index",
            '-InputPath',$InputPath,
            '-ModelProfile','reasoning',
            '-BudgetProfile','small',
            '-MaxRetries','1',
            '-MaxExecutionSeconds','240',
            '-DuplicateWindowSeconds','0',
            '-TelemetryOutputPath',$telemetryPath
        )
        $start = New-Object System.Diagnostics.ProcessStartInfo
        $start.FileName = 'powershell.exe'
        $start.Arguments = (($arguments | ForEach-Object { ConvertTo-NativeArgument -Argument $_ }) -join ' ')
        $start.WorkingDirectory = $repoRoot
        $start.UseShellExecute = $false
        $start.CreateNoWindow = $true
        $start.RedirectStandardOutput = $true
        $start.RedirectStandardError = $true
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $start
        if (-not $process.Start()) { throw "Failed to start worker $index" }
        $processes += @{index=$index;process=$process;telemetryPath=$telemetryPath;stdoutTask=$process.StandardOutput.ReadToEndAsync();stderrTask=$process.StandardError.ReadToEndAsync()}
    }

    foreach ($item in $processes) {
        $item.process.WaitForExit()
        $item.exitCode = $item.process.ExitCode
        $item.stdout = $item.stdoutTask.GetAwaiter().GetResult()
        $item.stderr = $item.stderrTask.GetAwaiter().GetResult()
    }

    $results = @($processes | ForEach-Object {
        $telemetry = if (Test-Path -LiteralPath $_.telemetryPath -PathType Leaf) {
            Get-Content -LiteralPath $_.telemetryPath -Raw | ConvertFrom-Json
        } else { $null }
        [pscustomobject][ordered]@{
            index=$_.index
            exitCode=$_.exitCode
            status=if ($telemetry) { $telemetry.status } else { 'missing-telemetry' }
            providerVerified=if ($telemetry) { [bool]$telemetry.providerEvidence.verified } else { $false }
            providerReportedTokens=if ($telemetry) { [long]$telemetry.providerEvidence.providerReportedTokens } else { 0 }
            responseIdSetHash=if ($telemetry) { $telemetry.providerEvidence.responseIdSetHash } else { $null }
            queueWaitMs=if ($telemetry) { [long]$telemetry.admission.queueWaitMs } else { $null }
            diagnostic=if ($_.exitCode -ne 0) {
                ($_.stderr + "`n" + $_.stdout).Trim()
            } else { '' }
        }
    })
    $verified = @($results | Where-Object { $_.exitCode -eq 0 -and $_.status -eq 'awaiting-frontier-review' -and $_.providerVerified }).Count
    $summary = [ordered]@{
        runId=$runId
        requested=$Contracts
        verified=$verified
        providerReportedTokens=[long](($results | Measure-Object -Property providerReportedTokens -Sum).Sum)
        results=$results
    }
    $summary | ConvertTo-Json -Depth 6
    if ($verified -ne $Contracts) { exit 1 }
} finally {
    foreach ($item in $processes) { if ($item.process) { $item.process.Dispose() } }
    $resolvedTemporaryRoot = [System.IO.Path]::GetFullPath($temporaryRoot)
    $expectedPrefix = [System.IO.Path]::GetFullPath((Join-Path ([System.IO.Path]::GetTempPath()) 'castilla-nan-concurrency-'))
    if ($resolvedTemporaryRoot.StartsWith($expectedPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $resolvedTemporaryRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
