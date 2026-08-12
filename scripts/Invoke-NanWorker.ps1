[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('code','bulletin')][string]$TaskType,
    [Parameter(Mandatory)][ValidateNotNullOrEmpty()][string]$Objective,
    [string[]]$AllowedPath = @(),
    [string[]]$InputPath = @(),
    [string[]]$ValidationCommand = @(),
    [ValidateSet('default','json')][string]$Format = 'json',
    [ValidateRange(1,3)][int]$MaxRetries = 1,
    [ValidateSet('small','batch','research','extended')][string]$BudgetProfile = 'small',
    [ValidateSet('auto','mechanical','reasoning','long-context')][string]$ModelProfile = 'auto',
    [int]$MaxObservedTokens = 0,
    [ValidateRange(10,3600)][int]$MaxExecutionSeconds = 300,
    [ValidateRange(0,86400)][int]$DuplicateWindowSeconds = 3600,
    [string[]]$FallbackModels = @(),
    [switch]$DryRun,
    [switch]$AllowNoChanges,
    [switch]$TestMode,
    [string]$MockPlan = '',
    [string]$PlannedBy = '',
    [string]$FrontierPlan = '',
    [string[]]$AcceptanceCriteria = @(),
    [string]$TelemetryOutputPath = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$repoPrefix = $repoRoot.TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
$tdir = Join-Path $repoRoot '.agent-runs'
if (-not (Test-Path -LiteralPath $tdir)) { New-Item -ItemType Directory -Path $tdir -Force | Out-Null }

function Write-TelemetryRecord {
    param([hashtable]$Value, [string]$TelemetryId)
    $target = if ([string]::IsNullOrWhiteSpace($TelemetryOutputPath)) {
        Join-Path $tdir "$TelemetryId.json"
    } else {
        if (-not [System.IO.Path]::IsPathRooted($TelemetryOutputPath)) {
            throw 'TelemetryOutputPath must be absolute.'
        }
        [System.IO.Path]::GetFullPath($TelemetryOutputPath)
    }
    $parent = Split-Path -Parent $target
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
        throw 'TelemetryOutputPath parent directory does not exist.'
    }
    $stream = [System.IO.File]::Open($target, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try {
        # Preserve the existing Windows PowerShell 5.1 telemetry encoding so
        # legacy Get-Content consumers decode non-ASCII evidence correctly.
        $writer = New-Object System.IO.StreamWriter($stream, (New-Object System.Text.UTF8Encoding($true)))
        try { $writer.Write(($Value | ConvertTo-Json -Depth 5)) } finally { $writer.Dispose() }
    } finally {
        if ($stream) { $stream.Dispose() }
    }
    return $target
}

# Normalize
$AllowedPath = @($AllowedPath | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$InputPath = @($InputPath | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$AcceptanceCriteria = @($AcceptanceCriteria | ForEach-Object { $_.Trim() } | Where-Object { $_ })

$budgetProfiles = @{
    small = 50000
    batch = 150000
    research = 300000
    extended = 400000
}
if ($MaxObservedTokens -ne 0 -and ($MaxObservedTokens -lt 1000 -or $MaxObservedTokens -gt 1000000)) {
    throw 'MaxObservedTokens must be 0 (use BudgetProfile) or between 1000 and 1000000.'
}
$effectiveMaxObservedTokens = if ($MaxObservedTokens -ne 0) {
    $MaxObservedTokens
} else {
    [int]$budgetProfiles[$BudgetProfile]
}
$budgetSource = if ($MaxObservedTokens -ne 0) { 'override' } else { 'profile' }

# ── Contract validation ──
if ($TaskType -eq 'code' -and $AllowedPath.Count -eq 0) { throw 'Code delegation requires at least one -AllowedPath contract boundary.' }
if ($TaskType -eq 'bulletin') {
    if ($AllowedPath.Count -gt 0) { throw 'Bulletin delegation is read-only and does not accept -AllowedPath.' }
    if ($InputPath.Count -eq 0) { throw 'Bulletin requires at least one -InputPath.' }
    foreach ($ip in $InputPath) {
        $full = if ([System.IO.Path]::IsPathRooted($ip)) { [System.IO.Path]::GetFullPath($ip) } else { [System.IO.Path]::GetFullPath((Join-Path $repoRoot $ip)) }
        if (-not $full.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)) { throw "InputPath must stay inside the repository: $ip" }
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { throw "InputPath does not exist: $ip" }
    }
}

# ── Frontier contract enforcement (code only, fail-closed) ──
if ($TaskType -eq 'code') {
    if ($PlannedBy -ne 'frontier') { throw 'PlannedBy must be exactly "frontier" for code delegation.' }
    if ([string]::IsNullOrWhiteSpace($FrontierPlan)) { throw 'FrontierPlan is required and must not be empty.' }
    if ($AcceptanceCriteria.Count -eq 0) { throw 'AcceptanceCriteria is required, must contain at least one item.' }
    # ValidationCommand required even in DryRun for code tasks
    if ($ValidationCommand.Count -eq 0) { throw 'Code delegation requires at least one -ValidationCommand.' }
    if (-not $TestMode -and -not $DryRun) {
        $gitDir = (& git -C $repoRoot rev-parse --path-format=absolute --git-dir).Trim()
        $commonDir = (& git -C $repoRoot rev-parse --path-format=absolute --git-common-dir).Trim()
        if ($LASTEXITCODE -ne 0 -or $gitDir -eq $commonDir) {
            throw 'Live code delegation requires a linked Git worktree created by the frontier orchestrator.'
        }
        $dirty = (& git -C $repoRoot status --porcelain | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or $dirty) {
            throw 'Live code delegation requires a clean isolated worktree.'
        }
    }
}

# ── JSONL token parser (PS 5.1 compatible) ──
function Parse-JsonlTokens {
    param([string]$Jsonl)
    $r = @{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0}
    if ([string]::IsNullOrWhiteSpace($Jsonl)) { throw 'OpenCode returned empty JSONL.' }
    $sessionId = $null
    $stepOpen = $false
    $terminalCount = 0
    $lastWasTerminal = $false
    foreach ($line in ($Jsonl -split "`n" | Where-Object { $_.Trim() })) {
        $ev = try { $line | ConvertFrom-Json } catch { throw 'OpenCode returned malformed JSONL.' }
        if ($ev.type -notin @('step_start','text','tool_use','step_finish')) { throw "Unexpected OpenCode event type: $($ev.type)" }
        if (-not $ev.sessionID) { throw 'OpenCode event is missing sessionID.' }
        if ($sessionId -and $ev.sessionID -ne $sessionId) { throw 'OpenCode output contains multiple sessions.' }
        $sessionId = $ev.sessionID
        $lastWasTerminal = $false
        if ($ev.type -eq 'step_start') {
            if ($stepOpen -or $ev.part.type -ne 'step-start') { throw 'Malformed OpenCode step start.' }
            $stepOpen = $true
        } elseif ($ev.type -eq 'step_finish') {
            if (-not $stepOpen -or $ev.part.type -ne 'step-finish' -or $ev.part.reason -notin @('tool-calls','stop')) { throw 'Malformed OpenCode step finish.' }
            $stepOpen = $false
            if ($ev.part.reason -eq 'stop') { $terminalCount++; $lastWasTerminal = $true }
        } elseif (-not $stepOpen) {
            throw 'OpenCode event occurred outside a step.'
        }
        if ($ev.type -eq 'step_finish' -and $ev.part.tokens) {
            $t = $ev.part.tokens
            if ($t.input) { $r.input += [int]$t.input }
            if ($t.output) { $r.output += [int]$t.output }
            if ($t.reasoning) { $r.reasoning += [int]$t.reasoning }
            if ($t.cache) {
                if ($t.cache.read) { $r.cacheRead += [int]$t.cache.read }
                if ($t.cache.write) { $r.cacheWrite += [int]$t.cache.write }
            }
            $observedTotal = [long]$t.input + [long]$t.output + [long]$t.reasoning
            if ($t.cache) { $observedTotal += [long]$t.cache.read + [long]$t.cache.write }
            if ([long]$t.total -gt $observedTotal) { $observedTotal = [long]$t.total }
            $r.total += $observedTotal
        }
    }
    if ($stepOpen -or $terminalCount -ne 1 -or -not $lastWasTerminal) { throw 'OpenCode output has no unique final terminal step.' }
    $r.sessionId = $sessionId
    return $r
}

function Get-JsonlDraftOutput {
    param([string]$Jsonl)
    $parts = New-Object 'System.Collections.Generic.List[string]'
    foreach ($line in ($Jsonl -split "`n" | Where-Object { $_.Trim() })) {
        $event = try { $line | ConvertFrom-Json } catch { continue }
        if ($event.type -eq 'text' -and $event.part -and $event.part.text) {
            $parts.Add([string]$event.part.text)
        }
    }
    return ($parts -join "`n").Trim()
}

# ── Snapshot helpers ──
function Get-Snapshot {
    $s = @{}
    foreach ($rel in (& git -C $repoRoot ls-files --cached --others --exclude-standard 2>&1 | Where-Object { $_ })) {
        $abs = Join-Path $repoRoot $rel
        if (Test-Path -LiteralPath $abs -PathType Leaf) {
            try { $s[$rel.Replace('\','/')] = (Get-FileHash -Algorithm SHA256 -LiteralPath $abs).Hash } catch {}
        }
    }
    return $s
}

function Test-AllowedPath {
    param([string]$p, [string[]]$patterns)
    $p = $p.Replace('\','/').TrimStart('./')
    foreach ($pat in $patterns) {
        $pat = $pat.Replace('\','/').TrimStart('./')
        if ($p -like $pat) { return $true }
        if ($pat -notmatch '[*?\[]' -and $p.StartsWith($pat.TrimEnd('/') + '/', [StringComparison]::OrdinalIgnoreCase)) { return $true }
    }
    return $false
}

# ── Model routing (premium glm5.2 is deliberately unsupported) ──
$primaryModel = switch ($ModelProfile) {
    'reasoning' { 'nan/deepseek-v4-flash' }
    'long-context' { 'nan/mimo-v2.5' }
    default { if ($TaskType -eq 'code') { 'nan/qwen3.6' } else { 'nan/gemma4' } }
}
$primaryAgent = if ($TaskType -eq 'code') { 'nan-code' } else { 'nan-bulletin' }
$allowedNanModels = @('nan/qwen3.6','nan/gemma4','nan/deepseek-v4-flash','nan/mimo-v2.5')
$forbiddenFallbacks = @($FallbackModels | Where-Object { $_ -match '(?i)(^|/)glm5\.2($|[-:])' })
if ($forbiddenFallbacks.Count -gt 0) {
    throw "Unsupported or premium NAN fallback model: $($forbiddenFallbacks -join ', ')"
}

# ── SHA-256 from string (PS 5.1 compatible) ──
function Compute-StringSha256 {
    param([string]$InputString)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($InputString)
    $hashBytes = $sha.ComputeHash($bytes)
    $sha.Dispose()
    return -join ($hashBytes | ForEach-Object { $_.ToString('x2') })
}

function ConvertTo-NativeArgument {
    param([AllowEmptyString()][string]$Argument)
    if ($Argument -notmatch '[\s"]') { return $Argument }
    $quoted = '"'
    $slashes = 0
    foreach ($char in $Argument.ToCharArray()) {
        if ($char -eq '\') {
            $slashes++
            continue
        }
        if ($char -eq '"') {
            if ($slashes -gt 0) { $quoted += (('\' * ($slashes * 2)) -join '') }
            $quoted += '\"'
        } else {
            if ($slashes -gt 0) { $quoted += (('\' * $slashes) -join '') }
            $quoted += $char
        }
        $slashes = 0
    }
    if ($slashes -gt 0) { $quoted += (('\' * ($slashes * 2)) -join '') }
    return $quoted + '"'
}

function Add-ObservedTokensFromLine {
    param([string]$Line, [hashtable]$Usage)
    if ([string]::IsNullOrWhiteSpace($Line)) { return }
    $event = try { $Line | ConvertFrom-Json } catch { return }
    if ($event.type -ne 'step_finish' -or -not $event.part.tokens) { return }
    $tokens = $event.part.tokens
    $Usage.input += [long]$tokens.input
    $Usage.output += [long]$tokens.output
    $Usage.reasoning += [long]$tokens.reasoning
    if ($tokens.cache) {
        $Usage.cacheRead += [long]$tokens.cache.read
        $Usage.cacheWrite += [long]$tokens.cache.write
    }
    $eventTotal = [long]$tokens.input + [long]$tokens.output + [long]$tokens.reasoning
    if ($tokens.cache) { $eventTotal += [long]$tokens.cache.read + [long]$tokens.cache.write }
    if ([long]$tokens.total -gt $eventTotal) { $eventTotal = [long]$tokens.total }
    $Usage.total += $eventTotal
    if (-not $Usage.sessionId -and $event.sessionID) { $Usage.sessionId = $event.sessionID }
}

function Stop-WorkerProcessTree {
    param([System.Diagnostics.Process]$Process)
    if (-not $Process -or $Process.HasExited) { return }
    # The process may exit between HasExited and taskkill.  On Windows PowerShell,
    # taskkill's harmless "process not found" stderr becomes a terminating error
    # because the broker runs with ErrorActionPreference=Stop.  Termination is
    # best-effort; budget/timeout telemetry must still be persisted.
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'SilentlyContinue'
        & taskkill.exe /PID $Process.Id /T /F *> $null
    } catch {
        # A raced process exit is already the desired end state.
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    try { $Process.WaitForExit(5000) | Out-Null } catch {}
}

function Invoke-OpenCodeBudgeted {
    param([string[]]$Arguments, [int]$TokenBudget, [int]$TimeoutSeconds)
    $rawLines = New-Object 'System.Collections.Generic.List[string]'
    $stderrLines = New-Object 'System.Collections.Generic.List[string]'
    $usage = @{input=0L;output=0L;reasoning=0L;cacheRead=0L;cacheWrite=0L;total=0L;sessionId=$null}
    $commandCandidates = @(Get-Command opencode -All -ErrorAction Stop)
    $executable = @($commandCandidates | Where-Object { $_.Source -like '*.exe' } | Select-Object -First 1).Source
    if (-not $executable) {
        $cmdShim = @($commandCandidates | Where-Object { $_.Source -like '*.cmd' } | Select-Object -First 1).Source
        if ($cmdShim) {
            $npmBinary = Join-Path (Split-Path -Parent $cmdShim) 'node_modules\opencode-ai\bin\opencode.exe'
            if (Test-Path -LiteralPath $npmBinary -PathType Leaf) { $executable = $npmBinary }
        }
    }
    if (-not $executable) { throw 'Could not resolve the native opencode executable behind the PowerShell/npm shim.' }
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $executable
    $startInfo.Arguments = (($Arguments | ForEach-Object { ConvertTo-NativeArgument -Argument $_ }) -join ' ')
    $startInfo.WorkingDirectory = $repoRoot
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    if (-not $process.Start()) { throw 'Failed to start OpenCode.' }
    $stdoutTask = $process.StandardOutput.ReadLineAsync()
    $stderrTask = $process.StandardError.ReadLineAsync()
    $stdoutDone = $false
    $stderrDone = $false
    $watch = [System.Diagnostics.Stopwatch]::StartNew()
    $terminationReason = $null
    try {
        while (-not $process.HasExited -or -not $stdoutDone -or -not $stderrDone) {
            if (-not $stdoutDone -and $stdoutTask.IsCompleted) {
                $line = $stdoutTask.GetAwaiter().GetResult()
                if ($null -eq $line) {
                    $stdoutDone = $true
                } else {
                    $rawLines.Add($line)
                    Add-ObservedTokensFromLine -Line $line -Usage $usage
                    $stdoutTask = $process.StandardOutput.ReadLineAsync()
                }
            }
            if (-not $stderrDone -and $stderrTask.IsCompleted) {
                $errorLine = $stderrTask.GetAwaiter().GetResult()
                if ($null -eq $errorLine) {
                    $stderrDone = $true
                } else {
                    $stderrLines.Add($errorLine)
                    $stderrTask = $process.StandardError.ReadLineAsync()
                }
            }
            if (-not $terminationReason -and $usage.total -gt $TokenBudget) {
                $terminationReason = 'token-budget'
                Stop-WorkerProcessTree -Process $process
            }
            if (-not $terminationReason -and $watch.Elapsed.TotalSeconds -ge $TimeoutSeconds) {
                $terminationReason = 'timeout'
                Stop-WorkerProcessTree -Process $process
            }
            if ($process.HasExited -and $stdoutDone -and $stderrDone) { break }
            Start-Sleep -Milliseconds 100
        }
        try { $process.WaitForExit() } catch {}
        $exitCode = if ($terminationReason) { 1 } else { $process.ExitCode }
        $raw = $rawLines -join "`n"
        $draftOutput = ''
        if (-not $terminationReason) {
            $usage = Parse-JsonlTokens -Jsonl $raw
            $draftOutput = Get-JsonlDraftOutput -Jsonl $raw
        }
        return @{exitCode=$exitCode;tokens=$usage;terminationReason=$terminationReason;stderr=($stderrLines -join "`n");draftOutput=$draftOutput}
    } finally {
        $watch.Stop()
        $process.Dispose()
    }
}

$headSha = if ($TestMode -or $DryRun) { 'simulated' } else { (& git -C $repoRoot rev-parse HEAD).Trim() }
$contractMaterial = [ordered]@{
    taskType=$TaskType;objective=$Objective;allowedPaths=@($AllowedPath);inputPaths=@($InputPath)
    validationCommands=@($ValidationCommand);frontierPlan=$FrontierPlan;acceptanceCriteria=@($AcceptanceCriteria);headSha=$headSha
} | ConvertTo-Json -Depth 5 -Compress
$contractHash = Compute-StringSha256 -InputString $contractMaterial
$contractMutex = $null
if (-not $TestMode -and -not $DryRun) {
    $contractMutex = New-Object System.Threading.Mutex($false, "Local\NanWorker-$contractHash")
    if (-not $contractMutex.WaitOne(0)) { throw "An identical NAN contract is already running: $contractHash" }
    if ($DuplicateWindowSeconds -gt 0) {
        $cutoff = [DateTime]::UtcNow.AddSeconds(-$DuplicateWindowSeconds)
        $duplicate = Get-ChildItem -LiteralPath $tdir -Filter '*.json' -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTimeUtc -ge $cutoff } |
            ForEach-Object { try { Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json } catch {} } |
            Where-Object { $_.contract.hash -eq $contractHash } |
            Select-Object -First 1
        if ($duplicate) { throw "An identical NAN contract ran within the last $DuplicateWindowSeconds seconds: $contractHash" }
    }
}

# ── DryRun ──
if ($DryRun) {
    Write-Host "[DryRun] TaskType=$TaskType Objective=$Objective ModelProfile=$ModelProfile Model=$primaryModel Agent=$primaryAgent Retries=$MaxRetries Fallbacks=$($FallbackModels -join ',') Allowed=$($AllowedPath -join ',')" -ForegroundColor Yellow
    $tid = [guid]::NewGuid().ToString('N')
    $fc = @{}
    if ($TaskType -eq 'code') {
        $planSha = Compute-StringSha256 -InputString $FrontierPlan
        $fc = @{plannedBy=$PlannedBy;planHash=$planSha;acceptanceCriteriaCount=$AcceptanceCriteria.Count;reviewRequired=$true}
    }
    $dryRunTelemetry = @{telemetryId=$tid;simulated=[bool]$true;taskType=$TaskType;selectedModel=$primaryModel;attempts=@();changedPaths=@();contractViolation=$false;validationFailed=$false;tokensUsage=@{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0};success=$true;status='dry-run';frontierContract=$fc;contract=@{hash=$contractHash;headSha=$headSha;duplicateWindowSeconds=$DuplicateWindowSeconds};launch=@{budgetProfile=$BudgetProfile;budgetSource=$budgetSource;maxObservedTokens=$effectiveMaxObservedTokens;maxExecutionSeconds=$MaxExecutionSeconds}}
    $writtenTelemetryPath = Write-TelemetryRecord -Value $dryRunTelemetry -TelemetryId $tid
    Write-Host "Telemetry: $writtenTelemetryPath" -ForegroundColor DarkGray
    exit 0
}

# ── Model list ──
$modelList = @()
if ($TaskType -eq 'bulletin') {
    if (-not $DryRun -and -not $TestMode) {
        # Live availability check for bulletin (gemma4 only)
        try {
            $modelOutput = & opencode models nan 2>&1 | Out-String
            $availableModels = @($modelOutput -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -match '^nan/' })
            if ($availableModels -notcontains $primaryModel) {
                throw "Model $primaryModel is not available"
            }
            $modelList = @($primaryModel)
        } catch {
            Write-Warning "Model availability check failed: $_"
            throw "Model $primaryModel is not available"
        }
    } else {
        $modelList = @($primaryModel)
    }
} else {
    # Code: primary + official fallbacks checked against availability
    if (-not $DryRun -and -not $TestMode) {
        try {
            $modelOutput = & opencode models nan 2>&1 | Out-String
            $availableModels = @($modelOutput -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -match '^nan/' })
            if ($availableModels -notcontains $primaryModel) {
                throw "Primary model $primaryModel is not available"
            }
            $officialFallbacks = @('nan/mimo-v2.5','nan/deepseek-v4-flash','nan/qwen3.6') | Where-Object { $_ -ne $primaryModel }
            $availableFallbacks = @($officialFallbacks | Where-Object { $_ -in $FallbackModels -and $_ -in $availableModels })
            $modelList = @($primaryModel) + $availableFallbacks
            if ($modelList.Count -eq 0) {
                throw "No fallback models available from $($FallbackModels -join ',')"
            }
        } catch {
            Write-Warning "Model availability check failed: $_"
            throw "Models not available: $_"
        }
    } else {
        $modelList = @($primaryModel) + @(@('nan/mimo-v2.5','nan/deepseek-v4-flash','nan/qwen3.6') | Where-Object { $_ -in $FallbackModels -and $_ -ne $primaryModel })
    }
}

# ── Parse MockPlan ──
$mockPlans = @()
if ($TestMode -and -not [string]::IsNullOrWhiteSpace($MockPlan)) {
    try {
        $parsedMockPlan = $MockPlan | ConvertFrom-Json
        if ($parsedMockPlan -is [System.Array]) { $mockPlans = $parsedMockPlan } else { $mockPlans = @($parsedMockPlan) }
    } catch { $mockPlans = @() }
}

# ── Execution ──
$beforeSnapshot = if ($TaskType -eq 'code' -and -not $TestMode) { Get-Snapshot } else { @{} }
$attempts = @()
$successResult = $null
$changedPaths = @()
$contractViolation = $false
$validationFailed = $false
$tokenBudgetExceeded = $false
$executionTimedOut = $false
$planIndex = 0
$totalAttempts = 0

:modelLoop foreach ($candidateModel in $modelList) {
    $candidateAgent = if ($candidateModel -eq $primaryModel) { $primaryAgent } else { 'nan-code' }
    for ($r = 0; $r -lt $MaxRetries; $r++) {
        $totalAttempts++
        $attempt = @{model=$candidateModel;agent=$candidateAgent;attempt=$totalAttempts;retry=($r+1);exitCode=1;tokens=@{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0};changedPaths=@();validationExitCode=$null;validationDiagnostics=@();draftOutput=''}
        $mp = $null

        if ($TestMode) {
            if ($planIndex -lt $mockPlans.Count) { $mp = $mockPlans[$planIndex]; $planIndex++ }
            if ($mp) {
                $attempt.exitCode = if ($mp.exitCode -ne $null) { [int]$mp.exitCode } else { 0 }
                if ($mp.jsonl) {
                    $attempt.tokens = Parse-JsonlTokens -Jsonl $mp.jsonl
                    $attempt.draftOutput = Get-JsonlDraftOutput -Jsonl $mp.jsonl
                }
                $attempt.changedPaths = if ($mp.changedPaths) { @($mp.changedPaths) } else { @() }
                if ($mp.terminationReason) { $attempt.terminationReason = [string]$mp.terminationReason }
                # Support both singular validationExitCode and list [$codes]
                $rawVe = $mp.validationExitCode
                if ($rawVe -eq $null) {
                    $attempt.validationExitCode = 0
                } elseif ($rawVe -is [System.Collections.Generic.List[int]] -or ($rawVe -is [array] -and $rawVe.Count -gt 1)) {
                    $computedVe = 0
                    foreach ($v in $rawVe) {
                        if ([int]$v -ne 0) { $computedVe = [int]$v; break }
                    }
                    $attempt.validationExitCode = $computedVe
                } else {
                    $attempt.validationExitCode = [int]$rawVe
                }
                if ($mp.validationDiagnostics) { $attempt.validationDiagnostics = @($mp.validationDiagnostics) }
            }
            Write-Host ("Attempt " + $totalAttempts + ": ${candidateAgent} -> ${candidateModel} (Mock) exitCode=" + $attempt.exitCode) -ForegroundColor Cyan
        } else {
            # Live invocation
            $opts = @('run','--pure','--dir',$repoRoot,'--model',$candidateModel,'--agent',$candidateAgent,'--format','json','--title',"orchestrated-$TaskType")
            foreach ($f in $InputPath) { $opts += @('--file',$f) }
            $contract = @("TASK TYPE: $TaskType","OBJECTIVE: $Objective")
            if ($TaskType -eq 'code') {
                $contract += "FRONTIER PLAN: $FrontierPlan"
                $contract += "ACCEPTANCE CRITERIA: $($AcceptanceCriteria -join "`n")"
            }
            if ($AllowedPath.Count -gt 0) { $contract += "ALLOWED PATHS: $($AllowedPath -join ', ')" }
            if ($ValidationCommand.Count -gt 0) { $contract += "REQUIRED VALIDATION: $($ValidationCommand -join ' ; ')" }
            $contract += 'Do not commit, push, publish, deploy, or expand this contract.'
            $opts += @('--', ($contract -join "`n"))
            Write-Host ("Attempt " + $totalAttempts + ": ${candidateAgent} -> ${candidateModel}") -ForegroundColor Cyan
            $liveResult = Invoke-OpenCodeBudgeted -Arguments $opts -TokenBudget $effectiveMaxObservedTokens -TimeoutSeconds $MaxExecutionSeconds
            $attempt.exitCode = $liveResult.exitCode
            $attempt.tokens = $liveResult.tokens
            $attempt.terminationReason = $liveResult.terminationReason
            $attempt.draftOutput = $liveResult.draftOutput
        }

        # Preserve bounded evidence even when NAN or deterministic validation
        # fails. The frontier supervisor needs the partial patch to issue a
        # useful repair contract from the original base SHA.
        if ($TaskType -eq 'code' -and -not $TestMode) {
            $after = Get-Snapshot
            $all = @($beforeSnapshot.Keys) + @($after.Keys) | Sort-Object -Unique
            $attempt.changedPaths = @($all | Where-Object { -not $beforeSnapshot.ContainsKey($_) -or -not $after.ContainsKey($_) -or $beforeSnapshot[$_] -ne $after[$_] })
        }
        $changedPaths = @($attempt.changedPaths | Where-Object { $_ -and $_.Trim() })
        $attempt.changedPaths = $changedPaths
        $attempts += $attempt

        if ($TaskType -eq 'code') {
            $violations = @($changedPaths | Where-Object { -not (Test-AllowedPath -p $_ -patterns $AllowedPath) })
            if ($violations.Count -gt 0) {
                $contractViolation = $true
                Write-Warning "Contract violation: paths outside AllowedPath changed: $($violations -join ', ')"
                $attempt.exitCode = 1
                $attempts[-1] = $attempt
                break modelLoop
            }
        }

        if ($attempt.terminationReason -eq 'timeout') {
            $executionTimedOut = $true
            $attempt.exitCode = 1
            $attempts[-1] = $attempt
            Write-Warning "Execution timeout exceeded: $MaxExecutionSeconds seconds"
            break modelLoop
        }

        if ($attempt.terminationReason -eq 'token-budget' -or $attempt.tokens.total -gt $effectiveMaxObservedTokens) {
            $tokenBudgetExceeded = $true
            $attempt.exitCode = 1
            $attempts[-1] = $attempt
            Write-Warning "Observed token budget exceeded: $($attempt.tokens.total) > $effectiveMaxObservedTokens (profile=$BudgetProfile, source=$budgetSource)"
            break modelLoop
        }

        if ($attempt.exitCode -eq 0) {
            # Post-execution checks for code tasks
            if ($TaskType -eq 'code') {
                # No-change check
                if ($changedPaths.Count -eq 0 -and -not $AllowNoChanges) {
                    Write-Host "  No changes detected (use -AllowNoChanges to accept)" -ForegroundColor Yellow
                    $attempt.exitCode = 1
                    $attempts[-1] = $attempt
                    continue
                }

                # Validation — final, no more retries or models
                if ($ValidationCommand.Count -gt 0) {
                    $ve = $null
                    if ($TestMode) {
                        $ve = if ($attempt.validationExitCode -ne $null) { [int]$attempt.validationExitCode } else { 0 }
                    } else {
                        $ve = 0
                        $commandIndex = 0
                        foreach ($cmd in $ValidationCommand) {
                            $commandIndex++
                            $validationOutput = Invoke-Expression $cmd 2>&1 | Out-String
                            $commandExit = $LASTEXITCODE
                            if ($commandExit -ne 0) {
                                if ($ve -eq 0) { $ve = $commandExit }
                                $normalizedOutput = ($validationOutput -replace "`e\[[0-9;]*[A-Za-z]", '').Trim()
                                $truncated = $normalizedOutput.Length -gt 4000
                                if ($truncated) { $normalizedOutput = $normalizedOutput.Substring($normalizedOutput.Length - 4000) }
                                $attempt.validationDiagnostics += [ordered]@{
                                    commandIndex=$commandIndex;exitCode=$commandExit
                                    outputTail=$normalizedOutput;truncated=$truncated
                                }
                            }
                        }
                    }
                    # Persist validationExitCode before any failure branch
                    $attempt.validationExitCode = $ve
                    $attempts[-1] = $attempt
                    if ($ve -ne 0) {
                        $validationFailed = $true
                        if ($TestMode) { Write-Warning "Mock validation failure (exitCode=$ve)" }
                        $attempt.exitCode = 1
                        $attempts[-1] = $attempt
                        break modelLoop
                    }
                }
            }

            # Bulletin tasks or code with all checks passed
            $successResult = $attempt
            break modelLoop
        }

        Write-Host "  FAILED (exitCode=$($attempt.exitCode))" -ForegroundColor Red
    }
    if ($successResult) { break }
}

# ── Aggregate tokens ──
$agg = @{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0}
foreach ($a in $attempts) {
    if ($a.tokens) {
        $agg.input += $a.tokens.input; $agg.output += $a.tokens.output; $agg.reasoning += $a.tokens.reasoning
        $agg.cacheRead += $a.tokens.cacheRead; $agg.cacheWrite += $a.tokens.cacheWrite; $agg.total += $a.tokens.total
    }
}

# ── Telemetry (always written before exit) ──
$tid = [guid]::NewGuid().ToString('N')
$status = if ($tokenBudgetExceeded) { 'blocked-token-budget' } elseif ($executionTimedOut) { 'blocked-timeout' } elseif ($successResult) { 'awaiting-frontier-review' } else { 'blocked-needs-new-contract' }
$success = ($successResult -ne $null) -and (-not $contractViolation) -and (-not $validationFailed)
$fcTelemetry = @{}
if ($TaskType -eq 'code') {
    $planSha = Compute-StringSha256 -InputString $FrontierPlan
    $fcTelemetry = @{plannedBy=$PlannedBy;planHash=$planSha;acceptanceCriteriaCount=$AcceptanceCriteria.Count;reviewRequired=$true}
}
$telemetry = @{
    telemetryId=$tid;simulated=[bool]$TestMode;taskType=$TaskType;selectedModel=if ($successResult) { $successResult.model } else { $null }
    attempts=@($attempts | ForEach-Object { @{model=$_.model;agent=$_.agent;attempt=$_.attempt;retry=$_.retry;exitCode=$_.exitCode;tokens=$_.tokens;changedPaths=$_.changedPaths;validationExitCode=$_.validationExitCode;validationDiagnostics=@($_.validationDiagnostics);terminationReason=$_.terminationReason} })
    changedPaths=@($changedPaths);contractViolation=$contractViolation;validationFailed=$validationFailed
    tokensUsage=$agg;success=$success;status=$status;frontierContract=$fcTelemetry
    draftOutput=if ($successResult) { $successResult.draftOutput } else { '' }
    contract=@{hash=$contractHash;headSha=$headSha;duplicateWindowSeconds=$DuplicateWindowSeconds}
    launch=@{harness='opencode';protocol='native-jsonl-stream-1.18.x';pure=$true;auto=$false;directory=$repoRoot;budgetProfile=$BudgetProfile;budgetSource=$budgetSource;maxObservedTokens=$effectiveMaxObservedTokens;maxExecutionSeconds=$MaxExecutionSeconds}
}
$writtenTelemetryPath = Write-TelemetryRecord -Value $telemetry -TelemetryId $tid
Write-Host "Telemetry: $writtenTelemetryPath" -ForegroundColor DarkGray

# ── Exit ──
if ($success) {
    if ($contractMutex) { $contractMutex.ReleaseMutex(); $contractMutex.Dispose() }
    if ($TaskType -eq 'bulletin' -and -not [string]::IsNullOrWhiteSpace($successResult.draftOutput)) {
        Write-Output '----- NAN DRAFT OUTPUT -----'
        Write-Output $successResult.draftOutput
        Write-Output '----- END NAN DRAFT OUTPUT -----'
    }
    Write-Host "Task completed successfully. Model=$($successResult.model) Attempts=$totalAttempts Changed=$($changedPaths.Count)" -ForegroundColor Green
    exit 0
}
if ($contractMutex) { $contractMutex.ReleaseMutex(); $contractMutex.Dispose() }
Write-Host "Task failed. Status=$status" -ForegroundColor Red
if ($contractViolation) { Write-Host "Reason: Contract violation (paths outside AllowedPath)" -ForegroundColor Red }
if ($validationFailed) { Write-Host "Reason: Validation failure" -ForegroundColor Red }
exit 1
