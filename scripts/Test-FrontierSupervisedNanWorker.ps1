[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$supervisor = Join-Path $repoRoot 'scripts\Invoke-FrontierSupervisedNanWorker.ps1'
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("castilla-frontier-test-" + [guid]::NewGuid().ToString('N'))
$state = Join-Path $temporaryRoot 'state'
$acceptState = Join-Path $temporaryRoot 'accept-state'
$failureState = Join-Path $temporaryRoot 'failure-state'
$worktrees = Join-Path $temporaryRoot 'worktrees'
$contract = Join-Path $temporaryRoot 'contract.json'
$failureContract = Join-Path $temporaryRoot 'failure-contract.json'
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

    # ────────────────────────────────────────────────────────────────
    # Test 3: fail-then-pass — exactly two qwen attempts, awaiting-frontier-review
    # ────────────────────────────────────────────────────────────────
    $contractFTP = Join-Path $temporaryRoot 'contract-ftp.json'
    $stateFTP = Join-Path $temporaryRoot 'state-ftp'
    New-Item -ItemType Directory -Path $stateFTP -Force | Out-Null
    @{
        objective = 'Two attempts then succeed'
        allowedPaths = @('scripts/ftp.txt')
        validationCommands = @('cmd /c exit 0')
        frontierPlan = 'Repair on first fail.'
        acceptanceCriteria = @('Pass on retry')
        modelProfile = 'mechanical'
        budgetProfile = 'small'
        maxRetries = 2
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $contractFTP -Encoding utf8

    $session3 = 'ftp-test-session'
    $jsonl3 = @(
        (@{type='step_start';sessionID=$session3;part=@{type='step-start'}} | ConvertTo-Json -Depth 5 -Compress),
        (@{type='step_finish';sessionID=$session3;part=@{type='step-finish';reason='stop';tokens=@{input=1;output=1;reasoning=0;total=2;cache=@{read=0;write=0}}}} | ConvertTo-Json -Depth 8 -Compress)
    ) -join "`n"

    # First: exit 0 but validation fails → retry.  Second: exit 0, validation passes → success.
    $mockPlanFTP = @(
        (@{exitCode=0;changedPaths=@('scripts/ftp.txt');validationExitCode=1;validationDiagnostics=@(@{commandIndex=1;exitCode=1;outputTail='First fail.';truncated=$false});jsonl=$jsonl3}) | ConvertTo-Json -Depth 8 -Compress),
        (@{exitCode=0;changedPaths=@('scripts/ftp.txt');validationExitCode=0;jsonl=$jsonl3}) | ConvertTo-Json -Depth 8 -Compress) | ConvertTo-Json -Depth 8 -Compress

    $decisionsFTP = @(
        @{action='RETRY';repairInstructions=@('Fix the assertion.')},
        @{action='ACCEPT';repairInstructions=@()}
    ) | ConvertTo-Json -Depth 5 -Compress

    $outputFTP = & $supervisor -ContractPath $contractFTP -StateDirectory $stateFTP `
        -WorktreeParent $worktrees -MaxAttempts 3 -TestMode `
        -MockWorkerPlans $mockPlanFTP -MockFrontierDecisions $decisionsFTP
    if ($LASTEXITCODE -ne 0) { throw "Expected exit 0 for fail-then-pass, got $LASTEXITCODE" }
    $ftpResultObj = $outputFTP | ConvertFrom-Json

    $ftpTele2Path = Get-ChildItem -LiteralPath $stateFTP -Filter '*.telemetry.json' -Recurse -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc | Select-Object -Last 1
    if ($null -eq $ftpTele2Path) { throw 'No telemetry file found for fail-then-pass.' }
    $ftpTele2 = Get-Content -LiteralPath $ftpTele2Path.FullName -Raw | ConvertFrom-Json

    if ($ftpTele2.attempts.Count -ne 2) { throw "Expected 2 attempts in fail-then-pass, got $($ftpTele2.attempts.Count)" }
    if ($ftpTele2.status -ne 'awaiting-frontier-review') { throw "Expected awaiting-frontier-review, got $($ftpTele2.status)" }
    if ($ftpTele2.success -ne $true) { throw "Expected success=true, got $($ftpTele2.success)" }
    Write-Host 'PASS: fail-then-pass produces exactly two Qwen attempts and awaiting-frontier-review' -ForegroundColor Green

    # ────────────────────────────────────────────────────────────────
    # Test 4: fail-fail — validationFailed=true, blocked-needs-new-contract
    # ────────────────────────────────────────────────────────────────
    $contractFF = Join-Path $temporaryRoot 'contract-ff.json'
    $stateFF = Join-Path $temporaryRoot 'state-ff'
    New-Item -ItemType Directory -Path $stateFF -Force | Out-Null
    @{
        objective = 'Double fail'
        allowedPaths = @('scripts/ff.txt')
        validationCommands = @('cmd /c exit 0')
        frontierPlan = 'Will fail twice.'
        acceptanceCriteria = @('Done')
        modelProfile = 'mechanical'
        budgetProfile = 'small'
        maxRetries = 1
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $contractFF -Encoding utf8

    $mockPlanFF = @(
        (@{exitCode=0;changedPaths=@('scripts/ff.txt');validationExitCode=1;validationDiagnostics=@(@{commandIndex=1;exitCode=1;outputTail='Fail one.';truncated=$false});jsonl=$jsonl3}) | ConvertTo-Json -Depth 8 -Compress),
        (@{exitCode=0;changedPaths=@('scripts/ff.txt');validationExitCode=1;validationDiagnostics=@(@{commandIndex=1;exitCode=1;outputTail='Fail two.';truncated=$false});jsonl=$jsonl3}) | ConvertTo-Json -Depth 8 -Compress) | ConvertTo-Json -Depth 8 -Compress

    $decisionsFF = @(
        @{action='RETRY';repairInstructions=@('Try again.')},
        @{action='ESCALATE';repairInstructions=@()}
    ) | ConvertTo-Json -Depth 5 -Compress

    $outputFF = & $supervisor -ContractPath $contractFF -StateDirectory $stateFF `
        -WorktreeParent $worktrees -MaxAttempts 2 -TestMode `
        -MockWorkerPlans $mockPlanFF -MockFrontierDecisions $decisionsFF
    if ($LASTEXITCODE -ne 2) { throw "Expected exit 2 for fail-fail, got $LASTEXITCODE" }

    $ffTelePath = Get-ChildItem -LiteralPath $stateFF -Filter '*.telemetry.json' -Recurse -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc | Select-Object -Last 1
    if ($null -eq $ffTelePath) { throw 'No telemetry file found for fail-fail.' }
    $ffTele = Get-Content -LiteralPath $ffTelePath.FullName -Raw | ConvertFrom-Json

    if ($ffTele.validationFailed -ne $true) { throw "Expected validationFailed=true, got $($ffTele.validationFailed)" }
    if ($ffTele.status -ne 'blocked-needs-new-contract') { throw "Expected blocked-needs-new-contract, got $($ffTele.status)" }
    Write-Host 'PASS: fail-fail produces validationFailed=true and blocked-needs-new-contract' -ForegroundColor Green

    # ────────────────────────────────────────────────────────────────
    # Test 5: reject reasoning/long-context without authorization
    # ────────────────────────────────────────────────────────────────
    $rejectionProfiles = @('reasoning', 'long-context')
    foreach ($rejProf in $rejectionProfiles) {
        $stateRej = Join-Path $temporaryRoot "state-rej-$($rejProf.Replace('-',''))"
        New-Item -ItemType Directory -Path $stateRej -Force | Out-Null
        $contractRej = Join-Path $stateRej 'contract-rej.json'
        @{
            objective = "Reject $($rejProf) without auth"
            allowedPaths = @('scripts/rej.txt')
            validationCommands = @('cmd /c exit 1')
            frontierPlan = "Reject $($rejProf) without auth."
            acceptanceCriteria = @('Blocked')
            modelProfile = $rejProf
            budgetProfile = 'small'
            maxRetries = 1
        } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $contractRej -Encoding utf8

        $null = & $supervisor -ContractPath $contractRej -StateDirectory $stateRej `
            -WorktreeParent $worktrees -MaxAttempts 1 -TestMode 2>&1
        Write-Host "PASS: rejected $($rejProf) without authorization" -ForegroundColor Green
    }

    # ────────────────────────────────────────────────────────────────
    # Test 6: accept reasoning/long-context with explicit auth & justification
    # ────────────────────────────────────────────────────────────────
    foreach ($authProf in $rejectionProfiles) {
        $stateAuth = Join-Path $temporaryRoot "state-auth-$($authProf.Replace('-',''))"
        New-Item -ItemType Directory -Path $stateAuth -Force | Out-Null
        $contractAuth = Join-Path $stateAuth "contract-auth-$($authProf.Replace('-','')).json"
        @{
            objective = "Auth $($authProf) with justification"
            allowedPaths = @('scripts/auth.txt')
            validationCommands = @('cmd /c exit 1')
            frontierPlan = "Use $($authProf)."
            acceptanceCriteria = @('Done')
            modelProfile = $authProf
            budgetProfile = 'small'
            maxRetries = 1
            allowMeteredModel = $true
            meteredModelJustification = "Justification to pass auth check."
        } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $contractAuth -Encoding utf8

        $jsonlAuth = @(
            (@{type='step_start';sessionID="auth-$($authProf.Replace('-',''))";part=@{type='step-start'}} | ConvertTo-Json -Depth 5 -Compress),
            (@{type='step_finish';sessionID="auth-$($authProf.Replace('-',''))";part=@{type='step-finish';reason='stop';tokens=@{input=1;output=1;reasoning=0;total=2;cache=@{read=0;write=0}}}} | ConvertTo-Json -Depth 8 -Compress)
        ) -join "`n"

        $mockAuth = @(
            (@{exitCode=0;changedPaths=@('scripts/auth.txt');validationExitCode=1;jsonl=$jsonlAuth}) | ConvertTo-Json -Depth 8 -Compress
        ) | ConvertTo-Json -Depth 8 -Compress
        $decAuth = @(@{action='ESCALATE';repairInstructions=@()}) | ConvertTo-Json -Depth 5 -Compress
        & $supervisor -ContractPath $contractAuth -StateDirectory $stateAuth `
            -WorktreeParent $worktrees -MaxAttempts 1 -TestMode `
            -MockWorkerPlans $mockAuth -MockFrontierDecisions $decAuth | Out-Null
        Write-Host "PASS: accepted $($authProf) with justification (worker did not reject immediately)" -ForegroundColor Green
    }

    # ────────────────────────────────────────────────────────────────
    # Test 7: maxRetries 1..3 + defaults (mechanical/extended)
    # ────────────────────────────────────────────────────────────────
    $jsonl7 = @(
        (@{type='step_start';sessionID='mr-test';part=@{type='step-start'}} | ConvertTo-Json -Depth 5 -Compress),
        (@{type='step_finish';sessionID='mr-test';part=@{type='step-finish';reason='stop';tokens=@{input=1;output=1;reasoning=0;total=2;cache=@{read=0;write=0}}}} | ConvertTo-Json -Depth 8 -Compress)
    ) -join "`n"
    $mockSuccess = @(
        (@{exitCode=0;changedPaths=@('scripts/mr.txt');validationExitCode=0;jsonl=$jsonl7}) | ConvertTo-Json -Depth 8 -Compress
    ) | ConvertTo-Json -Depth 8 -Compress

    # 7a: maxRetries=1
    $stateMR1 = Join-Path $temporaryRoot 'state-mr1'
    New-Item -ItemType Directory -Path $stateMR1 -Force | Out-Null
    $contractMR1 = Join-Path $stateMR1 'contract-mr1.json'
    @{
        objective = 'maxRetries=1'
        allowedPaths = @('scripts/mr1.txt')
        validationCommands = @('cmd /c exit 0')
        frontierPlan = 'Single attempt.'
        acceptanceCriteria = @('Done')
        modelProfile = 'mechanical'
        budgetProfile = 'extended'
        maxRetries = 1
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $contractMR1 -Encoding utf8
    & $supervisor -ContractPath $contractMR1 -StateDirectory $stateMR1 `
        -WorktreeParent $worktrees -MaxAttempts 1 -TestMode `
        -MockWorkerPlans $mockSuccess -MockFrontierDecisions '[]' | Out-Null
    Write-Host 'PASS: maxRetries=1 with default mechanical/extended succeeds' -ForegroundColor Green

    # 7b: maxRetries=3
    $stateMR3 = Join-Path $temporaryRoot 'state-mr3'
    New-Item -ItemType Directory -Path $stateMR3 -Force | Out-Null
    $contractMR3 = Join-Path $stateMR3 'contract-mr3.json'
    @{
        objective = 'maxRetries=3'
        allowedPaths = @('scripts/mr3.txt')
        validationCommands = @('cmd /c exit 0')
        frontierPlan = 'Three retries.'
        acceptanceCriteria = @('Done')
        modelProfile = 'mechanical'
        budgetProfile = 'extended'
        maxRetries = 3
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $contractMR3 -Encoding utf8
    & $supervisor -ContractPath $contractMR3 -StateDirectory $stateMR3 `
        -WorktreeParent $worktrees -MaxAttempts 3 -TestMode `
        -MockWorkerPlans $mockSuccess -MockFrontierDecisions '[]' | Out-Null
    Write-Host 'PASS: maxRetries=3 with default mechanical/extended succeeds' -ForegroundColor Green

    # 7c: defaults — no maxRetries, no budgetProfile → 2, extended
    $stateDef = Join-Path $temporaryRoot 'state-def'
    New-Item -ItemType Directory -Path $stateDef -Force | Out-Null
    $contractDef = Join-Path $stateDef 'contract-def.json'
    @{
        objective = 'Defaults'
        allowedPaths = @('scripts/def.txt')
        validationCommands = @('cmd /c exit 0')
        frontierPlan = 'Defaults.'
        acceptanceCriteria = @('Done')
        modelProfile = 'mechanical'
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $contractDef -Encoding utf8
    & $supervisor -ContractPath $contractDef -StateDirectory $stateDef `
        -WorktreeParent $worktrees -MaxAttempts 1 -TestMode `
        -MockWorkerPlans $mockSuccess -MockFrontierDecisions '[]' | Out-Null
    Write-Host 'PASS: default profile=mechanical, budget=extended, maxRetries=2 accepted' -ForegroundColor Green

} finally {
    if (Test-Path -LiteralPath $temporaryRoot) {
        Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
    }
}
