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
    param([int]$Total = 1000, [int]$InputTokens = 400, [int]$Output = 300, [int]$Reasoning = 200, [int]$CacheRead = 50, [int]$CacheWrite = 50, [ValidateSet('tool-calls','stop')][string]$Reason = 'stop')
    $cacheObj = @{ read = $CacheRead; write = $CacheWrite }
    $tokensObj = @{ total = $Total; input = $InputTokens; output = $Output; reasoning = $Reasoning; cache = $cacheObj }
    $start = @{ type = 'step_start'; sessionID = 'session-test'; part = @{ type = 'step-start' } }
    $finish = @{ type = 'step_finish'; sessionID = 'session-test'; part = @{ type = 'step-finish'; reason = $Reason; tokens = $tokensObj; cost = 0 } }
    return (($start | ConvertTo-Json -Depth 10 -Compress), ($finish | ConvertTo-Json -Depth 10 -Compress)) -join "`n"
}

# ── Valid code contract helper ──
function New-ValidCodeContract {
    param(
        [string]$Objective = 'test',
        [string[]]$AllowedPath = @('scripts/**'),
        [string[]]$ValidationCommand = @('cmd /c exit 0'),
        [int]$MaxRetries = 3,
        [int]$MaxObservedTokens = 50000,
        [string[]]$FallbackModels = @('nan/mimo-v2.5','nan/deepseek-v4-flash'),
        [switch]$AllowNoChanges,
        [switch]$TestMode,
        [switch]$DryRun,
        [string]$MockPlan = '',
        [hashtable]$ExtraParams = @{}
    )
    $ht = @{
        TaskType = 'code'
        Objective = $Objective
        AllowedPath = $AllowedPath
        ValidationCommand = $ValidationCommand
        MaxRetries = $MaxRetries
        MaxObservedTokens = $MaxObservedTokens
        FallbackModels = $FallbackModels
        PlannedBy = 'frontier'
        FrontierPlan = 'Implement the required changes'
        AcceptanceCriteria = @('1. All tests pass','2. No regression')
    }
    if ($AllowNoChanges) { $ht.AllowNoChanges = $true }
    if ($DryRun) { $ht.DryRun = $true }
    if ($TestMode) { $ht.TestMode = $true }
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

        $r = Invoke-WorkerDirect -WorkerParameters @{TaskType = 'bulletin'; Objective = 'bulletin-dryrun'; InputPath = @('AGENTS.md'); DryRun = $true}
        Assert-True ($r.ExitCode -eq 0) '2d: bulletin DryRun exit 0'
        Assert-Contains $r.Output 'gemma4' '2e: bulletin DryRun shows gemma4'
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

    # 12. Bulletin gemma4 only
    if (-not $Only -or $Only -eq 'bulletin') {
        Write-Host "`n*** 12. Bulletin gemma4 only ***" -ForegroundColor Cyan
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
            @{exitCode = 0; changedPaths = @('scripts/ok2.txt'); validationExitCode = 1; jsonl = $jsonlOk}
        ) | ConvertTo-Json -Compress
        $r2 = Invoke-WorkerChild -WorkerParameters (New-ValidCodeContract -Objective 've-fail' -ValidationCommand @('cmd /c exit 1') -MaxRetries 1 -TestMode -MockPlan $plan2)
        Assert-True ($r2.ExitCode -ne 0) '17e: mock validationExitCode=1 causes failure (exit non-zero)'

        $telFile2 = Get-NewTelemetry -BeforeFiles $pre2
        if ($telFile2) {
            $tel2 = Get-Content -LiteralPath $telFile2 -Raw | ConvertFrom-Json
            Assert-True ($tel2.validationFailed -eq $true) '17f: validationFailed=true when mock validationExitCode=1'
            Assert-True ($tel2.status -eq 'blocked-needs-new-contract') '17g: status=blocked when validation fails'
            Assert-True ($tel2.attempts[0].validationExitCode -eq 1) '17h: attempt validationExitCode=1 captured'
            Assert-True ($tel2.attempts[0].exitCode -eq 1) '17i: attempt exitCode=1 after validation failure'
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

    # ── Results ──
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
