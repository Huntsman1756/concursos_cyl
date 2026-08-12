[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$supervisor = Join-Path $repoRoot 'scripts\Invoke-FrontierSupervisedNanWorker.ps1'
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("castilla-frontier-test-" + [guid]::NewGuid().ToString('N'))
$state = Join-Path $temporaryRoot 'state'
$worktrees = Join-Path $temporaryRoot 'worktrees'
$contract = Join-Path $temporaryRoot 'contract.json'
New-Item -ItemType Directory -Path $temporaryRoot, $worktrees | Out-Null

try {
    @{
        objective = 'Update the bounded fixture.'
        allowedPaths = @('scripts/result.txt')
        validationCommands = @('cmd /c exit 0')
        frontierPlan = 'Make the exact localized change.'
        acceptanceCriteria = @('The focused validation passes.')
        budgetProfile = 'small'
        modelProfile = 'mechanical'
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $contract -Encoding utf8

    $workerPlans = @(
        (@(@{exitCode=1;changedPaths=@();validationExitCode=1;jsonl=''}) | ConvertTo-Json -Compress),
        (@(@{exitCode=1;changedPaths=@();validationExitCode=1;jsonl=''}) | ConvertTo-Json -Compress)
    )
    $decisions = @(
        @{action='RETRY';repairInstructions=@('Use the edit tool and change only the declared file.')},
        @{action='ESCALATE';repairInstructions=@()}
    ) | ConvertTo-Json -Depth 5 -Compress

    $output = & $supervisor -ContractPath $contract -StateDirectory $state `
        -WorktreeParent $worktrees -MaxAttempts 2 -TestMode `
        -MockWorkerPlans $workerPlans -MockFrontierDecisions $decisions
    if ($LASTEXITCODE -ne 2) { throw "Expected structured escalation exit 2, got $LASTEXITCODE" }
    $result = $output | ConvertFrom-Json
    if ($result.status -ne 'ESCALATE') { throw 'Expected ESCALATE result.' }
    if ($result.attempts.Count -ne 2) { throw 'Expected two worker attempts.' }
    if ($result.decisions[0].action -ne 'RETRY' -or $result.decisions[1].action -ne 'ESCALATE') {
        throw 'Expected RETRY then ESCALATE.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $state 'attempt-1.frontier-decision.json'))) {
        throw 'First frontier decision was not persisted.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $state 'attempt-2.frontier-decision.json'))) {
        throw 'Terminal frontier decision was not persisted.'
    }
    Write-Host 'PASS: frontier supervisor retries with adapted instructions and escalates durably' -ForegroundColor Green
} finally {
    if (Test-Path -LiteralPath $temporaryRoot) {
        Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
    }
}
