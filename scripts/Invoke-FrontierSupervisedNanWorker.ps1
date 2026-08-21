[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ContractPath,
    [Parameter(Mandatory)][string]$StateDirectory,
    [Parameter(Mandatory)][string]$WorktreeParent,
    [ValidateRange(1,3)][int]$MaxAttempts = 2,
    [ValidateRange(10,3600)][int]$FrontierTimeoutSeconds = 300,
    [switch]$TestMode,
    [string[]]$MockWorkerPlans = @(),
    [string]$MockFrontierDecisions = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$workerRelativePath = 'scripts\Invoke-NanWorker.ps1'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Get-Sha256Hex {
    param([byte[]]$Bytes)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return (($sha.ComputeHash($Bytes) | ForEach-Object { $_.ToString('x2') }) -join '') }
    finally { $sha.Dispose() }
}

function ConvertTo-CanonicalBytes {
    param([object]$Value)
    return $utf8.GetBytes(($Value | ConvertTo-Json -Depth 12 -Compress))
}

function Write-NewJson {
    param([string]$Path, [object]$Value)
    $bytes = ConvertTo-CanonicalBytes -Value $Value
    $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try { $stream.Write($bytes, 0, $bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
}

function Initialize-WorktreeDependencies {
    param([string]$RepositoryRoot, [string]$WorktreeRoot)
    $source = Join-Path $RepositoryRoot 'node_modules'
    $target = Join-Path $WorktreeRoot 'node_modules'
    if (-not (Test-Path -LiteralPath $source -PathType Container) -or (Test-Path -LiteralPath $target)) { return }
    $itemType = if ($env:OS -eq 'Windows_NT') { 'Junction' } else { 'SymbolicLink' }
    New-Item -ItemType $itemType -Path $target -Target $source -ErrorAction Stop | Out-Null
}

function Get-StaticQualitySummary {
    param([object]$AttemptEvidence)
    if (-not [bool]$AttemptEvidence.validationFailed) { return $null }
    if (-not [bool]$AttemptEvidence.patchAvailable -or [bool]$AttemptEvidence.contractViolation) { return $null }
    $diagnostics = @($AttemptEvidence.validationDiagnostics | Where-Object { $_ })
    if ($diagnostics.Count -eq 0) { return $null }
    if (@($diagnostics | Where-Object { $_.categoryCode -ne 'shift_left_static_quality' }).Count -gt 0) { return $null }
    if (@($diagnostics | Where-Object { [string]$_.normalizedFailureSignature -notmatch '^[a-f0-9]{64}$' }).Count -gt 0) { return $null }
    $signatures = @($diagnostics | ForEach-Object { [string]$_.normalizedFailureSignature } | Sort-Object -Unique)
    $aggregate = Get-Sha256Hex -Bytes (ConvertTo-CanonicalBytes -Value ([ordered]@{
        schemaVersion=1
        categoryCode='shift_left_static_quality'
        signatures=$signatures
        changedPaths=@($AttemptEvidence.changedPaths | Sort-Object -Unique)
    }))
    return @{diagnostics=$diagnostics;failureSignature=$aggregate}
}

function New-ShiftLeftRepairPacket {
    param([int]$Attempt, [object]$Summary)
    $findings = @($Summary.diagnostics | Sort-Object -Property normalizedFailureSignature -Unique | ForEach-Object {
        $instruction = if ($_.validationId -eq 'format') {
            'Run the repository formatter only on contract-allowed changed files, then rerun the declared format validation.'
        } else {
            'Fix only the reported static lint issues in contract-allowed changed files, then rerun the declared lint validation.'
        }
        [ordered]@{
            findingId=('shift-left-' + ([string]$_.normalizedFailureSignature).Substring(0,16))
            source='VALIDATION'
            categoryCode='shift_left_static_quality'
            validationId=[string]$_.validationId
            commandSha256=[string]$_.commandSha256
            instruction=$instruction
            evidenceHash=[string]$_.normalizedFailureSignature
        }
    })
    $body = [ordered]@{
        schemaVersion=1
        packetType='shift-left-static-quality'
        failedAttempt=$Attempt
        failureSignature=[string]$Summary.failureSignature
        findings=$findings
    }
    $packet = [ordered]@{}; foreach ($key in $body.Keys) { $packet[$key]=$body[$key] }
    $packet.packetHash = Get-Sha256Hex -Bytes (ConvertTo-CanonicalBytes -Value $body)
    return $packet
}

function Test-RepairPacketIntegrity {
    param([object]$Packet)
    if ([string]$Packet.packetHash -notmatch '^[a-f0-9]{64}$') { return $false }
    $body = [ordered]@{
        schemaVersion=$Packet.schemaVersion
        packetType=$Packet.packetType
        failedAttempt=$Packet.failedAttempt
        failureSignature=$Packet.failureSignature
        findings=@($Packet.findings)
    }
    return [string]$Packet.packetHash -eq (Get-Sha256Hex -Bytes (ConvertTo-CanonicalBytes -Value $body))
}

function Test-OutsideSource {
    param([string]$Path)
    $source = $repoRoot.TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
    $candidate = [System.IO.Path]::GetFullPath($Path).TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
    return -not $candidate.StartsWith($source, [System.StringComparison]::OrdinalIgnoreCase)
}

function Get-CodexLaunch {
    $node = (Get-Command node -ErrorAction Stop).Source
    if ($env:OS -ne 'Windows_NT') { return @{executable='codex';prefix=@()} }
    $roots = @($env:npm_config_prefix, $(if ($env:APPDATA) { Join-Path $env:APPDATA 'npm' })) | Where-Object { $_ }
    foreach ($root in $roots) {
        $script = Join-Path $root 'node_modules\@openai\codex\bin\codex.js'
        if (Test-Path -LiteralPath $script -PathType Leaf) { return @{executable=$node;prefix=@($script)} }
    }
    throw 'Codex launcher is unavailable.'
}

function ConvertTo-NativeArgument {
    param([string]$Value)
    if ($Value.Length -gt 0 -and $Value -notmatch '[\s"]') { return $Value }
    $builder = New-Object System.Text.StringBuilder
    [void]$builder.Append('"')
    $slashes = 0
    foreach ($character in $Value.ToCharArray()) {
        if ($character -eq '\') { $slashes++; continue }
        if ($character -eq '"') {
            [void]$builder.Append(('\' * (($slashes * 2) + 1)))
            [void]$builder.Append('"')
        } else {
            [void]$builder.Append(('\' * $slashes))
            [void]$builder.Append($character)
        }
        $slashes = 0
    }
    [void]$builder.Append(('\' * ($slashes * 2)))
    [void]$builder.Append('"')
    return $builder.ToString()
}

function Remove-IsolatedWorkerWorktree {
    param([string]$RepositoryRoot,[string]$WorktreePath)
    $git = (Get-Command git -ErrorAction Stop).Source
    $exitCode = -1
    $stderr = ''
    for ($cleanupAttempt = 1; $cleanupAttempt -le 4; $cleanupAttempt++) {
        if ($cleanupAttempt -gt 1) { Start-Sleep -Milliseconds (250 * ($cleanupAttempt - 1)) }
        $start = New-Object System.Diagnostics.ProcessStartInfo
        $start.FileName = $git
        $start.Arguments = (@('-C',$RepositoryRoot,'worktree','remove','--force',$WorktreePath) | ForEach-Object { ConvertTo-NativeArgument -Value $_ }) -join ' '
        $start.UseShellExecute = $false
        $start.CreateNoWindow = $true
        $start.RedirectStandardInput = $true
        $start.RedirectStandardOutput = $true
        $start.RedirectStandardError = $true
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $start
        if (-not $process.Start()) { return @{succeeded=$false;exitCode=-1;error='start-failed';attempts=$cleanupAttempt} }
        $process.StandardInput.Close()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $process.WaitForExit()
        $stderr = $stderrTask.GetAwaiter().GetResult()
        $stdoutTask.GetAwaiter().GetResult() | Out-Null
        $exitCode = $process.ExitCode
        $process.Dispose()
        if ($exitCode -eq 0) { break }
    }
    return @{
        succeeded=($exitCode -eq 0)
        exitCode=$exitCode
        error=$(if ([string]::IsNullOrWhiteSpace($stderr)) { $null } else { 'git-worktree-remove-failed' })
        attempts=$cleanupAttempt
    }
}

function Invoke-NativeCaptured {
    param([string]$Executable, [string[]]$Arguments, [string]$WorkingDirectory, [int]$TimeoutSeconds)
    $start = New-Object System.Diagnostics.ProcessStartInfo
    $start.FileName = $Executable
    $start.Arguments = (($Arguments | ForEach-Object { ConvertTo-NativeArgument -Value $_ }) -join ' ')
    $start.WorkingDirectory = $WorkingDirectory
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $start
    try {
        if (-not $process.Start()) { throw 'Unable to launch Codex frontier review.' }
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
            if ($env:OS -eq 'Windows_NT') { & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null }
            else { $process.Kill() }
            throw 'Codex frontier review timed out.'
        }
        return @{exitCode=$process.ExitCode;stdout=$stdoutTask.Result;stderr=$stderrTask.Result}
    } finally { $process.Dispose() }
}

function Get-AllowedActions {
    param([bool]$CandidateReady, [bool]$BudgetRemaining)
    if ($CandidateReady -and $BudgetRemaining) { return @('ACCEPT','RETRY','ESCALATE') }
    if ($BudgetRemaining) { return @('RETRY','ESCALATE') }
    if ($CandidateReady) { return @('ACCEPT','ESCALATE') }
    return @('ESCALATE')
}

function Invoke-CodexReview {
    param([int]$Attempt, [bool]$CandidateReady, [bool]$PatchAvailable, [string]$PatchPath, [object]$Evidence, [object]$Contract)
    $capsule = Join-Path $StateDirectory "frontier-review-$Attempt"
    New-Item -ItemType Directory -Path $capsule | Out-Null
    Write-NewJson -Path (Join-Path $capsule 'contract.json') -Value $Contract
    Write-NewJson -Path (Join-Path $capsule 'evidence.json') -Value $Evidence
    if ($PatchAvailable) { [System.IO.File]::Copy($PatchPath, (Join-Path $capsule 'candidate.patch'), $false) }
    $allowed = @(Get-AllowedActions -CandidateReady $CandidateReady -BudgetRemaining ($Attempt -lt $MaxAttempts))
    $schema = [ordered]@{
        type='object';additionalProperties=$false;required=@('action','repairInstructions');properties=[ordered]@{
            action=@{enum=$allowed}
            repairInstructions=@{type='array';maxItems=3;items=@{type='string';minLength=1;maxLength=500}}
        }
    }
    $schemaPath = Join-Path $capsule 'decision.schema.json'
    $outputPath = Join-Path $capsule 'decision.json'
    Write-NewJson -Path $schemaPath -Value $schema
    $terminal = if ($Attempt -ge $MaxAttempts) { 'The attempt budget is exhausted; RETRY is forbidden.' } else { '' }
    $prompt = "Act as the independent frontier reviewer. Read contract.json, evidence.json and candidate.patch when present. A failed candidate patch may be present solely to inform repair. ACCEPT only when evidence.json says candidateReady=true and deterministic checks passed. RETRY only with one to three short actionable repair instructions grounded in the patch and bounded diagnostics. Otherwise ESCALATE. $terminal Do not edit files or include reasoning."
    $launch = Get-CodexLaunch
    $arguments = @($launch.prefix) + @(
        'exec','--ephemeral','--ignore-user-config','--ignore-rules','--sandbox','read-only',
        '--skip-git-repo-check','--output-schema',$schemaPath,'-o',$outputPath,'--json',
        '--color','never','-C',$capsule,$prompt
    )
    $completed = Invoke-NativeCaptured -Executable $launch.executable -Arguments $arguments -WorkingDirectory $capsule -TimeoutSeconds $FrontierTimeoutSeconds
    if ($completed.exitCode -ne 0 -or -not (Test-Path -LiteralPath $outputPath -PathType Leaf)) {
        $failure = [ordered]@{exitCode=$completed.exitCode;stderrBytes=$utf8.GetByteCount($completed.stderr);stderrSha256=(Get-Sha256Hex -Bytes $utf8.GetBytes($completed.stderr))}
        Write-NewJson -Path (Join-Path $capsule 'review-failure.json') -Value $failure
        throw 'Codex frontier review failed.'
    }
    $raw = [System.IO.File]::ReadAllBytes($outputPath)
    if ($raw.Length -eq 0 -or $raw.Length -gt 8192) { throw 'Codex frontier decision is invalid.' }
    $decision = $utf8.GetString($raw) | ConvertFrom-Json
    $usageEvents = @()
    foreach ($line in @($completed.stdout -split "`r?`n")) {
        try {
            $event = $line | ConvertFrom-Json
            if ($event.type -eq 'turn.completed' -and $event.usage) { $usageEvents += $event.usage }
        } catch {}
    }
    if ($usageEvents.Count -ne 1) { throw 'Codex frontier usage evidence is missing or ambiguous.' }
    return @{action=$decision.action;repairInstructions=@($decision.repairInstructions);authorityEvidenceHash=(Get-Sha256Hex -Bytes $raw);frontierUsage=$usageEvents[0]}
}

function Assert-Decision {
    param([object]$Decision, [int]$Attempt, [bool]$CandidateReady)
    $allowed = @(Get-AllowedActions -CandidateReady $CandidateReady -BudgetRemaining ($Attempt -lt $MaxAttempts))
    if ($Decision.action -notin $allowed) { throw 'Frontier decision action is invalid for this attempt.' }
    $instructions = @($Decision.repairInstructions)
    if ($instructions.Count -gt 3 -or @($instructions | Where-Object { -not ($_ -is [string]) -or [string]::IsNullOrWhiteSpace($_) -or $_.Length -gt 500 }).Count -gt 0) {
        throw 'Frontier repair instructions are invalid.'
    }
    if ($Decision.action -eq 'RETRY' -and $instructions.Count -eq 0) { throw 'Frontier retry requires feedback.' }
    if ($Decision.action -ne 'RETRY' -and $instructions.Count -ne 0) { throw 'Only RETRY may contain repair instructions.' }
    $usageFields = @('input_tokens','cached_input_tokens','cache_write_input_tokens','output_tokens','reasoning_output_tokens')
    if (-not $Decision.frontierUsage) { throw 'Frontier usage evidence is missing.' }
    $actualUsageFields = if ($Decision.frontierUsage -is [System.Collections.IDictionary]) {
        @($Decision.frontierUsage.Keys | Sort-Object)
    } else {
        @($Decision.frontierUsage.PSObject.Properties.Name | Sort-Object)
    }
    if (($actualUsageFields -join ',') -ne (($usageFields | Sort-Object) -join ',')) { throw 'Frontier usage evidence fields are invalid.' }
    foreach ($field in $usageFields) {
        $amount = $Decision.frontierUsage.$field
        if (-not ($amount -is [int] -or $amount -is [long]) -or $amount -lt 0) { throw 'Frontier usage evidence values are invalid.' }
    }
}

$failurePhase = 'initialization'
$attempts = @()
$decisions = @()
$baseSha = $null
$stateCreated = $false
try {
    $failurePhase = 'path-validation'
    $ContractPath = [System.IO.Path]::GetFullPath($ContractPath)
    $StateDirectory = [System.IO.Path]::GetFullPath($StateDirectory)
    $WorktreeParent = [System.IO.Path]::GetFullPath($WorktreeParent)
    if (-not (Test-Path -LiteralPath $ContractPath -PathType Leaf)) { throw 'ContractPath must be a file.' }
    if (-not (Test-OutsideSource -Path $StateDirectory) -or -not (Test-OutsideSource -Path $WorktreeParent)) { throw 'State and worktree directories must be outside the source repository.' }
    if (Test-Path -LiteralPath $StateDirectory) { throw 'StateDirectory must not already exist.' }
    if (-not (Test-Path -LiteralPath $WorktreeParent -PathType Container)) { throw 'WorktreeParent must already exist.' }
    New-Item -ItemType Directory -Path $StateDirectory | Out-Null
    $stateCreated = $true

    $failurePhase = 'contract-validation'
    $contract = Get-Content -LiteralPath $ContractPath -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($field in @('objective','allowedPaths','validationCommands','frontierPlan','acceptanceCriteria')) {
        if (-not ($contract.PSObject.Properties.Name -contains $field)) { throw "Contract is missing $field." }
    }
    if ([string]::IsNullOrWhiteSpace($contract.objective) -or [string]::IsNullOrWhiteSpace($contract.frontierPlan)) { throw 'Contract text fields are invalid.' }
    if (@($contract.allowedPaths).Count -eq 0 -or @($contract.validationCommands).Count -eq 0 -or @($contract.acceptanceCriteria).Count -eq 0) { throw 'Contract arrays must not be empty.' }
    if ($contract.PSObject.Properties.Name -contains 'validationMayWriteAllowedPaths' -and $contract.validationMayWriteAllowedPaths -isnot [bool]) { throw 'Contract validationMayWriteAllowedPaths must be a JSON boolean.' }
    $baseSha = (& git -C $repoRoot rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $baseSha -notmatch '^[a-f0-9]{40}$') { throw 'Repository base SHA is unavailable.' }
    $failurePhase = 'test-input-validation'
    [object[]]$mockDecisions = if ($TestMode) { @($MockFrontierDecisions | ConvertFrom-Json) } else { @() }
    if ($TestMode -and $MockWorkerPlans.Count -lt $MaxAttempts) { throw 'TestMode requires one worker plan per possible attempt.' }

    $repairInstructions = @()
    $policyEvents = @()
    $seenStaticFailureSignatures = @{}
    $mockDecisionIndex = 0
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        $failurePhase = "worker-attempt-$attempt"
        $attemptRoot = if ($TestMode) { $repoRoot } else { Join-Path $WorktreeParent ("castilla-nan-attempt-$([guid]::NewGuid().ToString('N'))") }
        $telemetryPath = Join-Path $StateDirectory "attempt-$attempt.worker-telemetry.json"
        $patchPath = Join-Path $StateDirectory "attempt-$attempt.candidate.patch"
        $worktreeAdded = $false
        try {
            if (-not $TestMode) {
                & git -C $repoRoot worktree add --detach $attemptRoot $baseSha | Out-Null
                if ($LASTEXITCODE -ne 0) { throw 'Unable to create isolated worker worktree.' }
                $worktreeAdded = $true
                Initialize-WorktreeDependencies -RepositoryRoot $repoRoot -WorktreeRoot $attemptRoot
            }
            $activePlan = (@($contract.frontierPlan) + @($repairInstructions)) -join "`nBounded repair: "
            $workerParameters = @{
                TaskType='code';Objective=$contract.objective;AllowedPath=@($contract.allowedPaths)
                ValidationCommand=@($contract.validationCommands);MaxRetries=1;FallbackModels=@()
                BudgetProfile=$(if ($contract.budgetProfile) { $contract.budgetProfile } else { 'small' })
                ModelProfile=$(if ($contract.modelProfile) { $contract.modelProfile } else { 'mechanical' })
                DuplicateWindowSeconds=0;PlannedBy='frontier';FrontierPlan=$activePlan
                AcceptanceCriteria=@($contract.acceptanceCriteria);TelemetryOutputPath=$telemetryPath
            }
            if ($contract.PSObject.Properties.Name -contains 'maxObservedTokens') {
                $workerParameters.MaxObservedTokens = [int]$contract.maxObservedTokens
            }
            if ($contract.PSObject.Properties.Name -contains 'maxExecutionSeconds') {
                $workerParameters.MaxExecutionSeconds = [int]$contract.maxExecutionSeconds
            }
            if ($contract.PSObject.Properties.Name -contains 'maxStepsWithoutMutation') {
                $workerParameters.MaxStepsWithoutMutation = [int]$contract.maxStepsWithoutMutation
            }
            if ($contract.PSObject.Properties.Name -contains 'maxToolUses') {
                $workerParameters.MaxToolUses = [int]$contract.maxToolUses
            }
            if ($contract.PSObject.Properties.Name -contains 'createOnly' -and [bool]$contract.createOnly) {
                $workerParameters.CreateOnly = $true
            }
            if ($contract.PSObject.Properties.Name -contains 'validationMayWriteAllowedPaths') {
                # Opt-in switch: forward only the JSON boolean true; when absent
                # or false defaults to the worker's opt-in false behavior.
                if ([bool]$contract.validationMayWriteAllowedPaths) {
                    $workerParameters.ValidationMayWriteAllowedPaths = $true
                }
            }
            if ($TestMode) { $workerParameters.TestMode=$true; $workerParameters.MockPlan=$MockWorkerPlans[$attempt-1] }
            $previousErrorActionPreference = $ErrorActionPreference
            try {
                # Native stderr is worker evidence, not a supervisor-terminating
                # PowerShell error. The worker exit code and signed telemetry
                # remain the authority for success or failure.
                $ErrorActionPreference = 'Continue'
                $workerOutput = & (Join-Path $attemptRoot $workerRelativePath) @workerParameters *>&1
                $workerExit = $LASTEXITCODE
            } finally {
                $ErrorActionPreference = $previousErrorActionPreference
            }
            if (-not (Test-Path -LiteralPath $telemetryPath -PathType Leaf)) { throw 'Worker telemetry evidence is missing.' }
            $telemetry = Get-Content -LiteralPath $telemetryPath -Raw | ConvertFrom-Json
            $candidateReady = $workerExit -eq 0 -and $telemetry.status -eq 'awaiting-frontier-review'
            $patchAvailable = @($telemetry.changedPaths).Count -gt 0 -and -not [bool]$telemetry.contractViolation
            if ($patchAvailable) {
                $failurePhase = "patch-capture-$attempt"
                if ($TestMode) {
                    [System.IO.File]::WriteAllText($patchPath, "SIMULATED PATCH`n", $utf8)
                } else {
                    foreach ($changedPath in @($telemetry.changedPaths)) { & git -C $attemptRoot add -N -- $changedPath | Out-Null }
                    & git -C $attemptRoot diff --binary --no-ext-diff HEAD --output=$patchPath --
                    if ($LASTEXITCODE -ne 0) {
                        throw 'Candidate patch evidence is missing.'
                    } elseif (-not (Test-Path -LiteralPath $patchPath -PathType Leaf)) {
                        throw 'Candidate patch evidence is missing.'
                    } elseif ((Get-Item -LiteralPath $patchPath).Length -eq 0) {
                        throw 'Candidate patch evidence is missing.'
                    }
                }
            }
            $attemptEvidence = [ordered]@{
                attempt=$attempt;baseSha=$baseSha;status=$telemetry.status;candidateReady=$candidateReady
                patchAvailable=$patchAvailable;contractViolation=[bool]$telemetry.contractViolation
                validationFailed=[bool]$telemetry.validationFailed
                telemetrySha256=(Get-Sha256Hex -Bytes ([System.IO.File]::ReadAllBytes($telemetryPath)))
                patchSha256=$(if ($patchAvailable) { Get-Sha256Hex -Bytes ([System.IO.File]::ReadAllBytes($patchPath)) } else { $null })
                changedPaths=@($telemetry.changedPaths);tokensUsage=$telemetry.tokensUsage
                validationExitCodes=@($telemetry.attempts | ForEach-Object { $_.validationExitCode })
                validationDiagnostics=@($telemetry.attempts | ForEach-Object { @($_.validationDiagnostics) })
                terminationReasons=@($telemetry.attempts | ForEach-Object { $_.terminationReason })
            }
        } finally {
            if ($worktreeAdded) {
                $cleanupResult = Remove-IsolatedWorkerWorktree -RepositoryRoot $repoRoot -WorktreePath $attemptRoot
                if ($attemptEvidence) { $attemptEvidence.cleanup = $cleanupResult }
            }
        }
        $attempts += $attemptEvidence

        $staticSummary = Get-StaticQualitySummary -AttemptEvidence $attemptEvidence
        if ($staticSummary) {
            $repairPacket = New-ShiftLeftRepairPacket -Attempt $attempt -Summary $staticSummary
            if (-not (Test-RepairPacketIntegrity -Packet $repairPacket)) { throw 'Shift-left repair packet integrity check failed.' }
            $repairPacketPath = Join-Path $StateDirectory "attempt-$attempt.repair-packet.json"
            Write-NewJson -Path $repairPacketPath -Value $repairPacket

            if ($seenStaticFailureSignatures.ContainsKey($staticSummary.failureSignature)) {
                $failurePhase = "no-progress-$attempt"
                $noProgressBody = [ordered]@{
                    schemaVersion=1
                    status='NO_PROGRESS'
                    attempt=$attempt
                    firstSeenAttempt=[int]$seenStaticFailureSignatures[$staticSummary.failureSignature]
                    failureSignature=$staticSummary.failureSignature
                    repairPacketHash=$repairPacket.packetHash
                }
                $noProgress = [ordered]@{}; foreach ($key in $noProgressBody.Keys) { $noProgress[$key]=$noProgressBody[$key] }
                $noProgress.eventHash = Get-Sha256Hex -Bytes (ConvertTo-CanonicalBytes -Value $noProgressBody)
                Write-NewJson -Path (Join-Path $StateDirectory "attempt-$attempt.no-progress.json") -Value $noProgress
                $policyEvents += $noProgress
                $status='NO_PROGRESS'
                break
            }
            $seenStaticFailureSignatures[$staticSummary.failureSignature] = $attempt

            if ($attempt -lt $MaxAttempts) {
                $failurePhase = "shift-left-retry-$attempt"
                $policyBody = [ordered]@{
                    schemaVersion=1
                    attempt=$attempt
                    action='RETRY'
                    decisionOwner='broker-shift-left-policy'
                    failureSignature=$staticSummary.failureSignature
                    repairPacketHash=$repairPacket.packetHash
                    attemptTelemetrySha256=$attemptEvidence.telemetrySha256
                }
                $policyEvent = [ordered]@{}; foreach ($key in $policyBody.Keys) { $policyEvent[$key]=$policyBody[$key] }
                $policyEvent.eventHash = Get-Sha256Hex -Bytes (ConvertTo-CanonicalBytes -Value $policyBody)
                Write-NewJson -Path (Join-Path $StateDirectory "attempt-$attempt.policy-retry.json") -Value $policyEvent
                $policyEvents += $policyEvent
                $repairInstructions = @($repairPacket.findings | ForEach-Object { $_.instruction } | Sort-Object -Unique)
                continue
            }
        }

        $failurePhase = "frontier-review-$attempt"
        if ($TestMode) {
            if ($mockDecisionIndex -ge $mockDecisions.Count) { throw 'TestMode requires a Frontier decision for each attempt that reaches Frontier review.' }
            $rawMock = $mockDecisions[$mockDecisionIndex]
            $mockDecisionIndex++
            $rawBytes = ConvertTo-CanonicalBytes -Value $rawMock
            $decision = @{action=$rawMock.action;repairInstructions=@($rawMock.repairInstructions);authorityEvidenceHash=(Get-Sha256Hex -Bytes $rawBytes);frontierUsage=@{input_tokens=0;cached_input_tokens=0;cache_write_input_tokens=0;output_tokens=0;reasoning_output_tokens=0}}
        } else {
            $decision = Invoke-CodexReview -Attempt $attempt -CandidateReady $candidateReady -PatchAvailable $patchAvailable -PatchPath $patchPath -Evidence $attemptEvidence -Contract $contract
        }
        Assert-Decision -Decision $decision -Attempt $attempt -CandidateReady $candidateReady
        $decisionId = 'decision_' + (Get-Sha256Hex -Bytes (ConvertTo-CanonicalBytes -Value ([ordered]@{attempt=$attempt;evidence=$attemptEvidence;authority=$decision.authorityEvidenceHash}))).Substring(0,16)
        $body = [ordered]@{schemaVersion=1;attempt=$attempt;decisionId=$decisionId;action=$decision.action;repairInstructions=@($decision.repairInstructions);authorityEvidenceHash=$decision.authorityEvidenceHash;frontierUsage=$decision.frontierUsage;attemptEvidence=$attemptEvidence}
        $event = [ordered]@{}; foreach ($key in $body.Keys) { $event[$key]=$body[$key] }
        $event.decisionHash = Get-Sha256Hex -Bytes (ConvertTo-CanonicalBytes -Value $body)
        $failurePhase = "decision-persist-$attempt"
        Write-NewJson -Path (Join-Path $StateDirectory "attempt-$attempt.frontier-decision.json") -Value $event
        $decisions += $event
        if ($decision.action -eq 'ACCEPT') { $status='COMPLETE'; break }
        if ($decision.action -eq 'ESCALATE') { $status='ESCALATE'; break }
        $repairInstructions = @($decision.repairInstructions)
    }
    if (-not $status) { throw 'Supervisor exhausted without a terminal decision.' }
    $result = [ordered]@{status=$status;baseSha=$baseSha;attempts=$attempts;decisions=$decisions;policyEvents=$policyEvents;acceptedPatchPath=$(if ($status -eq 'COMPLETE') { $patchPath } else { $null })}
    Write-NewJson -Path (Join-Path $StateDirectory 'supervision-result.json') -Value $result
    Write-Output ($result | ConvertTo-Json -Depth 12 -Compress)
    if ($status -in @('ESCALATE','NO_PROGRESS')) { exit 2 }
    exit 0
} catch {
    $messageBytes = $utf8.GetBytes([string]$_.Exception.Message)
    $failure = [ordered]@{
        schemaVersion=1;status='FAILED';phase=$failurePhase;baseSha=$baseSha
        attempts=@($attempts);decisions=@($decisions)
        errorType=$_.Exception.GetType().FullName
        errorMessageSha256=(Get-Sha256Hex -Bytes $messageBytes)
    }
    try {
        if ($stateCreated -and -not [string]::IsNullOrWhiteSpace($StateDirectory) -and (Test-Path -LiteralPath $StateDirectory -PathType Container)) {
            $failurePath = Join-Path $StateDirectory 'supervision-result.json'
            if (-not (Test-Path -LiteralPath $failurePath)) { Write-NewJson -Path $failurePath -Value $failure }
        }
    } catch {}
    [Console]::Error.WriteLine('error: frontier supervision failed')
    exit 1
}
