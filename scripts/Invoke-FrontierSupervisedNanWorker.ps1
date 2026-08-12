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
    $contract = Get-Content -LiteralPath $ContractPath -Raw | ConvertFrom-Json
    foreach ($field in @('objective','allowedPaths','validationCommands','frontierPlan','acceptanceCriteria')) {
        if (-not ($contract.PSObject.Properties.Name -contains $field)) { throw "Contract is missing $field." }
    }
    if ([string]::IsNullOrWhiteSpace($contract.objective) -or [string]::IsNullOrWhiteSpace($contract.frontierPlan)) { throw 'Contract text fields are invalid.' }
    if (@($contract.allowedPaths).Count -eq 0 -or @($contract.validationCommands).Count -eq 0 -or @($contract.acceptanceCriteria).Count -eq 0) { throw 'Contract arrays must not be empty.' }
    $baseSha = (& git -C $repoRoot rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $baseSha -notmatch '^[a-f0-9]{40}$') { throw 'Repository base SHA is unavailable.' }
    $failurePhase = 'test-input-validation'
    [object[]]$mockDecisions = if ($TestMode) { @($MockFrontierDecisions | ConvertFrom-Json) } else { @() }
    if ($TestMode -and ($MockWorkerPlans.Count -lt $MaxAttempts -or $mockDecisions.Count -lt $MaxAttempts)) { throw 'TestMode requires one worker plan and frontier decision per attempt.' }

    $repairInstructions = @()
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
            }
            $activePlan = (@($contract.frontierPlan) + @($repairInstructions)) -join "`nFrontier repair: "
            $workerParameters = @{
                TaskType='code';Objective=$contract.objective;AllowedPath=@($contract.allowedPaths)
                ValidationCommand=@($contract.validationCommands);MaxRetries=1;FallbackModels=@()
                BudgetProfile=$(if ($contract.budgetProfile) { $contract.budgetProfile } else { 'small' })
                ModelProfile=$(if ($contract.modelProfile) { $contract.modelProfile } else { 'mechanical' })
                DuplicateWindowSeconds=0;PlannedBy='frontier';FrontierPlan=$activePlan
                AcceptanceCriteria=@($contract.acceptanceCriteria);TelemetryOutputPath=$telemetryPath
            }
            if ($TestMode) { $workerParameters.TestMode=$true; $workerParameters.MockPlan=$MockWorkerPlans[$attempt-1] }
            $workerOutput = & (Join-Path $attemptRoot $workerRelativePath) @workerParameters *>&1
            $workerExit = $LASTEXITCODE
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
                    $patchText = (& git -C $attemptRoot diff --binary --no-ext-diff HEAD -- | Out-String)
                    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($patchText)) { throw 'Candidate patch evidence is missing.' }
                    [System.IO.File]::WriteAllText($patchPath, $patchText, $utf8)
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
                & git -C $repoRoot worktree remove --force $attemptRoot | Out-Null
                if ($LASTEXITCODE -ne 0) { throw 'Unable to remove isolated worker worktree.' }
            }
        }
        $attempts += $attemptEvidence
        $failurePhase = "frontier-review-$attempt"
        if ($TestMode) {
            $rawMock = $mockDecisions[$attempt-1]
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
    $result = [ordered]@{status=$status;baseSha=$baseSha;attempts=$attempts;decisions=$decisions;acceptedPatchPath=$(if ($status -eq 'COMPLETE') { $patchPath } else { $null })}
    Write-NewJson -Path (Join-Path $StateDirectory 'supervision-result.json') -Value $result
    Write-Output ($result | ConvertTo-Json -Depth 12 -Compress)
    if ($status -eq 'ESCALATE') { exit 2 }
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
