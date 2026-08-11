[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('code','bulletin')][string]$TaskType,
    [Parameter(Mandatory)][ValidateNotNullOrEmpty()][string]$Objective,
    [string[]]$AllowedPath = @(),
    [string[]]$InputPath = @(),
    [string[]]$ValidationCommand = @(),
    [ValidateSet('default','json')][string]$Format = 'json',
    [int]$MaxRetries = 3,
    [string[]]$FallbackModels = @('nan/mimo-v2.5','nan/deepseek-v4-flash'),
    [switch]$DryRun,
    [switch]$AllowNoChanges,
    [switch]$TestMode,
    [string]$MockPlan = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$repoPrefix = $repoRoot.TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
$tdir = Join-Path $repoRoot '.agent-runs'
if (-not (Test-Path -LiteralPath $tdir)) { New-Item -ItemType Directory -Path $tdir -Force | Out-Null }

# Normalize
$AllowedPath = @($AllowedPath | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$InputPath = @($InputPath | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })

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

# ── JSONL token parser (PS 5.1 compatible) ──
function Parse-JsonlTokens {
    param([string]$Jsonl)
    $r = @{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0}
    if ([string]::IsNullOrWhiteSpace($Jsonl)) { return $r }
    foreach ($line in ($Jsonl -split "`n" | Where-Object { $_.Trim() })) {
        $ev = try { $line | ConvertFrom-Json } catch { $null }
        if (-not $ev) { continue }
        if ($ev.type -eq 'step_finish' -and $ev.part -and $ev.part.tokens) {
            $t = $ev.part.tokens
            if ($t.input) { $r.input += [int]$t.input }
            if ($t.output) { $r.output += [int]$t.output }
            if ($t.reasoning) { $r.reasoning += [int]$t.reasoning }
            if ($t.cache) {
                if ($t.cache.read) { $r.cacheRead += [int]$t.cache.read }
                if ($t.cache.write) { $r.cacheWrite += [int]$t.cache.write }
            }
            if ($t.total) { $r.total += [int]$t.total }
        }
    }
    return $r
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

# ── Primary model ──
$primaryModel = if ($TaskType -eq 'code') { 'nan/qwen3.6' } else { 'nan/gemma4' }
$primaryAgent = if ($TaskType -eq 'code') { 'nan-code' } else { 'nan-bulletin' }

# ── DryRun ──
if ($DryRun) {
    Write-Host "[DryRun] TaskType=$TaskType Objective=$Objective Model=$primaryModel Agent=$primaryAgent Retries=$MaxRetries Fallbacks=$($FallbackModels -join ',') Allowed=$($AllowedPath -join ',')" -ForegroundColor Yellow
    $tid = [guid]::NewGuid().ToString('N')
    @{telemetryId=$tid;simulated=[bool]$true;taskType=$TaskType;selectedModel=$primaryModel;attempts=@();changedPaths=@();contractViolation=$false;validationFailed=$false;tokensUsage=@{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0};success=$true;status='dry-run'} |
        ConvertTo-Json -Depth 5 | Out-File (Join-Path $tdir "$tid.json") -Encoding utf8
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
            $officialFallbacks = @('nan/mimo-v2.5','nan/deepseek-v4-flash')
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
        $modelList = @($primaryModel) + @(@('nan/mimo-v2.5','nan/deepseek-v4-flash') | Where-Object { $_ -in $FallbackModels -and $_ -ne $primaryModel })
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
$planIndex = 0
$totalAttempts = 0

:modelLoop foreach ($candidateModel in $modelList) {
    $candidateAgent = if ($candidateModel -eq $primaryModel) { $primaryAgent } else { 'nan-code' }
    for ($r = 0; $r -lt $MaxRetries; $r++) {
        $totalAttempts++
        $attempt = @{model=$candidateModel;agent=$candidateAgent;attempt=$totalAttempts;retry=($r+1);exitCode=1;tokens=@{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0};changedPaths=@();validationExitCode=$null}
        $mp = $null

        if ($TestMode) {
            if ($planIndex -lt $mockPlans.Count) { $mp = $mockPlans[$planIndex]; $planIndex++ }
            if ($mp) {
                $attempt.exitCode = if ($mp.exitCode -ne $null) { [int]$mp.exitCode } else { 0 }
                if ($mp.jsonl) { $attempt.tokens = Parse-JsonlTokens -Jsonl $mp.jsonl }
                $attempt.changedPaths = if ($mp.changedPaths) { @($mp.changedPaths) } else { @() }
                $attempt.validationExitCode = if ($mp.validationExitCode -ne $null) { [int]$mp.validationExitCode } else { 0 }
            }
            Write-Host ("Attempt " + $totalAttempts + ": ${candidateAgent} -> ${candidateModel} (Mock) exitCode=" + $attempt.exitCode) -ForegroundColor Cyan
        } else {
            # Live invocation
            $opts = @('run','--pure','--model',$candidateModel,'--agent',$candidateAgent,'--format','json','--title',"orchestrated-$TaskType")
            foreach ($f in $InputPath) { $opts += @('--file',$f) }
            $contract = @("TASK TYPE: $TaskType","OBJECTIVE: $Objective")
            if ($AllowedPath.Count -gt 0) { $contract += "ALLOWED PATHS: $($AllowedPath -join ', ')" }
            if ($ValidationCommand.Count -gt 0) { $contract += "REQUIRED VALIDATION: $($ValidationCommand -join ' ; ')" }
            $contract += 'Do not commit, push, publish, deploy, or expand this contract.'
            $opts += @('--', ($contract -join "`n"))
            Write-Host ("Attempt " + $totalAttempts + ": ${candidateAgent} -> ${candidateModel}") -ForegroundColor Cyan
            $raw = try { & opencode @opts 2>&1 | Out-String } catch { $_.Exception.Message }
            $attempt.exitCode = $LASTEXITCODE
            $attempt.tokens = Parse-JsonlTokens -Jsonl $raw
        }

        $attempts += $attempt

        if ($attempt.exitCode -eq 0) {
            $changedPaths = @($attempt.changedPaths | Where-Object { $_ -and $_.Trim() })
            $validationFailedForAttempt = $false

            # Post-execution checks for code tasks
            if ($TaskType -eq 'code') {
                # Detect changes in live mode
                if (-not $TestMode) {
                    $after = Get-Snapshot
                    $all = @($beforeSnapshot.Keys) + @($after.Keys) | Sort-Object -Unique
                    $changedPaths = @($all | Where-Object { -not $beforeSnapshot.ContainsKey($_) -or -not $after.ContainsKey($_) -or $beforeSnapshot[$_] -ne $after[$_] })
                }

                # Normalize changed paths before validation
                $changedPaths = @($changedPaths | Where-Object { $_ -and $_.Trim() })

                # Path violation check — final, no more retries or models
                $violations = @($changedPaths | Where-Object { -not (Test-AllowedPath -p $_ -patterns $AllowedPath) })
                if ($violations.Count -gt 0) {
                    $contractViolation = $true
                    Write-Warning "Contract violation: paths outside AllowedPath changed: $($violations -join ', ')"
                    $attempt.exitCode = 1
                    $attempts[-1] = $attempt
                    break modelLoop
                }

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
                        $allOk = $true
                        $lastVe = 0
                        foreach ($cmd in $ValidationCommand) {
                            $null = Invoke-Expression $cmd 2>&1 | Out-String
                            if ($LASTEXITCODE -ne 0) { $allOk = $false }
                            $lastVe = $LASTEXITCODE
                        }
                        $ve = $lastVe
                        if (-not $allOk) {
                            $validationFailed = $true
                            $attempt.exitCode = 1
                            $attempts[-1] = $attempt
                            break modelLoop
                        }
                    }
                    $attempt.validationExitCode = $ve
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
$status = if ($successResult) { 'success' } else { 'blocked-needs-new-contract' }
$success = ($successResult -ne $null) -and (-not $contractViolation) -and (-not $validationFailed)
$telemetry = @{
    telemetryId=$tid;simulated=[bool]$TestMode;taskType=$TaskType;selectedModel=if ($successResult) { $successResult.model } else { $null }
    attempts=@($attempts | ForEach-Object { @{model=$_.model;agent=$_.agent;attempt=$_.attempt;retry=$_.retry;exitCode=$_.exitCode;tokens=$_.tokens;changedPaths=$_.changedPaths;validationExitCode=$_.validationExitCode} })
    changedPaths=@($changedPaths);contractViolation=$contractViolation;validationFailed=$validationFailed
    tokensUsage=$agg;success=$success;status=$status
}
$telemetry | ConvertTo-Json -Depth 5 | Out-File (Join-Path $tdir "$tid.json") -Encoding utf8
Write-Host "Telemetry: $(Join-Path $tdir "$tid.json")" -ForegroundColor DarkGray

# ── Exit ──
if ($success) {
    Write-Host "Task completed successfully. Model=$($successResult.model) Attempts=$totalAttempts Changed=$($changedPaths.Count)" -ForegroundColor Green
    exit 0
}
Write-Host "Task failed. Status=$status" -ForegroundColor Red
if ($contractViolation) { Write-Host "Reason: Contract violation (paths outside AllowedPath)" -ForegroundColor Red }
if ($validationFailed) { Write-Host "Reason: Validation failure" -ForegroundColor Red }
exit 1