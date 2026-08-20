[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$supervisor = Join-Path $repoRoot 'scripts\Invoke-FrontierSupervisedNanWorker.ps1'
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("castilla-frontier-test-" + [guid]::NewGuid().ToString('N'))
$state = Join-Path $temporaryRoot 'state'
$acceptState = Join-Path $temporaryRoot 'accept-state'
$failureState = Join-Path $temporaryRoot 'failure-state'
$staticSuccessState = Join-Path $temporaryRoot 'static-success-state'
$noProgressState = Join-Path $temporaryRoot 'no-progress-state'
$worktrees = Join-Path $temporaryRoot 'worktrees'
$contract = Join-Path $temporaryRoot 'contract.json'
$staticContract = Join-Path $temporaryRoot 'static-contract.json'
$failureContract = Join-Path $temporaryRoot 'failure-contract.json'
New-Item -ItemType Directory -Path $temporaryRoot, $worktrees | Out-Null

$supervisorText = Get-Content -LiteralPath $supervisor -Raw
if ($supervisorText -notmatch 'cleanupAttempt\s*-le\s*4') { throw 'Supervisor must retry transient Windows worktree cleanup failures.' }
if ($supervisorText -notmatch 'ConvertTo-NativeArgument\s+-Value') { throw 'Supervisor cleanup must use the declared argument parameter.' }
Write-Host 'PASS: frontier supervisor retries bounded Windows worktree cleanup' -ForegroundColor Green

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
        (@(@{exitCode=0;changedPaths=@('scripts/result.txt');validationExitCode=1;validationDiagnostics=@(@{commandIndex=1;exitCode=1;outputTail='Expected value was not written.';truncated=$false});jsonl=''}) | ConvertTo-Json -Depth 8 -Compress),
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
    if (-not $result.attempts[0].patchAvailable -or -not (Test-Path -LiteralPath (Join-Path $state 'attempt-1.candidate.patch'))) {
        throw 'Failed validation must preserve a bounded candidate patch for repair.'
    }
    if ($result.attempts[0].validationDiagnostics[0].outputTail -ne 'Expected value was not written.') {
        throw 'Failed validation diagnostics were not forwarded to the frontier evidence.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $state 'attempt-1.frontier-decision.json'))) {
        throw 'First frontier decision was not persisted.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $state 'attempt-2.frontier-decision.json'))) {
        throw 'Terminal frontier decision was not persisted.'
    }
    Write-Host 'PASS: frontier supervisor preserves failed evidence, retries, and escalates durably' -ForegroundColor Green

    @{
        objective = 'Format the bounded fixture.'
        allowedPaths = @('scripts/result.txt')
        validationCommands = @('npm run format:check')
        frontierPlan = 'Make the exact localized change and preserve formatting.'
        acceptanceCriteria = @('The format validation passes.')
        budgetProfile = 'small'
        modelProfile = 'mechanical'
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $staticContract -Encoding utf8

    $staticFailurePlan = @(@{
        exitCode=0
        changedPaths=@('scripts/result.txt')
        validationExitCode=1
        validationDiagnostics=@(@{commandIndex=1;exitCode=1;outputTail='Checking formatting...';truncated=$false})
        jsonl=''
    }) | ConvertTo-Json -Depth 8 -Compress
    $staticSuccessPlan = @(@{exitCode=0;changedPaths=@('scripts/result.txt');validationExitCode=0;jsonl=''}) | ConvertTo-Json -Depth 8 -Compress
    $staticAcceptDecision = @(@{action='ACCEPT';repairInstructions=@()}) | ConvertTo-Json -Depth 5 -Compress
    $staticOutput = & $supervisor -ContractPath $staticContract -StateDirectory $staticSuccessState `
        -WorktreeParent $worktrees -MaxAttempts 2 -TestMode `
        -MockWorkerPlans @($staticFailurePlan,$staticSuccessPlan) -MockFrontierDecisions $staticAcceptDecision
    if ($LASTEXITCODE -ne 0) { throw "Expected shift-left repair success, got $LASTEXITCODE" }
    $staticResult = $staticOutput | ConvertFrom-Json
    if ($staticResult.status -ne 'COMPLETE' -or $staticResult.policyEvents.Count -ne 1 -or $staticResult.decisions.Count -ne 1) {
        throw 'Static-quality failure did not use exactly one policy retry before Frontier acceptance.'
    }
    if ($staticResult.policyEvents[0].decisionOwner -ne 'broker-shift-left-policy') {
        throw 'Static-quality retry was not attributed to broker policy.'
    }
    $packetPath = Join-Path $staticSuccessState 'attempt-1.repair-packet.json'
    $policyPath = Join-Path $staticSuccessState 'attempt-1.policy-retry.json'
    if (-not (Test-Path -LiteralPath $packetPath) -or -not (Test-Path -LiteralPath $policyPath)) {
        throw 'Static-quality retry evidence was not persisted.'
    }
    $packet = Get-Content -LiteralPath $packetPath -Raw | ConvertFrom-Json
    $packetBody = [ordered]@{
        schemaVersion=$packet.schemaVersion
        packetType=$packet.packetType
        failedAttempt=$packet.failedAttempt
        failureSignature=$packet.failureSignature
        findings=@($packet.findings)
    }
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $packetBytes = [System.Text.Encoding]::UTF8.GetBytes(($packetBody | ConvertTo-Json -Depth 12 -Compress))
        $recomputedPacketHash = -join ($sha.ComputeHash($packetBytes) | ForEach-Object { $_.ToString('x2') })
    } finally { $sha.Dispose() }
    if ($packet.packetHash -ne $recomputedPacketHash) { throw 'Static-quality repair packet hash is invalid.' }
    Write-Host 'PASS: static-quality failure uses a hash-bound policy repair before Frontier review' -ForegroundColor Green

    $noProgressOutput = & $supervisor -ContractPath $staticContract -StateDirectory $noProgressState `
        -WorktreeParent $worktrees -MaxAttempts 2 -TestMode `
        -MockWorkerPlans @($staticFailurePlan,$staticFailurePlan) -MockFrontierDecisions '[]'
    if ($LASTEXITCODE -ne 2) { throw "Expected NO_PROGRESS exit 2, got $LASTEXITCODE" }
    $noProgressResult = $noProgressOutput | ConvertFrom-Json
    if ($noProgressResult.status -ne 'NO_PROGRESS' -or $noProgressResult.decisions.Count -ne 0) {
        throw 'Repeated static-quality signature must stop without a Frontier decision.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $noProgressState 'attempt-2.no-progress.json'))) {
        throw 'NO_PROGRESS evidence was not persisted.'
    }
    Write-Host 'PASS: repeated static-quality signature terminates durably as NO_PROGRESS' -ForegroundColor Green

    $session = 'frontier-accept-test'
    $jsonl = @(
        (@{type='step_start';sessionID=$session;part=@{type='step-start'}} | ConvertTo-Json -Depth 5 -Compress),
        (@{type='step_finish';sessionID=$session;part=@{type='step-finish';reason='stop';tokens=@{input=1;output=1;reasoning=0;total=2;cache=@{read=0;write=0}}}} | ConvertTo-Json -Depth 8 -Compress)
    ) -join "`n"
    $acceptPlan = @(@{exitCode=0;changedPaths=@('scripts/result.txt');validationExitCode=0;jsonl=$jsonl}) | ConvertTo-Json -Depth 8 -Compress
    $acceptDecision = @(@{action='ACCEPT';repairInstructions=@()}) | ConvertTo-Json -Depth 5 -Compress
    $acceptOutput = & $supervisor -ContractPath $contract -StateDirectory $acceptState `
        -WorktreeParent $worktrees -MaxAttempts 1 -TestMode `
        -MockWorkerPlans @($acceptPlan) -MockFrontierDecisions $acceptDecision
    if ($LASTEXITCODE -ne 0) {
        $failedAccept = Get-Content -LiteralPath (Join-Path $acceptState 'supervision-result.json') -Raw
        throw "Expected ACCEPT exit 0, got $LASTEXITCODE. Result=$failedAccept"
    }
    $acceptResult = $acceptOutput | ConvertFrom-Json
    if ($acceptResult.status -ne 'COMPLETE' -or -not (Test-Path -LiteralPath $acceptResult.acceptedPatchPath)) {
        throw 'ACCEPT must persist and return the accepted patch.'
    }
    Write-Host 'PASS: frontier supervisor persists the ACCEPT result and patch' -ForegroundColor Green

    @{allowedPaths=@('scripts/result.txt')} | ConvertTo-Json | Set-Content -LiteralPath $failureContract -Encoding utf8
    $null = & $supervisor -ContractPath $failureContract -StateDirectory $failureState `
        -WorktreeParent $worktrees -MaxAttempts 1 -TestMode 2>&1
    if ($LASTEXITCODE -ne 1) { throw "Expected fatal supervisor exit 1, got $LASTEXITCODE" }
    $failureResultPath = Join-Path $failureState 'supervision-result.json'
    if (-not (Test-Path -LiteralPath $failureResultPath)) { throw 'Fatal supervisor failure was not persisted.' }
    $failureResult = Get-Content -LiteralPath $failureResultPath -Raw | ConvertFrom-Json
    if ($failureResult.status -ne 'FAILED' -or -not $failureResult.phase -or -not $failureResult.errorMessageSha256) {
        throw 'Fatal supervisor result lacks durable bounded diagnostics.'
    }
    Write-Host 'PASS: frontier supervisor persists sanitized fatal failure evidence' -ForegroundColor Green
} finally {
    if (Test-Path -LiteralPath $temporaryRoot) {
        Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
    }
}
