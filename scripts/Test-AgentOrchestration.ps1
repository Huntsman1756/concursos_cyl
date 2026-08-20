[CmdletBinding()]
param(
    [string]$Only
)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$workerPath = Join-Path $repoRoot 'scripts\Invoke-NanWorker.ps1'
$yamlPath = Join-Path $repoRoot 'orchestration\castilla-leon.nan.yaml'
$tdir = Join-Path $repoRoot '.agent-runs'
if (-not (Test-Path -LiteralPath $tdir)) { New-Item -ItemType Directory -Path $tdir -Force | Out-Null }

Push-Location $repoRoot

# ── PSSerializer + Unicode Base64 transport ──
function Encode-Hashtable {
    param([hashtable]$Value)
    $ser = [System.Management.Automation.PSSerializer]::Serialize($Value)
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($ser)
    return [Convert]::ToBase64String($bytes)
}

function Build-ChildScript {
    param([string]$B64, [string]$OutFile)
    $sq = [char]39  # single quote
    $safeRoot = $repoRoot.Replace("$sq", "$sq$sq")
    $safeWorker = $workerPath.Replace("$sq", "$sq$sq")
    $safeOut = $OutFile.Replace("$sq", "$sq$sq")
    $lines = @(
        "`$ErrorActionPreference = 'Stop'",
        "Set-Location $sq$safeRoot$sq",
        "`$b64 = $sq$B64$sq",
        "`$bytes = [Convert]::FromBase64String(`$b64)",
        "`$ser = [System.Text.Encoding]::Unicode.GetString(`$bytes)",
        "`$ht = [System.Management.Automation.PSSerializer]::Deserialize(`$ser)",
        "try {",
        "    `$r = & $sq$safeWorker$sq @ht *>&1",
        "    `$code = `$LASTEXITCODE",
        "} catch {",
        "    `$r = `$_.Exception.Message",
        "    `$code = 1",
        "}",
        "`$r | Out-File -LiteralPath $sq$safeOut$sq -Encoding utf8",
        "exit `$code"
    )
    return ($lines -join [Environment]::NewLine)
}

# ── Assertion helpers ──
$PASS = 0; $FAIL = 0; $SKIPPED = 0; $TotalTests = 0

function Assert-Equal {
    param([object]$Actual, [object]$Expected, [string]$TestName)
    $script:TotalTests++
    if ($Actual -eq $Expected) { $script:PASS++; Write-Host "  PASS: $TestName" -ForegroundColor Green }
    else { $script:FAIL++; Write-Host "  FAIL: $TestName (expected '$Expected' got '$Actual')" -ForegroundColor Red }
}

function Assert-True {
    param([bool]$Condition, [string]$TestName)
    $script:TotalTests++
    if ($Condition) { $script:PASS++; Write-Host "  PASS: $TestName" -ForegroundColor Green }
    else { $script:FAIL++; Write-Host "  FAIL: $TestName" -ForegroundColor Red }
}

function Assert-Contains {
    param([string]$Text, [string]$Substr, [string]$TestName)
    $script:TotalTests++
    if ($Text -like "*$Substr*") { $script:PASS++; Write-Host "  PASS: $TestName" -ForegroundColor Green }
    else { $script:FAIL++; Write-Host "  FAIL: $TestName (text lacks '$Substr')" -ForegroundColor Red }
}

# ── Telemetry snapshot (by absolute filename set) ──
function Get-FileSnapshot {
    $files = Get-ChildItem -LiteralPath $tdir -Filter '*.json' -ErrorAction SilentlyContinue
    return @($files | ForEach-Object { $_.FullName })
}

function Get-NewTelemetry {
    param([string[]]$BeforeFiles)
    $afterFiles = Get-FileSnapshot
    $newFiles = @($afterFiles | Where-Object { $BeforeFiles -notcontains $_ })
    if ($newFiles.Count -eq 0) { throw "Get-NewTelemetry expects exactly one new telemetry file (found 0)" }
    if ($newFiles.Count -ne 1) { throw "Get-NewTelemetry expects exactly one new telemetry file (found $($newFiles.Count))" }
    return $newFiles[0]
}

# ── Invocation helpers (HASHTABLE contract) ──

function Invoke-WorkerChild {
    param([hashtable]$WorkerParameters)
    $ts = [guid]::NewGuid().ToString('N')
    $outFile = Join-Path $tdir "test_${ts}_out.txt"
    $scr = Join-Path $tdir "test_$ts.ps1"
    $b64 = Encode-Hashtable -Value $WorkerParameters
    try {
        $body = Build-ChildScript -B64 $b64 -OutFile $outFile
        $body | Out-File -LiteralPath $scr -Encoding utf8
        $p = Start-Process -FilePath powershell.exe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$scr) -NoNewWindow -Wait -PassThru
        $output = if (Test-Path -LiteralPath $outFile) { Get-Content -LiteralPath $outFile -Raw } else { '' }
        return @{ ExitCode = $p.ExitCode; Output = $output }
    } finally {
        Remove-Item -LiteralPath $scr -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $outFile -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-WorkerDirect {
    param([hashtable]$WorkerParameters)
    try {
        $output = & $workerPath @WorkerParameters *>&1 | Out-String
        $code = $LASTEXITCODE
    } catch {
        $output = $_.Exception.Message
        $code = 1
    }
    return @{ ExitCode = $code; Output = $output }
}

# ── JSONL builder ──
function New-Jsonl {
    param([int]$Total = 1000, [int]$InputTokens = 400, [int]$Output = 300, [int]$Reasoning = 200, [int]$CacheRead = 50, [int]$CacheWrite = 50, [ValidateSet('stop','length','tool-calls','content-filter','error','unknown')][string]$Reason = 'stop', [string]$DraftText = '')
    $cacheObj = @{ read = $CacheRead; write = $CacheWrite }
    $tokensObj = @{ total = $Total; input = $InputTokens; output = $Output; reasoning = $Reasoning; cache = $cacheObj }
    $start = @{ type = 'step_start'; sessionID = 'session-test'; part = @{ type = 'step-start' } }
    $finish = @{ type = 'step_finish'; sessionID = 'session-test'; part = @{ type = 'step-finish'; reason = $Reason; tokens = $tokensObj; cost = 0 } }
    $events = @($start | ConvertTo-Json -Depth 10 -Compress)
    if (-not [string]::IsNullOrWhiteSpace($DraftText)) {
        $text = @{ type = 'text'; sessionID = 'session-test'; part = @{ type = 'text'; text = $DraftText } }
        $events += $text | ConvertTo-Json -Depth 10 -Compress
    }
    $events += $finish | ConvertTo-Json -Depth 10 -Compress
    return ($events -join "`n")
}

# ── Valid code contract helper ──
function New-ValidCodeContract {
    param(
        [string]$Objective = 'test',
        [string[]]$AllowedPath = @('scripts/**'),
        [string[]]$ValidationCommand = @('cmd /c exit 0'),
        [int]$MaxRetries = 3,
        [ValidateSet('small','batch','research','extended')][string]$BudgetProfile = 'small',
        [int]$MaxObservedTokens = 0,
        [int]$MaxExecutionSeconds = 300,
        [int]$DuplicateWindowSeconds = 3600,
        [string[]]$FallbackModels = @('nan/mimo-v2.5','nan/deepseek-v4-flash'),
        [switch]$AllowNoChanges,
        [switch]$TestMode,
        [switch]$DryRun,
        [switch]$ValidationMayWriteAllowedPaths,
        [string]$MockPlan = '',
        [hashtable]$ExtraParams = @{}
    )
    $ht = @{
        TaskType = 'code'
        Objective = $Objective
        AllowedPath = $AllowedPath
        ValidationCommand = $ValidationCommand
        MaxRetries = $MaxRetries
        BudgetProfile = $BudgetProfile
        MaxExecutionSeconds = $MaxExecutionSeconds
        DuplicateWindowSeconds = $DuplicateWindowSeconds
        FallbackModels = $FallbackModels
        PlannedBy = 'frontier'
        FrontierPlan = 'Implement the required changes'
        AcceptanceCriteria = @('1. All tests pass','2. No regression')
    }
    if ($MaxObservedTokens -ne 0) { $ht.MaxObservedTokens = $MaxObservedTokens }
    if ($AllowNoChanges) { $ht.AllowNoChanges = $true }
    if ($DryRun) { $ht.DryRun = $true }
    if ($TestMode) { $ht.TestMode = $true }
    if ($ValidationMayWriteAllowedPaths) { $ht.ValidationMayWriteAllowedPaths = $true }
    if (-not [string]::IsNullOrWhiteSpace($MockPlan)) { $ht.MockPlan = $MockPlan }
    if ($ExtraParams.Count -gt 0) {
        foreach ($k in $ExtraParams.Keys) { $ht[$k] = $ExtraParams[$k] }
    }
    return $ht
}

# ────── TESTS ──────
try {
    # 1. Invalid contracts
    if (-not $Only -or $Only -eq 'contracts') {
        Write-Host "`n*** 1. Invalid Contracts ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        # 1a: code without AllowedPath throws
        $r = Invoke-WorkerDirect -WorkerParameters @{TaskType = 'code'; Objective = 'test'; PlannedBy = 'frontier'; FrontierPlan = 'p'; AcceptanceCriteria = 'c'; ValidationCommand = @('cmd /c exit 0'); TestMode = $true}
        Assert-True ($r.ExitCode -ne 0) '1a: code without AllowedPath exits non-zero'
        Assert-Contains $r.Output 'AllowedPath' '1a: error mentions AllowedPath'
    }

    # 2. DryRun
    if (-not $Only -or $Only -eq 'dryrun') {
        Write-Host "`n*** 2. DryRun ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $r = Invoke-WorkerDirect -WorkerParameters (New-ValidCodeContract -Objective 'dryrun-test' -DryRun -TestMode)
        Assert-True ($r.ExitCode -eq 0) '2a: DryRun exit code 0'
        Assert-Contains $r.Output 'DryRun' '2b: DryRun label in output'
        Assert-Contains $r.Output 'qwen3.6' '2c: DryRun shows primary model'

        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'batch-budget-profile' -BudgetProfile batch -DryRun -TestMode)
        Assert-True ($r.ExitCode -eq 0) '2d: batch budget DryRun exits 0'
        $budgetProfileTelemetry = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $pre) -Raw | ConvertFrom-Json
        Assert-Equal $budgetProfileTelemetry.launch.budgetProfile 'batch' '2e: telemetry records batch profile'
        Assert-Equal $budgetProfileTelemetry.launch.budgetSource 'profile' '2f: telemetry records profile source'
        Assert-Equal $budgetProfileTelemetry.launch.maxObservedTokens 350000 '2g: batch profile resolves to 350000 tokens'
        Assert-Equal $budgetProfileTelemetry.admission.profile 'provider-limit' '2g1: dry run records provider-limit admission'
        Assert-Equal $budgetProfileTelemetry.admission.capacity 5 '2g2: dry run records five active NAN slots'
        Assert-Equal $budgetProfileTelemetry.admission.timeoutSeconds 7200 '2g3: dry run records admission timeout'

        foreach ($profileCase in @(
            @{Name='small';Tokens=120000},
            @{Name='batch';Tokens=350000},
            @{Name='research';Tokens=700000},
            @{Name='extended';Tokens=1200000}
        )) {
            $pre = Get-FileSnapshot
            $profileParams = New-ValidCodeContract -Objective "budget-profile-$($profileCase.Name)" -DryRun -TestMode
            $profileParams.BudgetProfile = $profileCase.Name
            $r = Invoke-WorkerChild -WorkerParameters $profileParams
            Assert-True ($r.ExitCode -eq 0) "2g: $($profileCase.Name) budget DryRun exits 0"
            $profileTelemetry = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $pre) -Raw | ConvertFrom-Json
            Assert-Equal $profileTelemetry.launch.budgetProfile $profileCase.Name "2g: telemetry records $($profileCase.Name) profile"
            Assert-Equal $profileTelemetry.launch.maxObservedTokens $profileCase.Tokens "2g: $($profileCase.Name) profile resolves to $($profileCase.Tokens) tokens"
        }

        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'budget-override' -BudgetProfile research -MaxObservedTokens 175000 -DryRun -TestMode)
        Assert-True ($r.ExitCode -eq 0) '2h: explicit budget override DryRun exits 0'
        $budgetOverrideTelemetry = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $pre) -Raw | ConvertFrom-Json
        Assert-Equal $budgetOverrideTelemetry.launch.budgetProfile 'research' '2i: telemetry preserves requested profile with override'
        Assert-Equal $budgetOverrideTelemetry.launch.budgetSource 'override' '2j: telemetry records override source'
        Assert-Equal $budgetOverrideTelemetry.launch.maxObservedTokens 175000 '2k: explicit override wins over profile'

        $r = Invoke-WorkerDirect -WorkerParameters (New-ValidCodeContract -Objective 'invalid-budget-override' -MaxObservedTokens 2000001 -DryRun -TestMode)
        Assert-True ($r.ExitCode -ne 0) '2k: out-of-range budget override fails closed'
        Assert-Contains $r.Output 'MaxObservedTokens' '2k: invalid override error names MaxObservedTokens'

        $r = Invoke-WorkerDirect -WorkerParameters @{TaskType = 'bulletin'; Objective = 'bulletin-dryrun'; InputPath = @('AGENTS.md'); DryRun = $true}
        Assert-True ($r.ExitCode -eq 0) '2l: bulletin DryRun exit 0'
        Assert-Contains $r.Output 'gemma4' '2m: bulletin DryRun shows gemma4'

        $reasoning = New-ValidCodeContract -Objective 'reasoning-route' -DryRun -TestMode
        $reasoning.ModelProfile = 'reasoning'
        $r = Invoke-WorkerDirect -WorkerParameters $reasoning
        Assert-True ($r.ExitCode -eq 0) '2n: reasoning profile DryRun exits 0'
        Assert-Contains $r.Output 'deepseek-v4-flash' '2o: reasoning profile selects DeepSeek'
        Assert-Contains $r.Output 'nan-reasoning-code' '2o1: reasoning profile selects its bounded agent'

        $longContext = New-ValidCodeContract -Objective 'long-context-route' -DryRun -TestMode
        $longContext.ModelProfile = 'long-context'
        $r = Invoke-WorkerDirect -WorkerParameters $longContext
        Assert-True ($r.ExitCode -eq 0) '2p: long-context profile DryRun exits 0'
        Assert-Contains $r.Output 'mimo-v2.5' '2q: long-context profile selects Mimo'
        Assert-Contains $r.Output 'nan-long-context-code' '2q1: long-context profile selects its bounded agent'

        $gemmaCode = New-ValidCodeContract -Objective 'gemma-code-rejected' -DryRun -TestMode
        $gemmaCode.FallbackModels = @('nan/gemma4')
        $r = Invoke-WorkerDirect -WorkerParameters $gemmaCode
        Assert-True ($r.ExitCode -ne 0) '2q2: Gemma code fallback fails closed'
        Assert-Contains $r.Output 'bulletin-only' '2q3: Gemma rejection explains the task boundary'

        $premium = New-ValidCodeContract -Objective 'premium-rejected' -DryRun -TestMode
        $premium.FallbackModels = @('nan/glm5.2')
        $r = Invoke-WorkerDirect -WorkerParameters $premium
        Assert-True ($r.ExitCode -ne 0) '2r: GLM fallback fails closed'
        Assert-Contains $r.Output 'premium NAN fallback' '2s: GLM rejection is explicit'
    }

    # 3. Primary succeeds after two failures (3 attempts)
    if (-not $Only -or $Only -eq 'retry-success') {
        Write-Host "`n*** 3. Primary succeeds after two failures ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $jsonlOk = New-Jsonl -Total 1500 -InputTokens 500 -Output 300 -Reasoning 200 -CacheRead 100 -CacheWrite 50
        $plan = @(
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 0; changedPaths = @('scripts/test.txt'); validationExitCode = 0; jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'retry-success' -MaxRetries 3 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -eq 0) '3a: exit 0 after 2 failures + success'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.attempts.Count -eq 3) '3b: exactly 3 attempts'
            Assert-True ($tel.selectedModel -eq 'nan/qwen3.6') '3c: selected model is primary qwen3.6'
            for ($i = 0; $i -lt 3; $i++) {
                Assert-True ($tel.attempts[$i].model -eq 'nan/qwen3.6') "3d: attempt[$i] is qwen3.6"
            }
        }
    }

    # 4. Primary exhausted, fallback succeeds
    if (-not $Only -or $Only -eq 'fallback-success') {
        Write-Host "`n*** 4. Primary exhausted, fallback succeeds ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $jsonlOk = New-Jsonl -Total 2000 -InputTokens 800 -Output 500 -Reasoning 400 -CacheRead 150 -CacheWrite 100
        $plan = @(
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 0; changedPaths = @('scripts/result.txt'); validationExitCode = 0; jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'fallback-success' -MaxRetries 3 -FallbackModels @('nan/mimo-v2.5') -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -eq 0) '4a: exit 0 after fallback success'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.selectedModel -eq 'nan/mimo-v2.5') '4b: selected model is fallback mimo-v2.5'
            Assert-True ($tel.selectedAgent -eq 'nan-long-context-code') '4b1: Mimo fallback uses long-context code agent'
            Assert-True ($tel.attempts[0].model -eq 'nan/qwen3.6') '4c: attempt 0 is qwen3.6'
            Assert-True ($tel.attempts[3].model -eq 'nan/mimo-v2.5') '4d: attempt 3 is fallback mimo'
        }
    }

    # 5. Complete fallback exhaustion -> blocked
    if (-not $Only -or $Only -eq 'blocked') {
        Write-Host "`n*** 5. Complete fallback exhaustion -> blocked ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $plan = @(
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'blocked' -MaxRetries 3 -FallbackModels @('nan/mimo-v2.5') -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -ne 0) '5a: blocked exits non-zero'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.status -eq 'blocked-needs-new-contract') '5b: telemetry status blocked-needs-new-contract'
            Assert-True ($tel.attempts.Count -eq 6) '5c: 6 total attempts (3x primary + 3x fallback)'
        }
    }

    # 6. Primary + both fallbacks exhausted -> blocked
    if (-not $Only -or $Only -eq 'blocked-all') {
        Write-Host "`n*** 6. Primary + both fallbacks exhausted -> blocked ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $plan = @(
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'blocked-all' -MaxRetries 3 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -ne 0) '6a: blocked-all exits non-zero'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.status -eq 'blocked-needs-new-contract') '6b: status blocked-needs-new-contract'
            Assert-True ($tel.attempts.Count -eq 9) '6c: 9 total attempts'
            Assert-True ($tel.attempts[0].model -eq 'nan/qwen3.6')               '6d: attempt 0 is qwen3.6'
            Assert-True ($tel.attempts[2].model -eq 'nan/qwen3.6')               '6e: attempt 2 is qwen3.6'
            Assert-True ($tel.attempts[3].model -eq 'nan/mimo-v2.5')             '6f: attempt 3 is mimo-v2.5'
            Assert-True ($tel.attempts[5].model -eq 'nan/mimo-v2.5')             '6g: attempt 5 is mimo-v2.5'
            Assert-True ($tel.attempts[6].model -eq 'nan/deepseek-v4-flash')     '6h: attempt 6 is deepseek-v4-flash'
            Assert-True ($tel.attempts[8].model -eq 'nan/deepseek-v4-flash')     '6i: attempt 8 is deepseek-v4-flash'
        }
    }

    # 7. JSONL token extraction
    if (-not $Only -or $Only -eq 'tokens') {
        Write-Host "`n*** 7. JSONL token extraction ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $ev1 = New-Jsonl -Total 1500 -InputTokens 500 -Output 300 -Reasoning 200 -CacheRead 100 -CacheWrite 50 -Reason tool-calls
        $ev2 = New-Jsonl -Total 800  -InputTokens 200 -Output 150 -Reasoning 100 -CacheRead 50  -CacheWrite 25
        $multiJsonl = "$ev1`n$ev2"
        $plan = @(
            @{exitCode = 0; changedPaths = @('scripts/output.txt'); validationExitCode = 0; jsonl = $multiJsonl}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'token-extract' -MaxRetries 1 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -eq 0) '7a: token extraction exits 0'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            $t = $tel.tokensUsage
            # Aggregate: total=2300, input=700, output=450, reasoning=300, cacheRead=150, cacheWrite=75
            Assert-Equal $t.total       2300 '7b: telemetry total sum = 2300'
            Assert-Equal $t.input        700 '7c: telemetry input sum = 700'
            Assert-Equal $t.output       450 '7d: telemetry output sum = 450'
            Assert-Equal $t.reasoning    300 '7e: telemetry reasoning sum = 300'
            Assert-Equal $t.cacheRead    150 '7f: telemetry cacheRead sum = 150'
            Assert-Equal $t.cacheWrite    75 '7g: telemetry cacheWrite sum = 75'
            # Also assert ALL six values at attempt level
            $ta = $tel.attempts[0].tokens
            Assert-Equal $ta.total      2300 '7h: attempt total sum = 2300'
            Assert-Equal $ta.input       700 '7i: attempt input sum = 700'
            Assert-Equal $ta.output      450 '7j: attempt output sum = 450'
            Assert-Equal $ta.reasoning   300 '7k: attempt reasoning sum = 300'
            Assert-Equal $ta.cacheRead   150 '7l: attempt cacheRead sum = 150'
            Assert-Equal $ta.cacheWrite   75 '7m: attempt cacheWrite sum = 75'
        }

        $tooLarge = New-Jsonl -Total 50001
        $budgetPlan = @(@{exitCode = 0; changedPaths = @('scripts/output.txt'); validationExitCode = 0; jsonl = $tooLarge}) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $budgetRun = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'token-budget' -MaxRetries 1 -MaxObservedTokens 50000 -TestMode -MockPlan $budgetPlan)
        Assert-True ($budgetRun.ExitCode -ne 0) '7n: oversized trajectory fails closed'
        $budgetTelemetry = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $pre) -Raw | ConvertFrom-Json
        Assert-Equal $budgetTelemetry.status 'blocked-token-budget' '7o: oversized trajectory has explicit status'

        $timeoutPlan = @(@{exitCode = 1; changedPaths = @(); validationExitCode = 0; terminationReason = 'timeout'; jsonl = ''}) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $timeoutRun = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'execution-timeout' -MaxRetries 1 -TestMode -MockPlan $timeoutPlan)
        Assert-True ($timeoutRun.ExitCode -ne 0) '7p: timed out trajectory fails closed'
        $timeoutTelemetry = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $pre) -Raw | ConvertFrom-Json
        Assert-Equal $timeoutTelemetry.status 'blocked-timeout' '7q: timeout has explicit status'
        Assert-Equal $timeoutTelemetry.attempts[0].terminationReason 'timeout' '7r: timeout reason persists on attempt'
    }

    # 8. No-change rejection
    if (-not $Only -or $Only -eq 'nochange') {
        Write-Host "`n*** 8. No-change rejection ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $jsonlOk = New-Jsonl -Total 500
        $plan = @(
            @{exitCode = 0; changedPaths = @(); validationExitCode = 0; jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'nochange' -MaxRetries 1 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -ne 0) '8a: no-change rejected (exit non-zero)'
    }

    # 9. AllowNoChanges succeeds
    if (-not $Only -or $Only -eq 'allowno') {
        Write-Host "`n*** 9. AllowNoChanges succeeds ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $jsonlOk = New-Jsonl -Total 500
        $plan = @(
            @{exitCode = 0; changedPaths = @(); validationExitCode = 0; jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'allowno' -MaxRetries 1 -AllowNoChanges -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -eq 0) '9a: AllowNoChanges accepted (exit 0)'
    }

    # 10. Path violation
    if (-not $Only -or $Only -eq 'violation') {
        Write-Host "`n*** 10. Path violation ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $jsonlOk = New-Jsonl -Total 500
        $plan = @(
            @{exitCode = 0; changedPaths = @('outside/forbidden.txt'); validationExitCode = 0; jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'violation' -MaxRetries 1 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -ne 0) '10a: path violation exits non-zero'
    }

    # 11. Validation failure
    if (-not $Only -or $Only -eq 'validation') {
        Write-Host "`n*** 11. Validation failure ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $jsonlOk = New-Jsonl -Total 500
        $plan = @(
            @{exitCode = 0; changedPaths = @('scripts/ok.txt'); validationExitCode = 1; jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'valfail' -ValidationCommand @('cmd /c exit 1') -MaxRetries 1 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -ne 0) '11a: validation failure exits non-zero'
    }

    # 12. Bulletin routing and draft retention
    if (-not $Only -or $Only -eq 'bulletin') {
        Write-Host "`n*** 12. Bulletin routing and draft retention ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $plan = @(
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters @{TaskType = 'bulletin'; Objective = 'bulletin-retry'; InputPath = @('AGENTS.md'); MaxRetries = 3; TestMode = $true; MockPlan = $plan}
        Assert-True ($r.ExitCode -ne 0) '12a: bulletin 3 failures exits non-zero'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.attempts.Count -eq 3) '12b: bulletin has exactly 3 attempts'
            foreach ($a in $tel.attempts) {
                Assert-True ($a.model -eq 'nan/gemma4') '12c: bulletin attempt uses gemma4'
            }
        }

        $draftText = 'Relación revisable: TMV02M|occupation:cno11:7401'
        $successPlan = @(
            @{exitCode = 0; changedPaths = @(); validationExitCode = 0; jsonl = (New-Jsonl -Total 1200 -DraftText $draftText)}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $draftRun = Invoke-WorkerChild -WorkerParameters @{TaskType = 'bulletin'; Objective = 'bulletin-draft-output'; InputPath = @('AGENTS.md'); MaxRetries = 1; ModelProfile = 'long-context'; TestMode = $true; MockPlan = $successPlan}
        Assert-True ($draftRun.ExitCode -eq 0) '12d: successful bulletin exits 0'
        Assert-Contains $draftRun.Output $draftText '12e: bulletin draft is returned to the orchestrator'
        $draftTelemetry = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $pre) -Raw | ConvertFrom-Json
        Assert-Equal $draftTelemetry.draftOutput $draftText '12f: telemetry retains the reviewable draft'
        Assert-Equal $draftTelemetry.selectedModel 'nan/mimo-v2.5' '12g: long-context bulletin records MiMo'
    }

    # 12b. Bulletin rejects -AllowedPath (read-only task)
    if (-not $Only -or $Only -eq 'bulletin') {
        Write-Host "`n*** 12b. Bulletin rejects -AllowedPath ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $pre = Get-FileSnapshot
        $r = Invoke-WorkerDirect -WorkerParameters @{TaskType = 'bulletin'; Objective = 'bulletin-rejects-allowedpath'; InputPath = @('AGENTS.md'); AllowedPath = @('scripts/**'); TestMode = $true}
        Assert-True ($r.ExitCode -ne 0) '12b: bulletin with AllowedPath exits non-zero'
        Assert-Contains $r.Output 'AllowedPath' '12c: error mentions AllowedPath'
    }

    # 13. Telemetry exists on failures
    if (-not $Only -or $Only -eq 'telemetry') {
        Write-Host "`n*** 13. Telemetry on failures ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $pre = Get-FileSnapshot
        $plan = @(
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
        ) | ConvertTo-Json -Compress
        $null = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'fail-telemetry' -MaxRetries 3 -TestMode -MockPlan $plan)

        $after = Get-FileSnapshot
        Assert-True (($after.Count) -gt ($pre.Count)) '13a: telemetry file created on failure'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.attempts.Count -ge 1) '13b: telemetry has attempts array'
            Assert-True ($tel.attempts[0].model -ne $null) '13c: attempt has model field'
            Assert-True ($tel.attempts[0].exitCode -ne $null) '13d: attempt has exitCode'
            Assert-True ($tel.frontierContract -ne $null) '13e: frontierContract present in telemetry'
            Assert-True ($tel.frontierContract.plannedBy -eq 'frontier') '13f: plannedBy=frontier in telemetry'
            Assert-True ($tel.frontierContract.planHash.Length -eq 64) '13g: planHash is 64-char hex SHA-256'
            Assert-True ($tel.frontierContract.acceptanceCriteriaCount -ge 1) '13h: acceptanceCriteriaCount >= 1'
            Assert-True ($tel.frontierContract.reviewRequired -eq $true) '13i: reviewRequired=true in telemetry'
            Assert-True ($tel.frontierContract -isnot [string]) '13j: frontierContract is object not raw string'
            $rawJson = Get-Content -LiteralPath $telFile -Raw
            Assert-True ($rawJson -notmatch '"raw.*output"') '13k: no raw output field in telemetry'
            Assert-True ($rawJson -notmatch '"prompt"') '13l: no prompt field in telemetry'
        }
    }

    # 14. Missing MockPlan entries fail closed
    if (-not $Only -or $Only -eq 'fail-closed') {
        Write-Host "`n*** 14. Missing MockPlan entries fail closed ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $plan = @(
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
        ) | ConvertTo-Json -Compress
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'fail-closed' -MaxRetries 3 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -ne 0) '14a: missing entries fail closed (exit non-zero)'
        Assert-Contains $r.Output 'blocked-needs-new-contract' '14b: output contains blocked-needs-new-contract'
    }

    # 15. Non-official fallback ignored in TestMode
    if (-not $Only -or $Only -eq 'fallback-reject') {
        Write-Host "`n*** 15. Non-official fallback ignored in TestMode ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $plan = @(
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
            @{exitCode = 1; changedPaths = @(); validationExitCode = 1; jsonl = ''}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'fallback-reject' -MaxRetries 3 -TestMode -MockPlan $plan -ExtraParams @{FallbackModels = @('nan/fake-model','nan/mimo-v2.5')})
        Assert-True ($r.ExitCode -ne 0) '15a: non-official fallback rejected (blocked exit non-zero)'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.status -eq 'blocked-needs-new-contract') '15b: status blocked-needs-new-contract'
            Assert-True ($tel.attempts.Count -eq 6) '15c: exactly 6 attempts (3 primary + 3 official fallback)'
            # Verify no attempt uses the non-official model
            $nonOfficialAttempts = @($tel.attempts | Where-Object { $_.model -eq 'nan/fake-model' })
            Assert-True ($nonOfficialAttempts.Count -eq 0) '15d: no attempt uses non-official nan/fake-model'
            # Verify official fallback was used
            $fallbackAttempts = @($tel.attempts | Where-Object { $_.model -eq 'nan/mimo-v2.5' })
            Assert-True ($fallbackAttempts.Count -eq 3) '15e: official fallback mimo-v2.5 has 3 attempts'
        }
    }

    # 16. Telemetry simulated is always JSON boolean (not SwitchParameter object)
    if (-not $Only -or $Only -eq 'simulated-bool') {
        Write-Host "`n*** 16. Telemetry simulated is JSON boolean ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        # 16a: TestMode -> simulated=true (boolean)
        $jsonlOk = New-Jsonl -Total 100
        $plan = @(
            @{exitCode = 0; changedPaths = @('scripts/x.txt'); validationExitCode = 0; jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'sim-bool' -MaxRetries 1 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -eq 0) '16a: TestMode success exit 0'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $raw = Get-Content -LiteralPath $telFile -Raw
            # Re-parse as JSON and verify type
            $tel = $raw | ConvertFrom-Json
            Assert-True ($tel.simulated -eq $true) '16b: simulated equals true'
            Assert-True ($tel.simulated.GetType().Name -eq 'Boolean') "16c: simulated type is Boolean (raw=$($tel.simulated.GetType().Name))"
            # Also verify raw JSON does not contain SwitchParameter type info
            Assert-True ($raw -notmatch 'SwitchParameter') '16d: raw JSON has no SwitchParameter token'
            # Verify simulated is true/false literal in JSON (not string)
            Assert-True ($raw -match '"simulated":\s*true') '16e: simulated serializes as JSON true literal'
        }

        # 16b: DryRun -> simulated=true (boolean)
        $pre2 = Get-FileSnapshot
        $r2 = Invoke-WorkerDirect -WorkerParameters (New-ValidCodeContract -Objective 'dry-sim' -DryRun -TestMode)
        Assert-True ($r2.ExitCode -eq 0) '16f: DryRun exit 0'

        $telFile2 = Get-NewTelemetry -BeforeFiles $pre2
        if ($telFile2) {
            $raw2 = Get-Content -LiteralPath $telFile2 -Raw
            $tel2 = $raw2 | ConvertFrom-Json
            Assert-True ($tel2.simulated -eq $true) '16g: DryRun simulated equals true'
            Assert-True ($tel2.simulated.GetType().Name -eq 'Boolean') "16h: DryRun simulated type is Boolean (raw=$($tel2.simulated.GetType().Name))"
            Assert-True ($raw2 -match '"simulated":\s*true') '16i: DryRun simulated serializes as JSON true literal'
            # Also verify frontierContract exists in DryRun
            Assert-True ($null -ne $tel2.frontierContract.plannedBy) '16j: DryRun has plannedBy in frontierContract'
            Assert-True ($null -ne $tel2.frontierContract.planHash) '16k: DryRun has planHash in frontierContract'
            Assert-True ($tel2.frontierContract.reviewRequired -eq $true) '16l: DryRun reviewRequired=true'
        }

        # 16c/d/e: Unit test of [bool] -> JSON serialization (offline)
        $rawF = @{ sim = [bool]$false } | ConvertTo-Json -Compress
        $rawT = @{ sim = [bool]$true }  | ConvertTo-Json -Compress
        Assert-True ($rawF -match '"sim":\s*false\b') '16c: [bool]$false serializes as JSON false literal'
        Assert-True ($rawT -match '"sim":\s*true\b')  '16d: [bool]$true  serializes as JSON true literal'
        Assert-True ($rawF -notmatch '"sim":\s*"false"') '16e: simulated is not string "false"'
    }

    # 17. validationExitCode captured on success (mock)
    if (-not $Only -or $Only -eq 'validation-exitcode') {
        Write-Host "`n*** 17. validationExitCode on successful attempt ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        # 17a: Mock with validationExitCode=0 on success
        $jsonlOk = New-Jsonl -Total 500
        $plan = @(
            @{exitCode = 0; changedPaths = @('scripts/ok.txt'); validationExitCode = 0; jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 've-success' -ValidationCommand @('cmd /c exit 0') -MaxRetries 1 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -eq 0) '17a: success with validationExitCode=0'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.validationFailed -eq $false) '17b: validationFailed=false on success'
            Assert-True ($tel.status -eq 'awaiting-frontier-review') '17c: successful worker awaits frontier review'
            Assert-True ($tel.attempts[0].validationExitCode -eq 0) '17d: attempt validationExitCode=0 on success'
        }

        # 17b: Mock with validationExitCode=1 on failure — attempt should be marked failed
        $pre2 = Get-FileSnapshot
        $plan2 = @(
            @{exitCode = 0; changedPaths = @('scripts/ok2.txt'); validationExitCode = 1; validationDiagnostics = @(@{commandIndex=1;exitCode=1;outputTail='focused failure tail';truncated=$false}); jsonl = $jsonlOk}
        ) | ConvertTo-Json -Depth 8 -Compress
        $r2 = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 've-fail' -ValidationCommand @('npm run format:check') -MaxRetries 1 -TestMode -MockPlan $plan2)
        Assert-True ($r2.ExitCode -ne 0) '17e: mock validationExitCode=1 causes failure (exit non-zero)'

        $telFile2 = Get-NewTelemetry -BeforeFiles $pre2
        if ($telFile2) {
            $tel2 = Get-Content -LiteralPath $telFile2 -Raw | ConvertFrom-Json
            Assert-True ($tel2.validationFailed -eq $true) '17f: validationFailed=true when mock validationExitCode=1'
            Assert-True ($tel2.status -eq 'blocked-needs-new-contract') '17g: status=blocked when validation fails'
            Assert-True ($tel2.attempts[0].validationExitCode -eq 1) '17h: attempt validationExitCode=1 captured'
            Assert-True ($tel2.attempts[0].exitCode -eq 1) '17i: attempt exitCode=1 after validation failure'
            Assert-True ($tel2.changedPaths[0] -eq 'scripts/ok2.txt') '17i2: failed validation preserves changed paths'
            Assert-True ($tel2.attempts[0].validationDiagnostics[0].outputTail -eq 'focused failure tail') '17i3: bounded validation diagnostic is retained'
            Assert-True ($tel2.attempts[0].validationDiagnostics[0].validationId -eq 'format') '17i4: format validation is classified'
            Assert-True ($tel2.attempts[0].validationDiagnostics[0].categoryCode -eq 'shift_left_static_quality') '17i5: format maps to static-quality repair'
            Assert-True ($tel2.attempts[0].validationDiagnostics[0].commandSha256 -match '^[a-f0-9]{64}$') '17i6: validation command is represented by a SHA-256'
            Assert-True ($tel2.attempts[0].validationDiagnostics[0].normalizedFailureSignature -match '^[a-f0-9]{64}$') '17i7: normalized failure signature is stable hash material'
            Assert-True (-not ($tel2.attempts[0].validationDiagnostics[0].PSObject.Properties.Name -contains 'command')) '17i8: raw validation command is absent from diagnostics'
        }
    }

    # 17b. List validationExitCodes: [1,0] blocks with first non-zero=1
    if (-not $Only -or $Only -eq 'validation-exitcode') {
        Write-Host "`n*** 17b. List validationExitCodes [1,0] blocks ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $jsonlOk = New-Jsonl -Total 500
        $plan = @(
            @{exitCode = 0; changedPaths = @('scripts/ok3.txt'); validationExitCode = @(1,0); jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 've-list-block' -ValidationCommand @('cmd /c exit 0') -MaxRetries 1 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -ne 0) '17j: list [1,0] blocks (first non-zero=1)'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.validationFailed -eq $true) '17k: validationFailed=true with list [1,0]'
            Assert-True ($tel.status -eq 'blocked-needs-new-contract') '17l: status blocked with list [1,0]'
            Assert-True ($tel.attempts[0].validationExitCode -eq 1) '17m: attempt validationExitCode=1 from list [1,0]'
        }
    }

    # 17c. List validationExitCodes: [0,0] accepts with 0
    if (-not $Only -or $Only -eq 'validation-exitcode') {
        Write-Host "`n*** 17c. List validationExitCodes [0,0] accepts ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $jsonlOk = New-Jsonl -Total 500
        $plan = @(
            @{exitCode = 0; changedPaths = @('scripts/ok4.txt'); validationExitCode = @(0,0); jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $pre = Get-FileSnapshot
        $r = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 've-list-accept' -ValidationCommand @('cmd /c exit 0') -MaxRetries 1 -TestMode -MockPlan $plan)
        Assert-True ($r.ExitCode -eq 0) '17n: list [0,0] accepts (all zero)'

        $telFile = Get-NewTelemetry -BeforeFiles $pre
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.validationFailed -eq $false) '17o: validationFailed=false with list [0,0]'
            Assert-True ($tel.status -eq 'awaiting-frontier-review') '17p: all-zero validation awaits frontier review'
            Assert-True ($tel.attempts[0].validationExitCode -eq 0) '17q: attempt validationExitCode=0 from list [0,0]'
        }
    }

    # 17d. Opt-in validation writes capture generated artifacts end-to-end
    if (-not $Only -or $Only -eq 'validationwrites') {
        Write-Host "`n*** 17d. Opt-in validation-generated artifacts ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $jsonlOk = New-Jsonl -Total 500

        # 17d1: Allowed generated-only artifact is captured and accepted
        $genOnlyPlan = @(@{
            exitCode = 0
            changedPaths = @()
            postValidationChangedPaths = @('scripts/generated.txt')
            validationExitCode = 0
            jsonl = $jsonlOk
        }) | ConvertTo-Json -Depth 8 -Compress
        $preGen = Get-FileSnapshot
        $genRun = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'gen-only-accept' -MaxRetries 1 -TestMode -MockPlan $genOnlyPlan -ValidationMayWriteAllowedPaths)
        Assert-True ($genRun.ExitCode -eq 0) '17d1: allowed generated-only artifact is accepted'
        $genTel = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $preGen) -Raw | ConvertFrom-Json
        if ($genTel) {
            Assert-True ($genTel.status -eq 'awaiting-frontier-review') '17d2: generated-only success awaits frontier review'
            Assert-True ($genTel.validationMayWriteAllowedPaths -eq $true) '17d3: telemetry records opt-in validation writes'
            Assert-True ($genTel.attempts[0].changedPaths[0] -eq 'scripts/generated.txt') '17d4: generated artifact is captured after validation'
            Assert-True ($genTel.attempts[0].changedPaths.Count -eq 1) '17d5: exactly one generated path is captured'
        }

        # 17d2: Out-of-bounds generated artifact fails closed
        $outOfBoundPlan = @(@{
            exitCode = 0
            changedPaths = @('scripts/ok.txt')
            postValidationChangedPaths = @('outside/forbidden.txt')
            validationExitCode = 0
            jsonl = $jsonlL
        }) | ConvertTo-Json -Depth 8 -Compress
        $preOut = Get-FileSnapshot
        $outRun = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'gen-out-of-bound' -MaxRetries 1 -TestMode -MockPlan $outOfBoundPlan -ValidationMayWriteAllowedPaths)
        Assert-True ($outRun.ExitCode -ne 0) '17d6: out-of-bound generated artifact fails closed'
        $outTel = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $preOut) -Raw | ConvertFrom-Json
        if ($outTel) {
            Assert-True ($outTel.contractViolation -eq $true) '17d7: out-of-bound generated path marks a contract violation'
            Assert-True ($outTel.status -eq 'blocked-needs-new-contract') '17d8: out-of-bound generated path is blocked'
        }

        # 17d3: Default (no opt-in) still rejects an empty candidate
        $defaultNoChangePlan = @(@{
            exitCode = 0
            changedPaths = @()
            validationExitCode = 0
            jsonl = $jsonlL
        }) | ConvertTo-Json -Depth 8 -Compress
        $preDefault = Get-FileSnapshot
        $defaultRun = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'default-nochange-optout' -MaxRetries 1 -TestMode -MockPlan $defaultNoChangePlan)
        Assert-True ($defaultRun.ExitCode -ne 0) '17d9: default no-change is still rejected without opt-in'
        $defaultTel = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $preDefault) -Raw | ConvertFrom-Json
        if ($defaultTel) {
            Assert-True ($defaultTel.validationMayWriteAllowedPaths -eq $false) '17d10: default telemetry leaves opt-in writes false'
        }

        # 17d4: Failed validation retains generated paths in telemetry
        $retainPlan = @(@{
            exitCode = 0
            changedPaths = @('scripts/old.txt')
            postValidationChangedPaths = @('scripts/kept.txt')
            validationExitCode = 1
            validationDiagnostics = @(@{commandIndex=1;exitCode=1;outputTail='focused validation failure';truncated=$false})
            jsonl = $jsonlL
        }) | ConvertTo-Json -Depth 8 -Compress
        $preRetain = Get-FileSnapshot
        $retainRun = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'retain-generated' -MaxRetries 1 -TestMode -MockPlan $retainPlan -ValidationMayWriteAllowedPaths)
        Assert-True ($retainRun.ExitCode -ne 0) '17d11: failed validation with opt-in exits non-zero'
        $retainTel = Get-Content -LiteralPath (Get-NewTelemetry -BeforeFiles $preRetain) -Raw | ConvertFrom-Json
        if ($retainTel) {
            Assert-True ($retainTel.validationFailed -eq $true) '17d12: retained failure marks validationFailed'
            Assert-True ($retainTel.attempts[0].changedPaths[0] -eq 'scripts/kept.txt') '17d13: generated paths are retained on validation failure'
            Assert-True ($retainTel.attempts[0].validationDiagnostics[0].outputTail -eq 'focused validation failure') '17d14: failed validation diagnostic is retained'
            Assert-True ($retainTel.status -eq 'blocked-needs-new-contract') '17d15: retained failure is blocked'
        }
    }

    # 18. Frontier-policy: mandatory parameters enforced (fail-closed)
    if (-not $Only -or $Only -eq 'frontier-policy') {
        Write-Host "`n*** 18. Frontier-policy: mandatory parameters ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        # 18a: PlannedBy missing (empty string from default)
        $r = Invoke-WorkerDirect -WorkerParameters @{TaskType = 'code'; Objective = 'test'; AllowedPath = @('scripts/**'); ValidationCommand = @('cmd /c exit 0'); FrontierPlan = 'p'; AcceptanceCriteria = 'c'; TestMode = $true}
        Assert-True ($r.ExitCode -ne 0) '18a: PlannedBy missing exits non-zero'
        Assert-Contains $r.Output 'PlannedBy' '18b: error mentions PlannedBy'
        Assert-Contains $r.Output 'frontier' '18c: error mentions required frontier value'

        # 18d: PlannedBy incorrect
        $r = Invoke-WorkerDirect -WorkerParameters @{TaskType = 'code'; Objective = 'test'; AllowedPath = @('scripts/**'); ValidationCommand = @('cmd /c exit 0'); PlannedBy = 'human'; FrontierPlan = 'p'; AcceptanceCriteria = 'c'; TestMode = $true}
        Assert-True ($r.ExitCode -ne 0) '18d: PlannedBy=human exits non-zero'
        Assert-Contains $r.Output 'PlannedBy' '18e: error mentions PlannedBy'

        # 18f: PlannedBy wrong case
        $r = Invoke-WorkerDirect -WorkerParameters @{TaskType = 'code'; Objective = 'test'; AllowedPath = @('scripts/**'); ValidationCommand = @('cmd /c exit 0'); PlannedBy = 'Frontier'; FrontierPlan = 'p'; AcceptanceCriteria = 'c'; TestMode = $true}
        Assert-True ($r.ExitCode -ne 0) '18f: PlannedBy=Frontier (wrong case) exits non-zero'

        # 18h: FrontierPlan missing
        $r = Invoke-WorkerDirect -WorkerParameters @{TaskType = 'code'; Objective = 'test'; AllowedPath = @('scripts/**'); ValidationCommand = @('cmd /c exit 0'); PlannedBy = 'frontier'; AcceptanceCriteria = 'c'; TestMode = $true}
        Assert-True ($r.ExitCode -ne 0) '18h: FrontierPlan missing exits non-zero'
        Assert-Contains $r.Output 'FrontierPlan' '18i: error mentions FrontierPlan'

        # 18j: AcceptanceCriteria missing
        $r = Invoke-WorkerDirect -WorkerParameters @{TaskType = 'code'; Objective = 'test'; AllowedPath = @('scripts/**'); ValidationCommand = @('cmd /c exit 0'); PlannedBy = 'frontier'; FrontierPlan = 'p'; TestMode = $true}
        Assert-True ($r.ExitCode -ne 0) '18j: AcceptanceCriteria missing exits non-zero'
        Assert-Contains $r.Output 'AcceptanceCriteria' '18k: error mentions AcceptanceCriteria'

        # 18l: ValidationCommand missing for code (even TestMode)
        $r = Invoke-WorkerDirect -WorkerParameters (New-ValidCodeContract -Objective 'no-validation' -TestMode -MaxRetries 1 -AllowedPath @('scripts/**') -ValidationCommand @())
        Assert-True ($r.ExitCode -ne 0) '18l: ValidationCommand empty for code exits non-zero'
        Assert-Contains $r.Output 'ValidationCommand' '18m: error mentions ValidationCommand'

        # 18n: Complete valid contract passes (DryRun smoke test)
        $before18n = Get-FileSnapshot
        $r = Invoke-WorkerDirect -WorkerParameters (New-ValidCodeContract -Objective 'fc-complete' -DryRun -TestMode)
        Assert-True ($r.ExitCode -eq 0) '18n: complete valid contract DryRun passes'

        # 18o: Telemetry contains frontierContract with DryRun
        $telFile = Get-NewTelemetry -BeforeFiles $before18n
        if ($telFile) {
            $tel = Get-Content -LiteralPath $telFile -Raw | ConvertFrom-Json
            Assert-True ($tel.frontierContract.plannedBy -eq 'frontier') '18o: dry-run frontierContract plannedBy=frontier'
            Assert-True ($tel.frontierContract.planHash.Length -eq 64) '18p: dry-run planHash is 64 chars'
            Assert-True ($tel.frontierContract.acceptanceCriteriaCount -eq 2) '18q: dry-run acceptanceCriteriaCount'
            Assert-True ($tel.frontierContract.reviewRequired -eq $true) '18r: dry-run reviewRequired=true'
        }

        # 18s: YAML routing control check
        if (Test-Path -LiteralPath $yamlPath) {
            $yamlText = Get-Content -LiteralPath $yamlPath -Raw
            Assert-True ($yamlText -match 'plan:\s*orchestrator') '18s: YAML has plan:orchestrator'
            Assert-True ($yamlText -match 'implement:\s*codeExecutor') '18s2: YAML has implement:codeExecutor'
            Assert-True ($yamlText -match 'verifyWith:\s*reviewer') '18s3: YAML has verifyWith:reviewer'
            Assert-True ($yamlText -notmatch 'default:\s*codeExecutor') '18t: YAML code has no default:codeExecutor direct route'

            # 18x-18z: Check new controls are present and enforced
            Assert-True ($yamlText -match 'requireFrontierPlanForCode:\s*true') '18x: YAML requireFrontierPlanForCode=true'
            Assert-True ($yamlText -match 'requireAcceptanceCriteriaForCode:\s*true') '18y: YAML requireAcceptanceCriteriaForCode=true'
            Assert-True ($yamlText -match 'requireValidationForCode:\s*true') '18z: YAML requireValidationForCode=true'
            Assert-True ($yamlText -match 'frontierContract') '18aa: YAML telemetry has frontierContract topLevelField'
            Assert-True (([regex]::Matches($yamlText, '(?m)^\s+fallbackModels:')).Count -eq 1) '18ab: YAML has one fallbackModels key'
            Assert-True ($yamlText -match 'maxExecutionSeconds:\s*1800') '18ac: YAML declares execution timeout'
            Assert-True ($yamlText -match 'profile:\s*provider-limit') '18ac1: YAML enables official provider-limit admission'
            Assert-True ($yamlText -match 'capacity:\s*5') '18ac2: YAML admits five active NAN workers'
            Assert-True ($yamlText -match 'queueTimeConsumesExecutionTimeout:\s*false') '18ac3: YAML excludes queue wait from execution timeout'
            Assert-True ($yamlText -match 'duplicateWindowSeconds:\s*3600') '18ad: YAML declares duplicate window'
            Assert-True ($yamlText -match 'frontierSupervisor:\s*\r?\n\s+enabled:\s*true') '18ad1: YAML enables frontier supervisor'
            Assert-True ($yamlText -match 'automaticWorkerRelaunchAfterFrontierRetry:\s*true') '18ad2: YAML declares adaptive relaunch'
            Assert-True ($yamlText -match 'retryFromAcceptedBase:\s*true') '18ad3: YAML requires repair from the accepted base'
            Assert-True ($yamlText -match 'release:\s*v0\.3\.1') '18ad4: YAML pins the latest released runtime tag'
            Assert-True ($yamlText -match 'releaseCommit:\s*ae1640e2a7d6151bc6a331be62c6e196d7852c66') '18ad5: YAML pins the released runtime commit'
            Assert-True ($yamlText -match 'commit:\s*ae1640e2a7d6151bc6a331be62c6e196d7852c66') '18ad6: YAML pins Runtime V4 v0.3.1'
            Assert-True ($yamlText -match 'provenanceCompatibilityCommit:\s*42cf5c2b1b55628332ce9fc1089957bd4fca3931') '18ad6a: YAML preserves signed provenance compatibility merge'
            Assert-True ($yamlText -match 'level:\s*BOUNDED_LOCAL') '18ad7: YAML states the evidenced adoption level'
            Assert-True ($yamlText -match 'activationTarget:\s*ANALYSIS_ONLY') '18ad7a: YAML limits Runtime V4 activation to analysis'
            Assert-True ($yamlText -match 'hostCompositionHash:\s*null') '18ad7b: YAML records absence of certified host composition'
            Assert-True ($yamlText -match 'delegationProvenance:\s*\r?\n\s+schemaVersion:\s*4') '18ad8: YAML identifies delegation provenance V4'
            Assert-True ($yamlText -match 'enforcement:\s*DISABLED') '18ad9: YAML keeps provenance enforcement disabled before qualification'
            Assert-True ($yamlText -match 'publicationThroughRuntimeV4:\s*false') '18ad10: YAML does not claim broker-owned publication'
            Assert-True ($yamlText -match 'protectedHostSigner:\s*false') '18ad11: YAML records the missing protected signer'
            Assert-True ($yamlText -match 'syntheticShakedownPassed:\s*false') '18ad12: YAML records the pending signed shakedown'
            Assert-True ($yamlText -match 'providerAttributionShakedownPassed:\s*true') '18ad12a: YAML records provider attribution shakedown'
            Assert-True ($yamlText -match 'maxConcurrentProviderResponsesVerified:\s*5') '18ad12b: YAML records five verified concurrent responses'
            Assert-True ($yamlText -match 'providerAttributionBatchShakedownPassed:\s*true') '18ad12c: YAML records real provider-attributed batch shakedown'
            Assert-True ($yamlText -match 'concurrentBatchWorkersVerified:\s*2') '18ad12d: YAML records two concurrent batch workers'
            Assert-True ($yamlText -notmatch 'BEGIN (?:EC |OPENSSH |RSA |DSA )?PRIVATE KEY') '18ad13: YAML contains no private signing key'
            Assert-True ($yamlText -match 'batchExecutor:\s*\r?\n\s+enabled:\s*true') '18ad14: YAML enables bounded batch executor'
            Assert-True ($yamlText -match 'maxConcurrency:\s*5') '18ad15: YAML caps batch concurrency at five'
            Assert-True ($yamlText -match 'defaultConcurrency:\s*1') '18ad15a: YAML defaults batch concurrency to one'
            Assert-True ($yamlText -match 'exactDisjointPathsRequired:\s*true') '18ad16: YAML requires disjoint exact batch paths'
            Assert-True ($yamlText -match 'requestsPerMinutePerKey:\s*60') '18ad17: YAML records NAN request limit'
            Assert-True ($yamlText -match 'tokensPerMinutePerModel:\s*1500000') '18ad18: YAML records NAN per-model TPM limit'
            Assert-True ($yamlText -match 'requireProviderReportedTokensForUsageClaims:\s*true') '18ad19: YAML forbids client-only usage claims'
            Assert-True (Test-Path -LiteralPath (Join-Path $repoRoot 'scripts\Invoke-NanWorkerBatch.ps1')) '18ad20: batch executor exists'
            Assert-True (Test-Path -LiteralPath (Join-Path $repoRoot 'scripts\Invoke-NanWorkerContract.ps1')) '18ad21: batch contract adapter exists'
            $runtimePolicyPath = Join-Path $repoRoot 'policies\repository-policy.yaml'
            $runtimeProfilePath = Join-Path $repoRoot 'profiles\runtime-2026-08-16.yaml'
            $runtimeActivationPath = Join-Path $repoRoot '.agent-orchestration\activation-v4.json'
            Assert-True (Test-Path -LiteralPath $runtimePolicyPath) '18ad22: Runtime V4 repository policy exists'
            Assert-True (Test-Path -LiteralPath $runtimeProfilePath) '18ad23: Runtime V4 profile exists'
            Assert-True (Test-Path -LiteralPath $runtimeActivationPath) '18ad24: Runtime V4 analysis activation exists'
            if ((Test-Path -LiteralPath $runtimePolicyPath) -and (Test-Path -LiteralPath $runtimeProfilePath) -and (Test-Path -LiteralPath $runtimeActivationPath)) {
                $runtimePolicyText = Get-Content -LiteralPath $runtimePolicyPath -Raw
                $runtimeProfileText = Get-Content -LiteralPath $runtimeProfilePath -Raw
                $runtimeActivation = Get-Content -LiteralPath $runtimeActivationPath -Raw | ConvertFrom-Json
                Assert-True ($runtimePolicyText -match 'publication:\s*\r?\n\s+enabled:\s*false') '18ad25: Runtime V4 publication is disabled'
                Assert-True ($runtimeProfileText -match 'maxEconomyParallelRequests:\s*1') '18ad26: Runtime V4 economy concurrency is one'
                Assert-True ($runtimeProfileText -match 'maxConcurrentRunsPerRepository:\s*1') '18ad27: Runtime V4 repository concurrency is one'
                Assert-True ($runtimeActivation.target -eq 'ANALYSIS_ONLY') '18ad28: activation target is analysis only'
                Assert-True ($null -eq $runtimeActivation.hostCompositionHash) '18ad29: activation has no certified host composition'
                Assert-True ($runtimeActivation.activationHash -match '^[a-f0-9]{64}$') '18ad30: activation is hash-bound'
                Assert-True (-not (Test-Path -LiteralPath (Join-Path $repoRoot '.codex\config.toml'))) '18ad31: unavailable required MCP binding is not retained'
            }

            $workerText = Get-Content -LiteralPath $workerPath -Raw
            Assert-True ($workerText -notmatch "'--auto'") '18ae: worker does not pass --auto'
            Assert-True ($workerText -match 'Invoke-OpenCodeBudgeted') '18af: worker uses streaming budget launcher'
            Assert-True ($workerText -match 'function\s+Compute-FileSha256') '18af0: worker provides a PowerShell 5.1-compatible file hasher'
            Assert-True ($workerText -notmatch 'Get-FileHash') '18af0a: worker does not depend on unavailable Get-FileHash cmdlet'
            Assert-True ($workerText -match 'blocked-unverified-provider') '18af1: worker fails closed without provider response evidence'
            Assert-True ($workerText -match 'XDG_DATA_HOME') '18af2: worker isolates OpenCode state per execution'
            Assert-True (Test-Path -LiteralPath (Join-Path $repoRoot 'scripts\orchestration\nan-audit-proxy.mjs')) '18af3: provider response audit proxy exists'
            Assert-True (Test-Path -LiteralPath (Join-Path $repoRoot '.opencode\agents\nan-reasoning-code.md')) '18af4: DeepSeek bounded code agent exists'
            Assert-True (Test-Path -LiteralPath (Join-Path $repoRoot '.opencode\agents\nan-long-context-code.md')) '18af5: MiMo bounded code agent exists'
            Assert-True (-not (Test-Path -LiteralPath (Join-Path $repoRoot '.opencode\commands\implementar.md'))) '18ag: direct code command is absent'
            Assert-True (-not (Test-Path -LiteralPath (Join-Path $repoRoot '.opencode\commands\boletin.md'))) '18ah: direct bulletin command is absent'

            # 18u-18w: Check specific routes use correct trio
            # Read YAML sections by detecting indented routes
            $lines = ($yamlText -split "`r?`n")
            $i = 0
            while ($i -lt $lines.Count) {
                if ($lines[$i] -match '^\s{2}(code|debugging|cross_file_refactor|multi_file):\s*$') {
                    $route = $Matches[1]
                    # Collect lines of this section (until next top-level key)
                    $j = $i + 1
                    $sectionLines = @()
                    while ($j -lt $lines.Count -and ($lines[$j] -match '^\s{3}$' -or $lines[$j] -match '^\s{4}\S')) {
                        $sectionLines += $lines[$j]
                        $j++
                    }
                    $sectionText = $sectionLines -join "`n"
                    Assert-True ($sectionText -match 'implement:\s*codeExecutor') "18u: $route implement=codeExecutor"
                    Assert-True ($sectionText -match 'plan:\s*orchestrator' -or $sectionText -match 'diagnose:\s*orchestrator') "18v: $route has orchestrator plan/diagnose"
                    Assert-True ($sectionText -match 'verifyWith:\s*reviewer') "18w: $route has reviewer verifyWith"
                    $i = $j
                    continue
                }
                $i++
            }
        } else {
            Write-Host "  SKIP: YAML checks (file not at $yamlPath)" -ForegroundColor Yellow
        }
    }

    # 21. Step limits structural test (steplimits)
    if (-not $Only -or $Only -eq 'steplimits') {
        Write-Host "`n*** 21. Step limits structural test ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        # 21a-21c: agent markdown step limits
        $agentCodePath     = Join-Path $repoRoot '.opencode\agents\nan-code.md'
        $agentReasoningPath= Join-Path $repoRoot '.opencode\agents\nan-reasoning-code.md'
        $agentContextPath  = Join-Path $repoRoot '.opencode\agents\nan-long-context-code.md'
        Assert-True (Test-Path -LiteralPath $agentCodePath) '21a: nan-code.md exists'
        Assert-True (Test-Path -LiteralPath $agentReasoningPath) '21b: nan-reasoning-code.md exists'
        Assert-True (Test-Path -LiteralPath $agentContextPath) '21c: nan-long-context-code.md exists'

        $codeSteps = [int](Select-String -Path $agentCodePath -Pattern '^\s*steps:\s*\d+' | ForEach-Object { ($_.Line -split '\s+')[1] })
        Assert-Equal $codeSteps 8 '21d: nan-code.md steps equals 8'

        $reasoningSteps = [int](Select-String -Path $agentReasoningPath -Pattern '^\s*steps:\s*\d+' | ForEach-Object { ($_.Line -split '\s+')[1] })
        Assert-Equal $reasoningSteps 40 '21e: nan-reasoning-code.md steps equals 40'

        $contextSteps = [int](Select-String -Path $agentContextPath -Pattern '^\s*steps:\s*\d+' | ForEach-Object { ($_.Line -split '\s+')[1] })
        Assert-Equal $contextSteps 50 '21f: nan-long-context-code.md steps equals 50'

        # 21g-21i: bash: deny on all three agents
        $codeText     = Get-Content -LiteralPath $agentCodePath -Raw
        $reasoningText= Get-Content -LiteralPath $agentReasoningPath -Raw
        $contextText  = Get-Content -LiteralPath $agentContextPath -Raw
        Assert-True ($codeText -match 'bash:\s*deny') '21g: code agent has bash:deny'
        Assert-True ($reasoningText -match 'bash:\s*deny') '21h: reasoning agent has bash:deny'
        Assert-True ($contextText -match 'bash:\s*deny') '21i: context agent has bash:deny'

        # 21j-21l: task: deny on all three agents
        Assert-True ($codeText -match 'task:\s*deny') '21j: code agent has task:deny'
        Assert-True ($reasoningText -match 'task:\s*deny') '21k: reasoning agent has task:deny'
        Assert-True ($contextText -match 'task:\s*deny') '21l: context agent has task:deny'

        # 21m-21n: YAML codeExecutor maxSteps and bulletinReader maxSteps
        if (Test-Path -LiteralPath $yamlPath) {
            $yamlText = Get-Content -LiteralPath $yamlPath -Raw

            # Use singleline regex to traverse newlines inside the codeExecutor block
            Assert-True ($yamlText -match '(?s)codeExecutor:.*?maxSteps:\s*50\b') '21m: YAML codeExecutor maxSteps=50 (singleline regex)'
            Assert-True ($yamlText -match '(?s)bulletinReader:.*?maxSteps:\s*12\b') '21n: YAML bulletinReader maxSteps=12 (singleline regex)'

            # 21o: verify bulletinReader section via newline-traversing regex (the repair)
            Assert-True ($yamlText -match '(?ms)^\s{2}bulletinReader:.*?^\s{4}maxSteps:\s*12') '21o: bulletinReader section regex traverses newlines'

            # 21p: codeExecutor section also parsed via newline-traversing regex
            Assert-True ($yamlText -match '(?ms)^\s{2}codeExecutor:.*?^\s{4}maxSteps:\s*50') '21p: codeExecutor section regex traverses newlines'

            # 21q: verify a non-point-matches-does-not-cross-section (negative check)
            Assert-True ($yamlText -notmatch 'bulletinReader.*codeExecutor') '21q: bulletinReader does not span into codeExecutor'
        }
    }

    # ── Results ──
    # 19. Host-selected telemetry path for unambiguous supervisor evidence
    if (-not $Only -or $Only -eq 'telemetry-path') {
        Write-Host "`n*** 19. Explicit Telemetry Path ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray
        $explicitTelemetry = Join-Path $tdir "explicit_$([guid]::NewGuid().ToString('N')).json"
        try {
            $jsonlOk = New-Jsonl -Total 1000
            $plan = @(@{exitCode = 0; changedPaths = @('scripts/result.txt'); validationExitCode = 0; jsonl = $jsonlOk}) | ConvertTo-Json -Compress
            $parameters = New-ValidCodeContract -Objective 'explicit-telemetry' -MaxRetries 1 -TestMode -MockPlan $plan
            $parameters.TelemetryOutputPath = $explicitTelemetry
            $r = Invoke-WorkerDirect -WorkerParameters $parameters
            Assert-True ($r.ExitCode -eq 0) '19a: explicit telemetry run succeeds'
            Assert-True (Test-Path -LiteralPath $explicitTelemetry -PathType Leaf) '19b: host-selected telemetry file exists'
            if (Test-Path -LiteralPath $explicitTelemetry -PathType Leaf) {
                $telemetry = Get-Content -LiteralPath $explicitTelemetry -Raw | ConvertFrom-Json
                Assert-True ($telemetry.status -eq 'awaiting-frontier-review') '19c: explicit telemetry is the terminal worker evidence'
                Assert-True ($telemetry.providerEvidence.evidenceClass -eq 'simulated') '19d: test telemetry never claims provider evidence'
            }
        } finally {
            Remove-Item -LiteralPath $explicitTelemetry -Force -ErrorAction SilentlyContinue
        }
    }

    # 22. OpenCode 1.18 finish reasons and isolated config bootstrap
    if (-not $Only -or $Only -eq 'opencode-bootstrap') {
        Write-Host "`n*** 22. OpenCode bootstrap compatibility ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $workerSource = Get-Content -LiteralPath $workerPath -Raw
        Assert-Contains $workerSource 'XDG_CONFIG_HOME' '22a: child receives isolated XDG_CONFIG_HOME'
        Assert-Contains $workerSource "'content-filter','error','unknown'" '22b: parser includes all OpenCode finish reasons'

        foreach ($reason in @('length','content-filter','error','unknown')) {
            $explicitTelemetry = Join-Path $tdir "finish_${reason}_$([guid]::NewGuid().ToString('N')).json"
            try {
                $jsonl = New-Jsonl -Total 1234 -Reason $reason
                $plan = @(@{exitCode = 0; changedPaths = @(); validationExitCode = 0; jsonl = $jsonl}) | ConvertTo-Json -Compress
                $parameters = New-ValidCodeContract -Objective "finish-$reason" -MaxRetries 1 -AllowNoChanges -TestMode -MockPlan $plan
                $parameters.TelemetryOutputPath = $explicitTelemetry
                $result = Invoke-WorkerDirect -WorkerParameters $parameters
                Assert-True ($result.ExitCode -ne 0) "22c: $reason is not accepted as success"
                Assert-True (Test-Path -LiteralPath $explicitTelemetry -PathType Leaf) "22d: $reason still writes telemetry"
                if (Test-Path -LiteralPath $explicitTelemetry -PathType Leaf) {
                    $telemetry = Get-Content -LiteralPath $explicitTelemetry -Raw | ConvertFrom-Json
                    Assert-Equal $telemetry.status 'blocked-harness-failure' "22e: $reason is classified as harness failure"
                    Assert-Equal $telemetry.tokensUsage.total 1234 "22f: $reason usage is retained"
                }
            } finally {
                Remove-Item -LiteralPath $explicitTelemetry -Force -ErrorAction SilentlyContinue
            }
        }
    }

    # 23. Failed harness diagnostics remain reviewable and sanitized
    if (-not $Only -or $Only -eq 'harness-diagnostics') {
        Write-Host "`n*** 23. Failed harness diagnostics are retained safely ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        $diagnosticDraft = 'Worker stopped before invoking edit because the tool call failed.'
        $diagnosticJsonl = New-Jsonl -Total 900 -DraftText $diagnosticDraft
        $diagnosticPlan = @(@{
            exitCode = 1
            changedPaths = @()
            validationExitCode = 1
            jsonl = $diagnosticJsonl
            stderr = 'Authorization: Bearer sk-diagnostic-secret NAN_API_KEY=sk-another-secret harness failed'
        }) | ConvertTo-Json -Depth 8 -Compress
        $beforeDiagnostics = Get-FileSnapshot
        $diagnosticRun = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 'harness-diagnostics' -MaxRetries 1 -TestMode -MockPlan $diagnosticPlan)
        Assert-True ($diagnosticRun.ExitCode -ne 0) '23a: failed harness remains blocked'
        $diagnosticTelemetryFile = Get-NewTelemetry -BeforeFiles $beforeDiagnostics
        Assert-True ($null -ne $diagnosticTelemetryFile) '23b: failed harness writes telemetry'
        if ($diagnosticTelemetryFile) {
            $diagnosticTelemetry = Get-Content -LiteralPath $diagnosticTelemetryFile -Raw | ConvertFrom-Json
            Assert-Equal $diagnosticTelemetry.attempts[0].draftOutput $diagnosticDraft '23c: failed draft is retained'
            Assert-Contains $diagnosticTelemetry.attempts[0].harnessStderrTail '[REDACTED]' '23d: stderr records redaction markers'
            Assert-True ($diagnosticTelemetry.attempts[0].harnessStderrTail -notmatch 'sk-diagnostic-secret|sk-another-secret') '23e: stderr does not retain API keys'
            Assert-True ($diagnosticTelemetry.attempts[0].harnessStderrTruncated -eq $false) '23f: short stderr is not marked truncated'
            Assert-True ($diagnosticTelemetry.attempts[0].PSObject.Properties.Name -contains 'eventLogFile') '23g: event-log evidence field is present'
            Assert-True ($diagnosticTelemetry.attempts[0].PSObject.Properties.Name -contains 'toolUseCount') '23h: tool-use evidence field is present'
        }
    }

    # 20. Structural configuration checks (no network)
    if (-not $Only -or $Only -eq 'structure') {
        Write-Host "`n*** 20. Structural configuration checks ***" -ForegroundColor Cyan
        Write-Host ("-" * 40) -ForegroundColor DarkGray

        # --- opencode.json checks ---
        $ocPath = Join-Path $repoRoot 'opencode.json'
        Assert-True (Test-Path -LiteralPath $ocPath) '20a: opencode.json exists'
        if (Test-Path -LiteralPath $ocPath) {
            $ocRaw = Get-Content -LiteralPath $ocPath -Raw
            $oc = $ocRaw | ConvertFrom-Json

            # Provider declaration
            Assert-True ($null -ne $oc.provider) '20b: opencode.json has provider'
            Assert-True ($null -ne $oc.provider.nan) '20c: opencode.json declares nan provider'
            Assert-Equal $oc.provider.nan.npm '@ai-sdk/openai-compatible' '20d: nan adapter is @ai-sdk/openai-compatible'
            Assert-Equal $oc.provider.nan.options.baseURL 'https://api.nan.builders/v1' '20e: nan baseURL is https://api.nan.builders/v1'
            Assert-Equal $oc.provider.nan.options.timeout 600000 '20f: nan timeout is 600000'

            # No apiKey in nan provider
            Assert-True ($null -eq $oc.provider.nan.options.apiKey) '20g: nan provider has no apiKey'
            Assert-True ($ocRaw -notmatch '"apiKey"') '20h: raw opencode.json has no apiKey field anywhere'

            # Exactly 4 models declared
            $modelNames = @($oc.provider.nan.models.PSObject.Properties.Name)
            Assert-Equal $modelNames.Count 4 '20i: exactly 4 models declared'
            Assert-True ($modelNames -contains 'qwen3.6') '20j: qwen3.6 model present'
            Assert-True ($modelNames -contains 'gemma4') '20k: gemma4 model present'
            Assert-True ($modelNames -contains 'deepseek-v4-flash') '20l: deepseek-v4-flash model present'
            Assert-True ($modelNames -contains 'mimo-v2.5') '20m: mimo-v2.5 model present'

            # Context window limits
            Assert-Equal $oc.provider.nan.models.'qwen3.6'.limit.context 262144 '20n: qwen3.6 contextWindow 262144'
            Assert-Equal $oc.provider.nan.models.gemma4.limit.context 262144 '20o: gemma4 contextWindow 262144'
            Assert-Equal $oc.provider.nan.models.'deepseek-v4-flash'.limit.context 1048576 '20p: deepseek-v4-flash contextWindow 1048576'
            Assert-Equal $oc.provider.nan.models.'mimo-v2.5'.limit.context 1048576 '20q: mimo-v2.5 contextWindow 1048576'

            # Output token limits
            Assert-Equal $oc.provider.nan.models.'qwen3.6'.limit.output 32768 '20r: qwen3.6 output limit 32768'
            Assert-Equal $oc.provider.nan.models.gemma4.limit.output 16384 '20r1: gemma4 output limit 16384'
            Assert-Equal $oc.provider.nan.models.'deepseek-v4-flash'.limit.output 65536 '20r2: deepseek-v4-flash output limit 65536'
            Assert-Equal $oc.provider.nan.models.'mimo-v2.5'.limit.output 65536 '20r3: mimo-v2.5 output limit 65536'

            # No GLM model anywhere
            Assert-True ($ocRaw -notmatch 'glm5\.2') '20t: no glm5.2 in opencode.json'
            Assert-True ($ocRaw -notmatch 'glm') '20u: no glm string at all in opencode.json'

            # Existing guards preserved
            Assert-Equal $oc.share 'disabled' '20v: share is disabled'
            Assert-Equal $oc.autoupdate $false '20w: autoupdate is false'
            Assert-Equal $oc.subagent_depth 0 '20x: subagent_depth is 0'
            Assert-True (($oc.enabled_providers | Where-Object { $_ -eq 'nan' }).Count -eq 1) '20y: nan in enabled_providers'
            Assert-True ($oc.mcp.esdata.enabled -eq $false) '20z: MCP esdata is disabled'
            Assert-True ($null -ne $oc.watcher.ignore) '20aa: watcher ignore list is present (not null)'
        }

        # --- YAML structural checks ---
        if (Test-Path -LiteralPath $yamlPath) {
            $yamlText = Get-Content -LiteralPath $yamlPath -Raw

            # Retry policy
            Assert-True ($yamlText -match 'retryPolicy:') '20ab: YAML has retryPolicy section'
            Assert-True ($yamlText -match 'maxAttempts:\s*3') '20ac: retryPolicy maxAttempts is 3'
            Assert-True ($yamlText -match '429') '20ad: retryPolicy includes 429 rate_limit_exceeded'
            Assert-True ($yamlText -match '5xx') '20ae: retryPolicy includes 5xx server errors'
            Assert-True ($yamlText -match 'retryAfterCapSeconds:\s*30') '20af: Retry-After cap is 30s'
            Assert-True ($yamlText -match 'nonRetryableStatuses:') '20ag: YAML defines nonRetryableStatuses'
            Assert-True ($yamlText -match '401') '20ah: nonRetryable includes 401 auth'
            Assert-True ($yamlText -match '403') '20ai: nonRetryable includes 403 quota/authorization'
            Assert-True ($yamlText -match '400') '20aj: nonRetryable includes invalid requests'
            Assert-True ($yamlText -match 'nonRetryable429Codes:') '20aj1: quota 429 codes do not retry'

            # Agent table
            Assert-True ($yamlText -match 'agentTable:') '20ak: YAML has agentTable section'
            Assert-True ($yamlText -match 'model:\s*qwen3\.6') '20al: agentTable has qwen3.6'
            Assert-True ($yamlText -match 'agent:\s*nan-code') '20am: agentTable has nan-code agent'
            Assert-True ($yamlText -match 'model:\s*deepseek-v4-flash') '20an: agentTable has deepseek-v4-flash'
            Assert-True ($yamlText -match 'agent:\s*nan-reasoning-code') '20ao: agentTable has nan-reasoning-code agent'
            Assert-True ($yamlText -match 'model:\s*mimo-v2\.5') '20ap: agentTable has mimo-v2.5'
            Assert-True ($yamlText -match 'agent:\s*nan-long-context-code') '20aq: agentTable has nan-long-context-code agent'
            Assert-True ($yamlText -match 'model:\s*gemma4') '20ar: agentTable has gemma4'
            Assert-True ($yamlText -match 'agent:\s*nan-bulletin') '20as: agentTable has nan-bulletin agent'
        } else {
            Write-Host "  SKIP: YAML structural checks (file not at $yamlPath)" -ForegroundColor Yellow
        }

        # --- AGENTS.md structural checks ---
        $agentsPath = Join-Path $repoRoot 'AGENTS.md'
        if (Test-Path -LiteralPath $agentsPath) {
            $agentsText = Get-Content -LiteralPath $agentsPath -Raw
            Assert-True ($agentsText -match 'Criterios de selección de modelo') '20at: AGENTS.md has selection criteria section'
            Assert-True ($agentsText -match 'nan-code') '20au: AGENTS.md references nan-code agent'
            Assert-True ($agentsText -match 'nan-reasoning-code') '20av: AGENTS.md references nan-reasoning-code agent'
            Assert-True ($agentsText -match 'nan-long-context-code') '20aw: AGENTS.md references nan-long-context-code agent'
            Assert-True ($agentsText -match 'nan-bulletin') '20ax: AGENTS.md references nan-bulletin agent'
            Assert-True ($agentsText -match 'Prohibiciones de modelo') '20ay: AGENTS.md has prohibitions section'
            Assert-True ($agentsText -match 'glm5\.2.*[Pp]rohibido') '20az: GLM5.2 marked as prohibited'
            Assert-True ($agentsText -match 'gemma4.*[Ss]olo lectura|Prohibido.*gemma4') '20ba: Gemma4 prohibition for code documented'
            Assert-True ($agentsText -match 'broker rechaza el parámetro') '20bb: Gemma code fallback is rejected before execution'
        } else {
            Write-Host "  SKIP: AGENTS.md structural checks (file not at $agentsPath)" -ForegroundColor Yellow
        }
    }

    $status = if ($FAIL -eq 0) { 'ok' } else { 'fail' }
    $summary = @{
        status = $status
        tests  = @{passed = $PASS; failed = $FAIL; skipped = $SKIPPED; total = $TotalTests}
    }
    Write-Host "`n$("-" * 40)" -ForegroundColor DarkGray
    Write-Host "RESULTS: $PASS passed, $FAIL failed, $SKIPPED skipped (total $TotalTests)" -ForegroundColor Cyan
    Write-Host "Status: $status" -ForegroundColor $(if ($FAIL -eq 0) { 'Green' } else { 'Red' })
    $summary | ConvertTo-Json -Depth 5

    if ($FAIL -gt 0) { exit 1 }
} finally {
    Pop-Location
}
