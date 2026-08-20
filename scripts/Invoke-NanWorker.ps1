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
    [ValidateRange(10,3600)][int]$MaxExecutionSeconds = 1800,
    [ValidateSet('observed-serial','provider-limit')][string]$AdmissionProfile = 'provider-limit',
    [ValidateRange(1,86400)][int]$AdmissionTimeoutSeconds = 7200,
    [ValidateRange(0,86400)][int]$DuplicateWindowSeconds = 3600,
    [string[]]$FallbackModels = @(),
    [switch]$DryRun,
    [switch]$AllowNoChanges,
    [switch]$ValidationMayWriteAllowedPaths,
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
$runtimeId = [guid]::NewGuid().ToString('N')
$providerEvidenceDirectory = $tdir
if (-not [string]::IsNullOrWhiteSpace($TelemetryOutputPath)) {
    if (-not [System.IO.Path]::IsPathRooted($TelemetryOutputPath)) {
        throw 'TelemetryOutputPath must be absolute.'
    }
    $telemetryParent = Split-Path -Parent ([System.IO.Path]::GetFullPath($TelemetryOutputPath))
    if (-not (Test-Path -LiteralPath $telemetryParent -PathType Container)) {
        throw 'TelemetryOutputPath parent directory does not exist.'
    }
    $providerEvidenceDirectory = $telemetryParent
}
$providerEvidencePath = Join-Path $providerEvidenceDirectory "$runtimeId.provider.jsonl"
$nanProxyProcess = $null
$isolatedOpenCodeRoot = $null
$expectedNanKeyFingerprint = $null

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

# These limits bound cumulative provider-reported trajectory usage, including
# cached context across agent turns. They are not model context-window or NAN
# rate limits. MaxObservedTokens remains the explicit exceptional override.
$budgetProfiles = @{
    small = 120000
    batch = 350000
    research = 700000
    extended = 1200000
}
if ($MaxObservedTokens -ne 0 -and ($MaxObservedTokens -lt 1000 -or $MaxObservedTokens -gt 2000000)) {
    throw 'MaxObservedTokens must be 0 (use BudgetProfile) or between 1000 and 2000000.'
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
    $finalReason = $null
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
            $allowedFinishReasons = @('stop','length','tool-calls','content-filter','error','unknown')
            if (-not $stepOpen -or $ev.part.type -ne 'step-finish' -or $ev.part.reason -notin $allowedFinishReasons) { throw 'Malformed OpenCode step finish.' }
            $stepOpen = $false
            if ($ev.part.reason -ne 'tool-calls') {
                $terminalCount++
                $finalReason = [string]$ev.part.reason
                $lastWasTerminal = $true
            }
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
    $r.finishReason = $finalReason
    $r.terminalSuccess = ($finalReason -eq 'stop')
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

function Compute-FileSha256 {
    param([Parameter(Mandatory)][string]$Path)
    $stream = [System.IO.File]::OpenRead($Path)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        return -join ($sha.ComputeHash($stream) | ForEach-Object { $_.ToString('x2') })
    } finally {
        $sha.Dispose()
        $stream.Dispose()
    }
}

function Protect-HarnessDiagnosticText {
    param([string]$Text, [int]$MaxLength = 16000)
    if ([string]::IsNullOrWhiteSpace($Text)) {
        return @{text='';truncated=$false}
    }
    $protected = $Text -replace "`e\[[0-9;]*[A-Za-z]", ''
    $protected = $protected -replace '(?i)(authorization\s*:\s*bearer)\s+\S+', '$1 [REDACTED]'
    $protected = $protected -replace '(?i)\bsk-[a-z0-9_-]{8,}\b', '[REDACTED_API_KEY]'
    $protected = $protected -replace '(?i)((?:NAN|OPENAI)_API_KEY\s*[=:]\s*)\S+', '$1[REDACTED]'
    $protected = $protected.Trim()
    $truncated = $protected.Length -gt $MaxLength
    if ($truncated) { $protected = $protected.Substring($protected.Length - $MaxLength) }
    return @{text=$protected;truncated=$truncated}
}

function Write-HarnessEventLog {
    param([string]$Jsonl, [int]$AttemptNumber)
    if ([string]::IsNullOrWhiteSpace($Jsonl)) {
        return @{file=$null;sha256=$null;eventCount=0;toolUseCount=0}
    }
    $protected = (Protect-HarnessDiagnosticText -Text $Jsonl -MaxLength 2000000).text
    $target = Join-Path $providerEvidenceDirectory "$runtimeId.attempt-$AttemptNumber.opencode.jsonl"
    [System.IO.File]::WriteAllText($target, $protected + "`n", (New-Object System.Text.UTF8Encoding($false)))
    $events = @($protected -split "`n" | Where-Object { $_.Trim() })
    $toolUseCount = @($events | Where-Object {
        try { (($_ | ConvertFrom-Json).type) -eq 'tool_use' } catch { $false }
    }).Count
    return @{
        file=[System.IO.Path]::GetFileName($target)
        sha256=(Compute-FileSha256 -Path $target)
        eventCount=$events.Count
        toolUseCount=$toolUseCount
    }
}

# ── Snapshot helpers ──
function Get-Snapshot {
    $s = @{}
    foreach ($rel in (& git -C $repoRoot ls-files --cached --others --exclude-standard 2>&1 | Where-Object { $_ })) {
        $abs = Join-Path $repoRoot $rel
        if (Test-Path -LiteralPath $abs -PathType Leaf) {
            try { $s[$rel.Replace('\','/')] = (Compute-FileSha256 -Path $abs) } catch {}
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

# ── Model routing and agent selection (premium glm5.2 deliberately unsupported) ──
# Fixed table: model → agent per TaskType.  gemma4 is bulletin-only; never
# receives a code agent and never appears in code fallback chains.
$codeAgents = @{
    'nan/qwen3.6'          = 'nan-code'
    'nan/deepseek-v4-flash' = 'nan-reasoning-code'
    'nan/mimo-v2.5'        = 'nan-long-context-code'
}
$primaryModel = switch ($ModelProfile) {
    'reasoning' { 'nan/deepseek-v4-flash' }
    'long-context' { 'nan/mimo-v2.5' }
    default { if ($TaskType -eq 'code') { 'nan/qwen3.6' } else { 'nan/gemma4' } }
}
$primaryAgent = if ($TaskType -eq 'code') {
    $codeAgents[$primaryModel]
} else { 'nan-bulletin' }
$allowedNanModels = @('nan/qwen3.6','nan/gemma4','nan/deepseek-v4-flash','nan/mimo-v2.5')
# Code fallbacks exclude Gemma. Read-only bulletin work may explicitly fall
# back to any supported text model while retaining the nan-bulletin permissions.
$fallbackPriority = if ($TaskType -eq 'code') {
    @('nan/mimo-v2.5','nan/deepseek-v4-flash','nan/qwen3.6')
} else { @('nan/mimo-v2.5','nan/deepseek-v4-flash','nan/qwen3.6','nan/gemma4') }
$forbiddenFallbacks = @($FallbackModels | Where-Object { $_ -match '(?i)(^|/)glm5\.2($|[-:])' })
if ($forbiddenFallbacks.Count -gt 0) {
    throw "Unsupported or premium NAN fallback model: $($forbiddenFallbacks -join ', ')"
}
if ($TaskType -eq 'code') {
    $gemmaFallbacks = @($FallbackModels | Where-Object { $_ -eq 'nan/gemma4' -or $_ -eq 'gemma4' })
    if ($gemmaFallbacks.Count -gt 0) {
        throw "gemma4 is bulletin-only and cannot be used as a code fallback: $($gemmaFallbacks -join ', ')"
    }
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

function Get-ValidationMetadata {
    param([string]$CommandText)
    $normalized = $CommandText.Trim().ToLowerInvariant()
    if ($normalized -match '(^|[^a-z])(prettier|format|format:check|fmt)([^a-z]|$)') {
        return @{validationId='format';categoryCode='shift_left_static_quality'}
    }
    if ($normalized -match '(^|[^a-z])(eslint|lint|stylelint|tslint)([^a-z]|$)') {
        return @{validationId='lint';categoryCode='shift_left_static_quality'}
    }
    return @{validationId='deterministic-validation';categoryCode='deterministic_validation'}
}

function New-ValidationDiagnostic {
    param(
        [int]$CommandIndex,
        [int]$ExitCode,
        [string]$CommandText,
        [string]$OutputTail,
        [bool]$Truncated
    )
    $metadata = Get-ValidationMetadata -CommandText $CommandText
    $signatureMaterial = "schema=1|category=$($metadata.categoryCode)|validation=$($metadata.validationId)"
    return [ordered]@{
        commandIndex=$CommandIndex
        exitCode=$ExitCode
        validationId=$metadata.validationId
        categoryCode=$metadata.categoryCode
        commandSha256=(Compute-StringSha256 -InputString $CommandText)
        outputTail=$OutputTail
        truncated=$Truncated
        normalizedFailureSignature=(Compute-StringSha256 -InputString $signatureMaterial)
    }
}

function Get-NanCredentialRecord {
    $candidates = @(
        (Join-Path $env:USERPROFILE '.local\share\opencode\auth.json'),
        (Join-Path $env:LOCALAPPDATA 'opencode\auth.json')
    ) | Select-Object -Unique
    foreach ($candidate in $candidates) {
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
        try {
            $auth = Get-Content -LiteralPath $candidate -Raw | ConvertFrom-Json
            if ($auth.nan -and $auth.nan.type -eq 'api' -and -not [string]::IsNullOrWhiteSpace([string]$auth.nan.key)) {
                return @{source=$candidate;record=$auth.nan}
            }
        } catch {}
    }
    throw 'A valid NAN credential was not found in the OpenCode credential stores.'
}

function Initialize-IsolatedOpenCodeState {
    param([string]$RuntimeId)
    $root = Join-Path ([System.IO.Path]::GetTempPath()) "castilla-nan-opencode-$RuntimeId"
    $dataRoot = Join-Path $root 'data'
    $stateRoot = Join-Path $root 'state'
    $cacheRoot = Join-Path $root 'cache'
    $configRoot = Join-Path $root 'config'
    $authDirectory = Join-Path $dataRoot 'opencode'
    foreach ($directory in @($authDirectory,$stateRoot,$cacheRoot,$configRoot)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    $credential = Get-NanCredentialRecord
    $credentialSha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $credentialHash = -join ($credentialSha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes([string]$credential.record.key)) | ForEach-Object { $_.ToString('x2') })
    } finally { $credentialSha.Dispose() }
    $isolatedAuth = @{nan=$credential.record} | ConvertTo-Json -Depth 4
    $authPath = Join-Path $authDirectory 'auth.json'
    [System.IO.File]::WriteAllText($authPath, $isolatedAuth, (New-Object System.Text.UTF8Encoding($false)))
    return @{root=$root;data=$dataRoot;state=$stateRoot;cache=$cacheRoot;config=$configRoot;credentialSource=$credential.source;keyFingerprint=$credentialHash.Substring(0,16)}
}

function Start-NanAuditProxy {
    param([string]$EvidencePath,[string]$ContractHash,[string]$RepositoryId)
    $node = (Get-Command node -ErrorAction Stop).Source
    $script = Join-Path $PSScriptRoot 'orchestration\nan-audit-proxy.mjs'
    if (-not (Test-Path -LiteralPath $script -PathType Leaf)) { throw 'NAN audit proxy script is missing.' }
    $start = New-Object System.Diagnostics.ProcessStartInfo
    $start.FileName = $node
    $proxyArgs = @(
        $script,'--evidence',$EvidencePath,'--contract-hash',$ContractHash,
        '--repository-id',$RepositoryId,'--max-attempts','3',
        '--base-delay-ms','1000','--max-delay-ms','30000'
    )
    $start.Arguments = (($proxyArgs | ForEach-Object { ConvertTo-NativeArgument -Argument $_ }) -join ' ')
    $start.WorkingDirectory = $repoRoot
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $start
    if (-not $process.Start()) { throw 'Failed to start the NAN audit proxy.' }
    $readyTask = $process.StandardOutput.ReadLineAsync()
    if (-not $readyTask.Wait(10000)) {
        Stop-WorkerProcessTree -Process $process
        throw 'NAN audit proxy did not become ready within 10 seconds.'
    }
    $readyLine = $readyTask.GetAwaiter().GetResult()
    $ready = try { $readyLine | ConvertFrom-Json } catch { $null }
    if (-not $ready.ready -or [int]$ready.port -le 0) {
        $diagnostic = $process.StandardError.ReadToEnd()
        Stop-WorkerProcessTree -Process $process
        throw "NAN audit proxy failed to start: $diagnostic"
    }
    return @{process=$process;baseUrl="http://127.0.0.1:$($ready.port)/v1"}
}

function Stop-NanAuditRuntime {
    if ($script:nanProxyProcess) {
        Stop-WorkerProcessTree -Process $script:nanProxyProcess
        $script:nanProxyProcess.Dispose()
        $script:nanProxyProcess = $null
    }
    if ($script:isolatedOpenCodeRoot -and (Test-Path -LiteralPath $script:isolatedOpenCodeRoot -PathType Container)) {
        $resolvedRuntimeRoot = [System.IO.Path]::GetFullPath($script:isolatedOpenCodeRoot)
        $expectedRuntimePrefix = [System.IO.Path]::GetFullPath((Join-Path ([System.IO.Path]::GetTempPath()) 'castilla-nan-opencode-'))
        if (-not $resolvedRuntimeRoot.StartsWith($expectedRuntimePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to remove unexpected OpenCode runtime directory: $resolvedRuntimeRoot"
        }
        Remove-Item -LiteralPath $resolvedRuntimeRoot -Recurse -Force -ErrorAction SilentlyContinue
        $script:isolatedOpenCodeRoot = $null
    }
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
    param([string[]]$Arguments, [int]$TokenBudget, [int]$TimeoutSeconds, [hashtable]$RunContext)
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
    if ($RunContext) {
        $startInfo.EnvironmentVariables['XDG_DATA_HOME'] = $RunContext.data
        $startInfo.EnvironmentVariables['XDG_STATE_HOME'] = $RunContext.state
        $startInfo.EnvironmentVariables['XDG_CACHE_HOME'] = $RunContext.cache
        $startInfo.EnvironmentVariables['XDG_CONFIG_HOME'] = $RunContext.config
        $override = @{
            provider=@{nan=@{options=@{baseURL=$RunContext.baseUrl}}}
            mcp=@{esdata=@{enabled=$false}}
        }
        if ($RunContext.taskType -eq 'bulletin') {
            # Files named with --file are attached by the host before inference.
            # The model receives no repository browsing capability, preventing
            # a contract for one programme from reading another programme.
            $override.agent = @{
                'nan-bulletin'=@{permission=@{read='deny';glob='deny';grep='deny';list='deny'}}
            }
        }
        $override = $override | ConvertTo-Json -Depth 8 -Compress
        $startInfo.EnvironmentVariables['OPENCODE_CONFIG_CONTENT'] = $override
    }
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
            if (-not $usage.terminalSuccess) {
                $terminationReason = "finish-$($usage.finishReason)"
                $exitCode = 1
            }
        }
        return @{exitCode=$exitCode;tokens=$usage;terminationReason=$terminationReason;stderr=($stderrLines -join "`n");draftOutput=$draftOutput;rawJsonl=$raw}
    } finally {
        $watch.Stop()
        $process.Dispose()
    }
}

$headSha = if ($TestMode -or $DryRun) { 'simulated' } else { (& git -C $repoRoot rev-parse HEAD).Trim() }
$contractMaterial = [ordered]@{
    taskType=$TaskType;objective=$Objective;allowedPaths=@($AllowedPath);inputPaths=@($InputPath)
    validationCommands=@($ValidationCommand);frontierPlan=$FrontierPlan;acceptanceCriteria=@($AcceptanceCriteria);headSha=$headSha
    modelProfile=$ModelProfile;budgetProfile=$BudgetProfile;maxObservedTokens=$MaxObservedTokens
    maxExecutionSeconds=$MaxExecutionSeconds;fallbackModels=@($FallbackModels)
    validationMayWriteAllowedPaths=[bool]$ValidationMayWriteAllowedPaths
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
    $dryRunTelemetry = @{telemetryId=$tid;simulated=[bool]$true;taskType=$TaskType;selectedModel=$primaryModel;selectedAgent=$primaryAgent;attempts=@();changedPaths=@();contractViolation=$false;validationFailed=$false;validationMayWriteAllowedPaths=[bool]$ValidationMayWriteAllowedPaths;tokensUsage=@{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0};success=$true;status='dry-run';frontierContract=$fc;contract=@{hash=$contractHash;headSha=$headSha;duplicateWindowSeconds=$DuplicateWindowSeconds};admission=@{profile=$AdmissionProfile;capacity=$(if ($AdmissionProfile -eq 'observed-serial') { 1 } else { 5 });timeoutSeconds=$AdmissionTimeoutSeconds;queueWaitMs=0;acquired=$false};launch=@{modelProfile=$ModelProfile;budgetProfile=$BudgetProfile;budgetSource=$budgetSource;maxObservedTokens=$effectiveMaxObservedTokens;maxExecutionSeconds=$MaxExecutionSeconds}}
    $writtenTelemetryPath = Write-TelemetryRecord -Value $dryRunTelemetry -TelemetryId $tid
    Write-Host "Telemetry: $writtenTelemetryPath" -ForegroundColor DarkGray
    exit 0
}

# ── Model list ──
$modelList = @()
if (-not $DryRun -and -not $TestMode) {
    try {
        $modelOutput = & opencode models nan 2>&1 | Out-String
        $availableModels = @($modelOutput -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -match '^nan/' })
        if ($availableModels -notcontains $primaryModel) {
            throw "Primary model $primaryModel is not available"
        }
        $availableFallbacks = @($fallbackPriority | Where-Object { $_ -in $FallbackModels -and $_ -ne $primaryModel -and $_ -in $availableModels })
        $modelList = @($primaryModel) + $availableFallbacks
        $unavailableFallbacks = @($FallbackModels | Where-Object { $_ -notin $availableFallbacks -and $_ -ne $primaryModel })
        if ($unavailableFallbacks.Count -gt 0) {
            throw "Fallback models are unavailable or unsupported: $($unavailableFallbacks -join ', ')"
        }
    } catch {
        Write-Warning "Model availability check failed: $_"
        throw "Models not available: $_"
    }
} else {
    $modelList = @($primaryModel) + @($fallbackPriority | Where-Object { $_ -in $FallbackModels -and $_ -ne $primaryModel })
}

# Admission follows NAN's published maximum of five concurrent requests. Each
# admitted process receives isolated OpenCode state below, avoiding the shared
# SQLite contention that invalidated the historical 2/4/8-process shakedown.
# Queue time is deliberately not charged to MaxExecutionSeconds.
$providerAdmissionMutex = $null
$admissionAcquired = $false
$admissionWaitMs = 0L
if (-not $TestMode) {
    $admissionCapacity = if ($AdmissionProfile -eq 'observed-serial') { 1 } else { 5 }
    $admissionName = if ($env:OS -eq 'Windows_NT') { "Local\NanBuilders-Chat-Admission-v2-$admissionCapacity" } else { "NanBuilders-Chat-Admission-v2-$admissionCapacity" }
    $providerAdmissionMutex = New-Object System.Threading.Semaphore($admissionCapacity, $admissionCapacity, $admissionName)
    $admissionWatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $admissionAcquired = $providerAdmissionMutex.WaitOne($AdmissionTimeoutSeconds * 1000)
    } finally {
        $admissionWatch.Stop()
        $admissionWaitMs = [long]$admissionWatch.ElapsedMilliseconds
    }
    if (-not $admissionAcquired) {
        $tid = [guid]::NewGuid().ToString('N')
        $fc = @{}
        if ($TaskType -eq 'code') {
            $fc = @{plannedBy=$PlannedBy;planHash=(Compute-StringSha256 -InputString $FrontierPlan);acceptanceCriteriaCount=$AcceptanceCriteria.Count;reviewRequired=$true}
        }
        $blockedTelemetry = @{telemetryId=$tid;simulated=$false;taskType=$TaskType;selectedModel=$null;attempts=@();changedPaths=@();contractViolation=$false;validationFailed=$false;validationMayWriteAllowedPaths=[bool]$ValidationMayWriteAllowedPaths;tokensUsage=@{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0};success=$false;status='blocked-admission-timeout';frontierContract=$fc;draftOutput='';contract=@{hash=$contractHash;headSha=$headSha;duplicateWindowSeconds=$DuplicateWindowSeconds};admission=@{profile=$AdmissionProfile;capacity=$admissionCapacity;timeoutSeconds=$AdmissionTimeoutSeconds;queueWaitMs=$admissionWaitMs;acquired=$false};launch=@{harness='opencode';protocol='native-jsonl-stream-1.18.x';pure=$true;auto=$false;directory=$repoRoot;budgetProfile=$BudgetProfile;budgetSource=$budgetSource;maxObservedTokens=$effectiveMaxObservedTokens;maxExecutionSeconds=$MaxExecutionSeconds}}
        $writtenTelemetryPath = Write-TelemetryRecord -Value $blockedTelemetry -TelemetryId $tid
        Write-Host "Telemetry: $writtenTelemetryPath" -ForegroundColor DarkGray
        if ($providerAdmissionMutex) { $providerAdmissionMutex.Dispose() }
        if ($contractMutex) { $contractMutex.ReleaseMutex(); $contractMutex.Dispose() }
        Write-Host 'Task failed. Status=blocked-admission-timeout' -ForegroundColor Red
        exit 1
    }
}

$openCodeRunContext = $null
if (-not $TestMode) {
    try {
        $isolated = Initialize-IsolatedOpenCodeState -RuntimeId $runtimeId
        $isolatedOpenCodeRoot = $isolated.root
        $expectedNanKeyFingerprint = $isolated.keyFingerprint
        $repositoryRemote = (& git -C $repoRoot config --get remote.origin.url | Out-String).Trim()
        if ([string]::IsNullOrWhiteSpace($repositoryRemote)) { $repositoryRemote = $repoRoot }
        $repositoryId = Compute-StringSha256 -InputString $repositoryRemote
        $proxy = Start-NanAuditProxy -EvidencePath $providerEvidencePath -ContractHash $contractHash -RepositoryId $repositoryId
        $nanProxyProcess = $proxy.process
        $openCodeRunContext = @{data=$isolated.data;state=$isolated.state;cache=$isolated.cache;config=$isolated.config;baseUrl=$proxy.baseUrl;taskType=$TaskType}
        $exitCleanup = @{runtimeRoot=$isolatedOpenCodeRoot;proxyPid=$nanProxyProcess.Id}
        Register-EngineEvent -SourceIdentifier PowerShell.Exiting -MessageData $exitCleanup -Action {
            $cleanup = $event.MessageData
            Stop-Process -Id $cleanup.proxyPid -Force -ErrorAction SilentlyContinue
            if ($cleanup.runtimeRoot -and (Test-Path -LiteralPath $cleanup.runtimeRoot -PathType Container)) {
                $resolvedRuntimeRoot = [System.IO.Path]::GetFullPath($cleanup.runtimeRoot)
                $expectedRuntimePrefix = [System.IO.Path]::GetFullPath((Join-Path ([System.IO.Path]::GetTempPath()) 'castilla-nan-opencode-'))
                if ($resolvedRuntimeRoot.StartsWith($expectedRuntimePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                    Remove-Item -LiteralPath $resolvedRuntimeRoot -Recurse -Force -ErrorAction SilentlyContinue
                }
            }
        } | Out-Null
    } catch {
        Stop-NanAuditRuntime
        if ($providerAdmissionMutex -and $admissionAcquired) { $providerAdmissionMutex.Release() | Out-Null; $providerAdmissionMutex.Dispose() }
        if ($contractMutex) { $contractMutex.ReleaseMutex(); $contractMutex.Dispose() }
        throw
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
$validationMayWrite = [bool]$ValidationMayWriteAllowedPaths
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
    $candidateAgent = if ($TaskType -eq 'bulletin') { 'nan-bulletin' } else { $codeAgents[$candidateModel] }
    if ([string]::IsNullOrWhiteSpace($candidateAgent)) {
        throw "No bounded code agent is configured for model: $candidateModel"
    }
    for ($r = 0; $r -lt $MaxRetries; $r++) {
        $totalAttempts++
        $attempt = @{model=$candidateModel;agent=$candidateAgent;attempt=$totalAttempts;retry=($r+1);exitCode=1;tokens=@{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0};changedPaths=@();validationExitCode=$null;validationDiagnostics=@();draftOutput='';harnessStderrTail='';harnessStderrTruncated=$false;eventLogFile=$null;eventLogSha256=$null;eventCount=0;toolUseCount=0}
        $mp = $null

        if ($TestMode) {
            if ($planIndex -lt $mockPlans.Count) { $mp = $mockPlans[$planIndex]; $planIndex++ }
            if ($mp) {
                $attempt.exitCode = if ($mp.exitCode -ne $null) { [int]$mp.exitCode } else { 0 }
                if ($mp.jsonl) {
                    $attempt.tokens = Parse-JsonlTokens -Jsonl $mp.jsonl
                    $attempt.draftOutput = Get-JsonlDraftOutput -Jsonl $mp.jsonl
                    if (-not $attempt.tokens.terminalSuccess) {
                        $attempt.exitCode = 1
                        $attempt.terminationReason = "finish-$($attempt.tokens.finishReason)"
                    }
                }
                if ($mp.stderr) {
                    $mockStderrDiagnostic = Protect-HarnessDiagnosticText -Text ([string]$mp.stderr)
                    $attempt.harnessStderrTail = $mockStderrDiagnostic.text
                    $attempt.harnessStderrTruncated = [bool]$mockStderrDiagnostic.truncated
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
                if ($mp.validationDiagnostics) {
                    $attempt.validationDiagnostics = @($mp.validationDiagnostics | ForEach-Object {
                        $diagnosticIndex = if ($_.commandIndex) { [int]$_.commandIndex } else { 1 }
                        $diagnosticCommand = if ($diagnosticIndex -le $ValidationCommand.Count) { [string]$ValidationCommand[$diagnosticIndex - 1] } else { 'unknown-validation' }
                        New-ValidationDiagnostic `
                            -CommandIndex $diagnosticIndex `
                            -ExitCode $(if ($_.exitCode -ne $null) { [int]$_.exitCode } else { 1 }) `
                            -CommandText $diagnosticCommand `
                            -OutputTail $(if ($_.outputTail) { [string]$_.outputTail } else { '' }) `
                            -Truncated $(if ($_.truncated -ne $null) { [bool]$_.truncated } else { $false })
                    })
                }
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
            try {
                $liveResult = Invoke-OpenCodeBudgeted -Arguments $opts -TokenBudget $effectiveMaxObservedTokens -TimeoutSeconds $MaxExecutionSeconds -RunContext $openCodeRunContext
            } catch {
                Stop-NanAuditRuntime
                throw
            }
            $attempt.exitCode = $liveResult.exitCode
            $attempt.tokens = $liveResult.tokens
            $attempt.terminationReason = $liveResult.terminationReason
            $attempt.draftOutput = $liveResult.draftOutput
            $stderrDiagnostic = Protect-HarnessDiagnosticText -Text $liveResult.stderr
            $attempt.harnessStderrTail = $stderrDiagnostic.text
            $attempt.harnessStderrTruncated = [bool]$stderrDiagnostic.truncated
            $eventLog = Write-HarnessEventLog -Jsonl $liveResult.rawJsonl -AttemptNumber $totalAttempts
            $attempt.eventLogFile = $eventLog.file
            $attempt.eventLogSha256 = $eventLog.sha256
            $attempt.eventCount = $eventLog.eventCount
            $attempt.toolUseCount = $eventLog.toolUseCount
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
                # No-change check. When opt-in validation writes are enabled the
                # bounded no-change decision is deferred until after validations
                # have run, so the final change set includes validator artifacts.
                if (-not $validationMayWrite -and $changedPaths.Count -eq 0 -and -not $AllowNoChanges) {
                    Write-Host "  No changes detected (use -AllowNoChanges to accept)" -ForegroundColor Yellow
                    $attempt.exitCode = 1
                    $attempts[-1] = $attempt
                    continue
                }

                # Validation — final, no more retries or models
                $ve = 0
                if ($ValidationCommand.Count -gt 0) {
                    if ($TestMode) {
                        $ve = if ($attempt.validationExitCode -ne $null) { [int]$attempt.validationExitCode } else { 0 }
                    } else {
                        $ve = 0
                        $commandIndex = 0
                        foreach ($cmd in $ValidationCommand) {
                            $commandIndex++
                            $previousErrorActionPreference = $ErrorActionPreference
                            $validationOutput = ''
                            $commandExit = 1
                            Push-Location -LiteralPath $repoRoot
                            try {
                                # Validation belongs to the worker worktree, not
                                # the supervisor's current directory. Native
                                # stderr is diagnostic evidence and must not
                                # abort telemetry persistence.
                                $ErrorActionPreference = 'Continue'
                                $validationOutput = Invoke-Expression $cmd 2>&1 | Out-String
                                $commandExit = $LASTEXITCODE
                                if ($null -eq $commandExit) { $commandExit = 0 }
                            } catch {
                                $validationOutput = ($_ | Out-String)
                                $commandExit = 1
                            } finally {
                                $ErrorActionPreference = $previousErrorActionPreference
                                Pop-Location
                            }
                            if ($commandExit -ne 0) {
                                if ($ve -eq 0) { $ve = $commandExit }
                                $normalizedOutput = ($validationOutput -replace "`e\[[0-9;]*[A-Za-z]", '').Trim()
                                $truncated = $normalizedOutput.Length -gt 4000
                                if ($truncated) { $normalizedOutput = $normalizedOutput.Substring($normalizedOutput.Length - 4000) }
                                $attempt.validationDiagnostics += New-ValidationDiagnostic `
                                    -CommandIndex $commandIndex `
                                    -ExitCode $commandExit `
                                    -CommandText $cmd `
                                    -OutputTail $normalizedOutput `
                                    -Truncated $truncated
                            }
                        }
                    }
                    # Persist validationExitCode before any failure branch
                    $attempt.validationExitCode = $ve
                    $attempts[-1] = $attempt

                    # Opt-in capture of validation-generated artifacts: recompute
                    # the bounded change set once from the original snapshot after
                    # validations have finished, so validator writes are retained
                    # on both success and validation failure. TestMode reads the
                    # caller's postValidationChangedPaths simulation instead.
                    if ($validationMayWrite) {
                        if ($TestMode) {
                            $attempt.changedPaths = @($mp.postValidationChangedPaths | Where-Object { $_ -and $_.Trim() })
                        } else {
                            $validationAfter = Get-Snapshot
                            $validationAll = @($beforeSnapshot.Keys) + @($validationAfter.Keys) | Sort-Object -Unique
                            $attempt.changedPaths = @($validationAll | Where-Object { -not $beforeSnapshot.ContainsKey($_) -or -not $validationAfter.ContainsKey($_) -or $beforeSnapshot[$_] -ne $validationAfter[$_] })
                        }
                        $changedPaths = @($attempt.changedPaths | Where-Object { $_ -and $_.Trim() })
                        $attempt.changedPaths = $changedPaths
                        $attempts[-1] = $attempt
                        # Generated artifacts must remain inside AllowedPath.
                        $generatedViolations = @($changedPaths | Where-Object { -not (Test-AllowedPath -p $_ -patterns $AllowedPath) })
                        if ($generatedViolations.Count -gt 0) {
                            $contractViolation = $true
                            Write-Warning "Contract violation: validation-generated paths outside AllowedPath: $($generatedViolations -join ', ')"
                            $attempt.exitCode = 1
                            $attempts[-1] = $attempt
                            break modelLoop
                        }
                    }

                    if ($ve -ne 0) {
                        $validationFailed = $true
                        if ($TestMode) { Write-Warning "Mock validation failure (exitCode=$ve)" }
                        $attempt.exitCode = 1
                        $attempts[-1] = $attempt
                        break modelLoop
                    }
                }

                # Opt-in validation deferred the bounded no-change decision until
                # after validations; the final empty candidate still requires the
                # explicit -AllowNoChanges opt-out like the default path.
                if ($validationMayWrite -and $changedPaths.Count -eq 0 -and -not $AllowNoChanges) {
                    Write-Host "  No changes detected after validation (use -AllowNoChanges to accept)" -ForegroundColor Yellow
                    $attempt.exitCode = 1
                    $attempts[-1] = $attempt
                    continue
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

if (-not $TestMode) { Stop-NanAuditRuntime }
$providerRecords = @()
if (-not $TestMode -and (Test-Path -LiteralPath $providerEvidencePath -PathType Leaf)) {
    $providerRecords = @(Get-Content -LiteralPath $providerEvidencePath | Where-Object { $_.Trim() } | ForEach-Object {
        try { $_ | ConvertFrom-Json } catch { $null }
    } | Where-Object { $_ })
}
$observedProviderRecords = @($providerRecords | Where-Object {
    $_.evidenceClass -eq 'provider-observed' -and
    $_.contractHash -eq $contractHash -and
    $_.keyFingerprint -eq $expectedNanKeyFingerprint
})
$providerRetryRecords = @($observedProviderRecords | Where-Object {
    $_.retry -and $_.retry.retryable -eq $true -and $_.retry.terminal -eq $false
})
$terminalProviderErrors = @($observedProviderRecords | Where-Object {
    [int]$_.response.status -ge 400 -and (!$_.retry -or $_.retry.terminal -eq $true)
} | ForEach-Object {
    @{
        status=[int]$_.response.status
        code=$(if ($_.retry.error) { [string]$_.retry.error.code } else { $null })
        type=$(if ($_.retry.error) { [string]$_.retry.error.type } else { $null })
        param=$(if ($_.retry.error) { [string]$_.retry.error.param } else { $null })
        attempt=$(if ($_.retry) { [int]$_.retry.attempt } else { 1 })
    }
})
$lastProviderError = @($terminalProviderErrors | Select-Object -Last 1)
$providerFailureStatus = $null
if ($lastProviderError.Count -gt 0) {
    $errorStatus = [int]$lastProviderError[0].status
    $errorCode = [string]$lastProviderError[0].code
    $providerFailureStatus = if ($errorStatus -in @(401,403)) { 'blocked-provider-auth' } `
        elseif ($errorStatus -eq 402 -or $errorCode -in @('insufficient_quota','quota_exceeded')) { 'blocked-provider-quota' } `
        elseif ($errorStatus -eq 429) { 'blocked-provider-rate-limit' } `
        elseif ($errorStatus -ge 500) { 'blocked-provider-unavailable' } `
        else { 'blocked-provider-request' }
}
$expectedProviderModel = if ($successResult) { ([string]$successResult.model -replace '^nan/','') } else { $null }
$verifiedProviderRecords = @($observedProviderRecords | Where-Object {
    [int]$_.response.status -ge 200 -and [int]$_.response.status -lt 300 -and
    $_.request.path -in @('/v1/chat/completions','/v1/responses') -and
    $_.response.id -match '^(chatcmpl|resp|cmpl)[_-]'
})
if ($expectedProviderModel) {
    $verifiedProviderRecords = @($verifiedProviderRecords | Where-Object {
        $_.request.model -eq $expectedProviderModel -and
        ($_.response.model -eq $expectedProviderModel -or [string]::IsNullOrWhiteSpace([string]$_.response.model)) -and
        [long]$_.response.usage.total -gt 0
    })
}
$providerEvidenceVerified = [bool]$TestMode -or ($successResult -and $verifiedProviderRecords.Count -gt 0)
$providerReportedTokens = [long]0
foreach ($record in $verifiedProviderRecords) { $providerReportedTokens += [long]$record.response.usage.total }
$providerResponseIds = @($verifiedProviderRecords | ForEach-Object { [string]$_.response.id } | Sort-Object -Unique)
$providerResponseSetHash = if ($providerResponseIds.Count -gt 0) { Compute-StringSha256 -InputString ($providerResponseIds -join "`n") } else { $null }

# ── Telemetry (always written before exit) ──
$tid = $runtimeId
$harnessFailure = @($attempts | Where-Object { $_.terminationReason -like 'finish-*' }).Count -gt 0
$status = if ($tokenBudgetExceeded) { 'blocked-token-budget' } elseif ($executionTimedOut) { 'blocked-timeout' } elseif ($successResult -and -not $providerEvidenceVerified) { 'blocked-unverified-provider' } elseif ($successResult) { 'awaiting-frontier-review' } elseif ($providerFailureStatus) { $providerFailureStatus } elseif ($harnessFailure) { 'blocked-harness-failure' } else { 'blocked-needs-new-contract' }
$success = ($successResult -ne $null) -and (-not $contractViolation) -and (-not $validationFailed) -and $providerEvidenceVerified
$fcTelemetry = @{}
if ($TaskType -eq 'code') {
    $planSha = Compute-StringSha256 -InputString $FrontierPlan
    $fcTelemetry = @{plannedBy=$PlannedBy;planHash=$planSha;acceptanceCriteriaCount=$AcceptanceCriteria.Count;reviewRequired=$true}
}
$telemetry = @{
    telemetryId=$tid;simulated=[bool]$TestMode;taskType=$TaskType;selectedModel=if ($successResult) { $successResult.model } else { $null };selectedAgent=if ($successResult) { $successResult.agent } else { $null }
    attempts=@($attempts | ForEach-Object { @{model=$_.model;agent=$_.agent;attempt=$_.attempt;retry=$_.retry;exitCode=$_.exitCode;tokens=$_.tokens;changedPaths=$_.changedPaths;validationExitCode=$_.validationExitCode;validationDiagnostics=@($_.validationDiagnostics);terminationReason=$_.terminationReason;draftOutput=$_.draftOutput;harnessStderrTail=$_.harnessStderrTail;harnessStderrTruncated=[bool]$_.harnessStderrTruncated;eventLogFile=$_.eventLogFile;eventLogSha256=$_.eventLogSha256;eventCount=$_.eventCount;toolUseCount=$_.toolUseCount} })
    changedPaths=@($changedPaths);contractViolation=$contractViolation;validationFailed=$validationFailed;validationMayWriteAllowedPaths=[bool]$ValidationMayWriteAllowedPaths
    tokensUsage=$agg;success=$success;status=$status;frontierContract=$fcTelemetry
    draftOutput=if ($successResult) { $successResult.draftOutput } else { '' }
    contract=@{hash=$contractHash;headSha=$headSha;duplicateWindowSeconds=$DuplicateWindowSeconds}
    providerEvidence=@{verified=[bool]$providerEvidenceVerified;evidenceClass=$(if ($TestMode) { 'simulated' } elseif ($observedProviderRecords.Count -gt 0) { 'provider-observed' } else { 'insufficient-evidence' });recordCount=$verifiedProviderRecords.Count;observedRecordCount=$observedProviderRecords.Count;retryCount=$providerRetryRecords.Count;terminalErrorCount=$terminalProviderErrors.Count;terminalErrors=@($terminalProviderErrors | Select-Object -Last 5);providerReportedTokens=$providerReportedTokens;responseIdSetHash=$providerResponseSetHash;rawEvidenceFile=$(if ($TestMode) { $null } else { [System.IO.Path]::GetFileName($providerEvidencePath) })}
    admission=@{profile=$AdmissionProfile;capacity=$(if ($AdmissionProfile -eq 'observed-serial') { 1 } else { 5 });timeoutSeconds=$AdmissionTimeoutSeconds;queueWaitMs=$admissionWaitMs;acquired=[bool]$admissionAcquired}
    launch=@{harness='opencode';protocol='native-jsonl-stream-1.18.x';pure=$true;auto=$false;directory=$repoRoot;modelProfile=$ModelProfile;budgetProfile=$BudgetProfile;budgetSource=$budgetSource;maxObservedTokens=$effectiveMaxObservedTokens;maxExecutionSeconds=$MaxExecutionSeconds;validationMayWriteAllowedPaths=[bool]$ValidationMayWriteAllowedPaths}
}
$writtenTelemetryPath = Write-TelemetryRecord -Value $telemetry -TelemetryId $tid
Write-Host "Telemetry: $writtenTelemetryPath" -ForegroundColor DarkGray

# ── Exit ──
if ($success) {
    if ($providerAdmissionMutex -and $admissionAcquired) { $providerAdmissionMutex.Release() | Out-Null; $providerAdmissionMutex.Dispose() }
    if ($contractMutex) { $contractMutex.ReleaseMutex(); $contractMutex.Dispose() }
    if ($TaskType -eq 'bulletin' -and -not [string]::IsNullOrWhiteSpace($successResult.draftOutput)) {
        Write-Output '----- NAN DRAFT OUTPUT -----'
        Write-Output $successResult.draftOutput
        Write-Output '----- END NAN DRAFT OUTPUT -----'
    }
    Write-Host "Task completed successfully. Model=$($successResult.model) Attempts=$totalAttempts Changed=$($changedPaths.Count)" -ForegroundColor Green
    exit 0
}
if ($providerAdmissionMutex -and $admissionAcquired) { $providerAdmissionMutex.Release() | Out-Null; $providerAdmissionMutex.Dispose() }
if ($contractMutex) { $contractMutex.ReleaseMutex(); $contractMutex.Dispose() }
Write-Host "Task failed. Status=$status" -ForegroundColor Red
if ($contractViolation) { Write-Host "Reason: Contract violation (paths outside AllowedPath)" -ForegroundColor Red }
if ($validationFailed) { Write-Host "Reason: Validation failure" -ForegroundColor Red }
exit 1
