[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$batchPath = Join-Path $repoRoot 'scripts\Invoke-NanWorkerBatch.ps1'
$contractAdapter = Join-Path $repoRoot 'scripts\Invoke-NanWorkerContract.ps1'
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("castilla-batch-test-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null

$passed = 0
$failed = 0
$testResults = @()

function Write-TestResult {
    param([string]$Name, [bool]$Success, [string]$Detail)
    if ($Success) { $script:passed++; Write-Host "PASS: $Name" -ForegroundColor Green }
    else { $script:failed++; Write-Host "FAIL: $Name - $Detail" -ForegroundColor Red }
    $script:testResults += [pscustomobject]@{name=$Name;passed=$Success;detail=$Detail}
}

function Invoke-ExpectedFailure {
    param([scriptblock]$Action)
    try {
        $captured = & $Action 2>&1
        return @{exitCode=$LASTEXITCODE;output=@($captured)}
    } catch {
        return @{exitCode=1;output=@($_)}
    }
}

try {
    # ────────────────────────────────────────────────────────────────
    # Test 1: Valid batch with 3 disjoint stories — all succeed
    # ────────────────────────────────────────────────────────────────
    $session = 'batch-test-session'
    $validJsonl = @(
        (@{type='step_start';sessionID=$session;part=@{type='step-start'}} | ConvertTo-Json -Depth 5 -Compress),
        (@{type='step_finish';sessionID=$session;part=@{type='step-finish';reason='stop';tokens=@{input=10;output=5;reasoning=2;total=17;cache=@{read=1;write=0}}}} | ConvertTo-Json -Depth 8 -Compress)
    ) -join "`n"

    $mockPlanSuccess = @(@{exitCode=0;changedPaths=@('scripts/result-a.txt');validationExitCode=0;jsonl=$validJsonl}) | ConvertTo-Json -Depth 8 -Compress
    $mockPlanSuccess2 = @(@{exitCode=0;changedPaths=@('scripts/result-b.txt');validationExitCode=0;jsonl=$validJsonl}) | ConvertTo-Json -Depth 8 -Compress
    $mockPlanSuccess3 = @(@{exitCode=0;changedPaths=@('scripts/result-c.txt');validationExitCode=0;jsonl=$validJsonl}) | ConvertTo-Json -Depth 8 -Compress

    $successBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'story-alpha'
                objective = 'Create result-a.txt'
                allowedPaths = @('scripts/result-a.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Write alpha fixture'
                acceptanceCriteria = @('Alpha file exists')
                modelProfile = 'mechanical'
                budgetProfile = 'small'
                mockPlan = $mockPlanSuccess
            }
            @{
                id = 'story-beta'
                objective = 'Create result-b.txt'
                allowedPaths = @('scripts/result-b.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Write beta fixture'
                acceptanceCriteria = @('Beta file exists')
                modelProfile = 'mechanical'
                budgetProfile = 'small'
                mockPlan = $mockPlanSuccess2
            }
            @{
                id = 'story-gamma'
                objective = 'Create result-c.txt'
                allowedPaths = @('scripts/result-c.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Write gamma fixture'
                acceptanceCriteria = @('Gamma file exists')
                modelProfile = 'mechanical'
                budgetProfile = 'small'
                mockPlan = $mockPlanSuccess3
            }
        )
        mockPlans = @($mockPlanSuccess, $mockPlanSuccess2, $mockPlanSuccess3)
    }

    $successBatchPath = Join-Path $temporaryRoot 'success-batch.json'
    $successState = Join-Path $temporaryRoot 'success-state'
    $successBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $successBatchPath -Encoding utf8

    $output = & $batchPath -BatchJsonPath $successBatchPath -StateDirectory $successState -MaxConcurrency 3 -TestMode
    $exitCode = $LASTEXITCODE

    $result = $output | ConvertFrom-Json
    $testName = 'Valid batch: exit 0 with all stories ready'
    Write-TestResult -Name $testName -Success ($exitCode -eq 0) -Detail "exitCode=$exitCode"

    $testName = 'Valid batch: status awaits Frontier review'
    Write-TestResult -Name $testName -Success ($result.status -eq 'awaiting-frontier-review') -Detail "status=$($result.status)"

    $testName = 'Valid batch: 3 stories ready'
    Write-TestResult -Name $testName -Success ($result.storiesReady -eq 3) -Detail "ready=$($result.storiesReady)"

    $testName = 'Valid batch: batch-result.json exists'
    $brPath = Join-Path $successState 'batch-result.json'
    Write-TestResult -Name $testName -Success (Test-Path -LiteralPath $brPath) -Detail ""

    $testName = 'Valid batch: batch-contract.json exists'
    $bcPath = Join-Path $successState 'batch-contract.json'
    Write-TestResult -Name $testName -Success (Test-Path -LiteralPath $bcPath) -Detail ""

    $testName = 'Valid batch: per-story directories exist'
    $alphaDir = Join-Path $successState 'story-story-alpha'
    $betaDir = Join-Path $successState 'story-story-beta'
    $gammaDir = Join-Path $successState 'story-story-gamma'
    Write-TestResult -Name $testName -Success (
        (Test-Path -LiteralPath $alphaDir) -and
        (Test-Path -LiteralPath $betaDir) -and
        (Test-Path -LiteralPath $gammaDir)
    ) -Detail ""

    $testName = 'Valid batch: per-story telemetry exists'
    Write-TestResult -Name $testName -Success (
        (Test-Path -LiteralPath (Join-Path $alphaDir 'worker-telemetry.json')) -and
        (Test-Path -LiteralPath (Join-Path $betaDir 'worker-telemetry.json')) -and
        (Test-Path -LiteralPath (Join-Path $gammaDir 'worker-telemetry.json'))
    ) -Detail ""

    $testName = 'Valid batch: TestMode does not claim provider tokens'
    Write-TestResult -Name $testName -Success ($result.providerReportedTokens -eq 0) -Detail "tokens=$($result.providerReportedTokens)"

    $testName = 'Valid batch: three story entries in batch result'
    Write-TestResult -Name $testName -Success (@($result.stories).Count -eq 3) -Detail "count=$(@($result.stories).Count)"

    $testName = 'Valid batch: exact HEAD is bound into result'
    $expectedHead = (& git -C $repoRoot rev-parse HEAD).Trim()
    Write-TestResult -Name $testName -Success ($result.baseSha -eq $expectedHead) -Detail "baseSha=$($result.baseSha)"

    $testName = 'Valid batch: review packet exposes evidence artifact fields'
    $firstStory = @($result.stories)[0]
    Write-TestResult -Name $testName -Success (
        -not [string]::IsNullOrWhiteSpace([string]$firstStory.patchPath) -and
        -not [string]::IsNullOrWhiteSpace([string]$firstStory.patchSha256) -and
        -not [string]::IsNullOrWhiteSpace([string]$firstStory.telemetryPath) -and
        -not [string]::IsNullOrWhiteSpace([string]$firstStory.telemetrySha256)
    ) -Detail "story=$($firstStory.storyId)"

    # ────────────────────────────────────────────────────────────────
    # Test 2: Reject overlapping paths
    # ────────────────────────────────────────────────────────────────
    $overlapBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'story-one'
                objective = 'Work on scripts/'
                allowedPaths = @('scripts/overlap-a.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Write overlap-a'
                acceptanceCriteria = @('Done')
                modelProfile = 'mechanical'
            }
            @{
                id = 'story-two'
                objective = 'Work on scripts/ subpath'
                allowedPaths = @('scripts/overlap-a.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Write overlap-a again'
                acceptanceCriteria = @('Done')
                modelProfile = 'mechanical'
            }
        )
    }
    $overlapBatchPath = Join-Path $temporaryRoot 'overlap-batch.json'
    $overlapState = Join-Path $temporaryRoot 'overlap-state'
    $overlapBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $overlapBatchPath -Encoding utf8

    $overlapRun = Invoke-ExpectedFailure { & $batchPath -BatchJsonPath $overlapBatchPath -StateDirectory $overlapState -TestMode }
    $overlapOutput = $overlapRun.output
    $overlapExit = $overlapRun.exitCode

    $testName = 'Overlap rejection: exit non-zero'
    Write-TestResult -Name $testName -Success ($overlapExit -ne 0) -Detail "exitCode=$overlapExit"

    # ────────────────────────────────────────────────────────────────
    # Test 3: Reject invalid story id format
    # ────────────────────────────────────────────────────────────────
    $invalidIdBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'UPPERCASE-INVALID'
                objective = 'Test'
                allowedPaths = @('scripts/x.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Test'
                acceptanceCriteria = @('Done')
            }
        )
    }
    $invalidIdPath = Join-Path $temporaryRoot 'invalid-id-batch.json'
    $invalidIdState = Join-Path $temporaryRoot 'invalid-id-state'
    $invalidIdBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $invalidIdPath -Encoding utf8

    $invalidRun = Invoke-ExpectedFailure { & $batchPath -BatchJsonPath $invalidIdPath -StateDirectory $invalidIdState -TestMode }
    $invalidOutput = $invalidRun.output
    $invalidExit = $invalidRun.exitCode

    $testName = 'Invalid id rejection: exit non-zero'
    Write-TestResult -Name $testName -Success ($invalidExit -ne 0) -Detail "exitCode=$invalidExit"

    # ────────────────────────────────────────────────────────────────
    # Test 4: Reject glm5.2 model profile
    # ────────────────────────────────────────────────────────────────
    $glmBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'story-glm'
                objective = 'Test'
                allowedPaths = @('scripts/y.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Test'
                acceptanceCriteria = @('Done')
                modelProfile = 'glm5.2'
            }
        )
    }
    $glmBatchPath = Join-Path $temporaryRoot 'glm-batch.json'
    $glmState = Join-Path $temporaryRoot 'glm-state'
    $glmBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $glmBatchPath -Encoding utf8

    $glmRun = Invoke-ExpectedFailure { & $batchPath -BatchJsonPath $glmBatchPath -StateDirectory $glmState -TestMode }
    $glmOutput = $glmRun.output
    $glmExit = $glmRun.exitCode

    $testName = 'glm5.2 rejection: exit non-zero'
    Write-TestResult -Name $testName -Success ($glmExit -ne 0) -Detail "exitCode=$glmExit"

    # ────────────────────────────────────────────────────────────────
    # Test 5: Reject missing story contract field
    # ────────────────────────────────────────────────────────────────
    $missingFieldBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'story-missing'
                objective = 'Test'
                allowedPaths = @('scripts/z.txt')
                validationCommands = @('cmd /c exit 0')
                # frontierPlan intentionally missing
                acceptanceCriteria = @('Done')
            }
        )
    }
    $missingFieldPath = Join-Path $temporaryRoot 'missing-field-batch.json'
    $missingFieldState = Join-Path $temporaryRoot 'missing-field-state'
    $missingFieldBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $missingFieldPath -Encoding utf8

    $missingRun = Invoke-ExpectedFailure { & $batchPath -BatchJsonPath $missingFieldPath -StateDirectory $missingFieldState -TestMode }
    $missingOutput = $missingRun.output
    $missingExit = $missingRun.exitCode

    $testName = 'Missing field rejection: exit non-zero'
    Write-TestResult -Name $testName -Success ($missingExit -ne 0) -Detail "exitCode=$missingExit"

    # ────────────────────────────────────────────────────────────────
    # Test 6: Reject duplicate story IDs
    # ────────────────────────────────────────────────────────────────
    $duplicateIdBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'story-dup'
                objective = 'First'
                allowedPaths = @('scripts/dup1.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'First'
                acceptanceCriteria = @('Done')
            }
            @{
                id = 'story-dup'
                objective = 'Second'
                allowedPaths = @('scripts/dup2.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Second'
                acceptanceCriteria = @('Done')
            }
        )
    }
    $duplicateIdPath = Join-Path $temporaryRoot 'duplicate-id-batch.json'
    $duplicateIdState = Join-Path $temporaryRoot 'duplicate-id-state'
    $duplicateIdBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $duplicateIdPath -Encoding utf8

    $duplicateRun = Invoke-ExpectedFailure { & $batchPath -BatchJsonPath $duplicateIdPath -StateDirectory $duplicateIdState -TestMode }
    $dupOutput = $duplicateRun.output
    $dupExit = $duplicateRun.exitCode

    $testName = 'Duplicate id rejection: exit non-zero'
    Write-TestResult -Name $testName -Success ($dupExit -ne 0) -Detail "exitCode=$dupExit"

    # ────────────────────────────────────────────────────────────────
    # Test 7: Concurrency cap at 5 (start 7 stories)
    # ────────────────────────────────────────────────────────────────
    $sevenStories = 0..6 | ForEach-Object {
        $letter = [char]([int][char]'a' + $_)
        $mockPlan = @(@{exitCode=0;changedPaths=@("scripts/conc-$letter.txt");validationExitCode=0;jsonl=$validJsonl}) | ConvertTo-Json -Depth 8 -Compress
        @{
            id = "story-conc-$letter"
            objective = "Concurrency $letter"
            allowedPaths = @("scripts/conc-$letter.txt")
            validationCommands = @('cmd /c exit 0')
            frontierPlan = "Concurrency $letter"
            acceptanceCriteria = @("Done $letter")
            modelProfile = 'mechanical'
            mockPlan = $mockPlan
        }
    }
    $concurrencyBatch = @{
        schemaVersion = 1
        stories = $sevenStories
        mockPlans = $sevenStories | ForEach-Object {
            @(@{exitCode=0;changedPaths=$_.allowedPaths;validationExitCode=0;jsonl=$validJsonl}) | ConvertTo-Json -Depth 8 -Compress
        }
    }
    $concurrencyBatchPath = Join-Path $temporaryRoot 'concurrency-batch.json'
    $concurrencyState = Join-Path $temporaryRoot 'concurrency-state'
    $concurrencyBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $concurrencyBatchPath -Encoding utf8

    $concOutput = & $batchPath -BatchJsonPath $concurrencyBatchPath -StateDirectory $concurrencyState -MaxConcurrency 5 -TestMode
    $concExit = $LASTEXITCODE
    $concResult = $concOutput | ConvertFrom-Json

    $testName = 'Concurrency: 7 stories all complete'
    Write-TestResult -Name $testName -Success ($concExit -eq 0 -and $concResult.storiesReady -eq 7) -Detail "exit=$concExit ready=$($concResult.storiesReady)"

    $testName = 'Concurrency: maxConcurrency reported as 5'
    Write-TestResult -Name $testName -Success ($concResult.maxConcurrency -eq 5) -Detail "max=$($concResult.maxConcurrency)"

    # ────────────────────────────────────────────────────────────────
    # Test 8: Partial success (one story fails)
    # ────────────────────────────────────────────────────────────────
    $partialJsonl2 = @(
        (@{type='step_start';sessionID=$session;part=@{type='step-start'}} | ConvertTo-Json -Depth 5 -Compress),
        (@{type='step_finish';sessionID=$session;part=@{type='step-finish';reason='stop';tokens=@{input=5;output=2;reasoning=1;total=8;cache=@{read=0;write=0}}}} | ConvertTo-Json -Depth 8 -Compress)
    ) -join "`n"

    $mockPlanPartialGood = @(@{exitCode=0;changedPaths=@('scripts/partial-ok.txt');validationExitCode=0;jsonl=$validJsonl}) | ConvertTo-Json -Depth 8 -Compress
    $mockPlanPartialFail = @(@{exitCode=1;changedPaths=@();validationExitCode=1;jsonl=''}) | ConvertTo-Json -Compress

    $partialBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'story-partial-good'
                objective = 'Good partial'
                allowedPaths = @('scripts/partial-ok.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Good'
                acceptanceCriteria = @('Good')
                modelProfile = 'mechanical'
                mockPlan = $mockPlanPartialGood
            }
            @{
                id = 'story-partial-bad'
                objective = 'Fail partial'
                allowedPaths = @('scripts/partial-fail.txt')
                validationCommands = @('cmd /c exit 1')
                frontierPlan = 'Fail'
                acceptanceCriteria = @('Fail')
                modelProfile = 'mechanical'
                mockPlan = $mockPlanPartialFail
            }
        )
    }
    $partialBatchPath = Join-Path $temporaryRoot 'partial-batch.json'
    $partialState = Join-Path $temporaryRoot 'partial-state'
    $partialBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $partialBatchPath -Encoding utf8

    $partialOutput = & $batchPath -BatchJsonPath $partialBatchPath -StateDirectory $partialState -MaxConcurrency 2 -TestMode 2>&1
    $partialExit = $LASTEXITCODE
    $partialResult = $partialOutput | ConvertFrom-Json

    $testName = 'Partial success: exit non-zero'
    Write-TestResult -Name $testName -Success ($partialExit -ne 0) -Detail "exit=$partialExit"

    $testName = 'Partial success: status still requires Frontier review'
    Write-TestResult -Name $testName -Success ($partialResult.status -eq 'partial-awaiting-frontier-review') -Detail "status=$($partialResult.status)"

    $testName = 'Partial success: 1 story ready out of 2'
    Write-TestResult -Name $testName -Success ($partialResult.storiesReady -eq 1 -and $partialResult.storiesCompleted -eq 2) -Detail "ready=$($partialResult.storiesReady) completed=$($partialResult.storiesCompleted)"

    # ────────────────────────────────────────────────────────────────
    # Test 9: Contract adapter validates empty fields
    # ────────────────────────────────────────────────────────────────
    $emptyObjectiveBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'story-empty'
                objective = ''
                allowedPaths = @('scripts/e.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Test'
                acceptanceCriteria = @('Done')
            }
        )
    }
    $emptyObjectivePath = Join-Path $temporaryRoot 'empty-objective-batch.json'
    $emptyObjectiveState = Join-Path $temporaryRoot 'empty-objective-state'
    $emptyObjectiveBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $emptyObjectivePath -Encoding utf8

    $emptyRun = Invoke-ExpectedFailure { & $batchPath -BatchJsonPath $emptyObjectivePath -StateDirectory $emptyObjectiveState -TestMode }
    $emptyOutput = $emptyRun.output
    $emptyExit = $emptyRun.exitCode

    $testName = 'Empty objective rejection: exit non-zero'
    Write-TestResult -Name $testName -Success ($emptyExit -ne 0) -Detail "exitCode=$emptyExit"

    # ────────────────────────────────────────────────────────────────
    # Test 10: Single contract.json write per story (mockPlan embedded)
    # ────────────────────────────────────────────────────────────────
    $session10 = 'single-write-test'
    $mockSingleWrite = @(@{exitCode=0;changedPaths=@('scripts/single.txt');validationExitCode=0;jsonl=($validJsonl -join "`n")} ) | ConvertTo-Json -Depth 8 -Compress
    $singleBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'story-single'
                objective = 'Single write test'
                allowedPaths = @('scripts/single.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Single'
                acceptanceCriteria = @('Single')
                modelProfile = 'mechanical'
                mockPlan = $mockSingleWrite
            }
        )
        mockPlans = @($mockSingleWrite)
    }
    $singleBatchPath = Join-Path $temporaryRoot 'single-write-batch.json'
    $singleState = Join-Path $temporaryRoot 'single-write-state'
    $singleBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $singleBatchPath -Encoding utf8

    $singleOutput = & $batchPath -BatchJsonPath $singleBatchPath -StateDirectory $singleState -TestMode 2>&1
    $singleExit = $LASTEXITCODE

    $testName = 'Single contract write: exit 0'
    Write-TestResult -Name $testName -Success ($singleExit -eq 0) -Detail "exit=$singleExit"

    $testName = 'Single contract write: story dir exists'
    $singleDir = Join-Path $singleState 'story-story-single'
    Write-TestResult -Name $testName -Success (Test-Path -LiteralPath $singleDir) -Detail ""

    $testName = 'Single contract write: contract.json exists'
    $contractJsonPath = Join-Path $singleDir 'contract.json'
    Write-TestResult -Name $testName -Success (Test-Path -LiteralPath $contractJsonPath) -Detail ""

    $testName = 'Single contract write: mockPlan embedded in contract'
    if (Test-Path -LiteralPath $contractJsonPath) {
        $contractContent = Get-Content -LiteralPath $contractJsonPath -Raw
        $hasMockPlan = ($contractContent | ConvertFrom-Json).PSObject.Properties.Name -contains 'mockPlan'
        Write-TestResult -Name $testName -Success $hasMockPlan -Detail "hasMockPlan=$hasMockPlan"
    } else {
        Write-TestResult -Name $testName -Success $false -Detail "contract.json not found"
    }

    # ────────────────────────────────────────────────────────────────
    # Test 11: Live mode fails without WorktreeParent
    # ────────────────────────────────────────────────────────────────
    $liveState = Join-Path $temporaryRoot 'live-state'
    $liveBatch = @{
        schemaVersion = 1
        stories = @(
            @{
                id = 'story-live'
                objective = 'Live test'
                allowedPaths = @('scripts/live.txt')
                validationCommands = @('cmd /c exit 0')
                frontierPlan = 'Live'
                acceptanceCriteria = @('Live')
            }
        )
    }
    $liveBatchPath = Join-Path $temporaryRoot 'live-batch.json'
    $liveBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $liveBatchPath -Encoding utf8

    $liveRun = Invoke-ExpectedFailure { & $batchPath -BatchJsonPath $liveBatchPath -StateDirectory $liveState }
    $liveOutput = $liveRun.output
    $liveExit = $liveRun.exitCode

    $testName = 'Live mode: fails without WorktreeParent'
    Write-TestResult -Name $testName -Success ($liveExit -ne 0) -Detail "exit=$liveExit"

    $invalidCases = @(
        @{name='Wildcard rejection'; field='allowedPaths'; value=@('scripts/*.txt')},
        @{name='Unknown model profile rejection'; field='modelProfile'; value='unknown-model'},
        @{name='Unknown budget profile rejection'; field='budgetProfile'; value='unbounded'}
    )
    $invalidCaseIndex = 0
    foreach ($invalidCase in $invalidCases) {
        $invalidCaseIndex++
        $caseStory = @{
            id = "invalid-case-$invalidCaseIndex"
            objective = 'Reject invalid bounded contract'
            allowedPaths = @("scripts/invalid-case-$invalidCaseIndex.txt")
            validationCommands = @('cmd /c exit 0')
            frontierPlan = 'Validate fail-closed behavior'
            acceptanceCriteria = @('Worker does not start')
            modelProfile = 'mechanical'
            budgetProfile = 'small'
        }
        $caseStory[$invalidCase.field] = $invalidCase.value
        $caseBatch = @{schemaVersion=1;stories=@($caseStory)}
        $caseBatchPath = Join-Path $temporaryRoot "invalid-case-$invalidCaseIndex.json"
        $caseState = Join-Path $temporaryRoot "invalid-case-$invalidCaseIndex-state"
        $caseBatch | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $caseBatchPath -Encoding utf8
        $caseRun = Invoke-ExpectedFailure { & $batchPath -BatchJsonPath $caseBatchPath -StateDirectory $caseState -TestMode }
        Write-TestResult -Name $invalidCase.name -Success ($caseRun.exitCode -ne 0) -Detail "exit=$($caseRun.exitCode)"
    }

    # ────────────────────────────────────────────────────────────────
    # Test 12: Static assertions — no live worktrees created
    # ────────────────────────────────────────────────────────────────
    $batchSrc = Get-Content -LiteralPath $batchPath -Raw
    $adapterSrc = Get-Content -LiteralPath $contractAdapter -Raw

    # 1. live WorktreeParent requirement
    $testName = 'Static: live batch requires WorktreeParent'
    Write-TestResult -Name $testName -Success ($batchSrc -match 'Live execution requires WorktreeParent') -Detail ""

    # 2. git worktree add --detach
    $testName = 'Static: batch creates worktrees with --detach'
    Write-TestResult -Name $testName -Success ($batchSrc -match 'worktree add --detach') -Detail ""

    # 3. recorded exact worktree path
    $testName = 'Static: batch records exact worktree path on the job'
    Write-TestResult -Name $testName -Success ($batchSrc -match '__worktreePath') -Detail ""

    # 4. git worktree remove
    $testName = 'Static: batch removes worktrees with worktree remove'
    Write-TestResult -Name $testName -Success ($batchSrc -match 'worktree remove') -Detail ""

    # 5. child worker path under WorktreeRoot
    $testName = 'Static: adapter computes child worker under WorktreeRoot'
    Write-TestResult -Name $testName -Success ($adapterSrc -match 'Join-Path \$resolvedWorktree.*Invoke-NanWorker') -Detail ""

    # 6. no live coordinator fallback
    $testName = 'Static: adapter rejects missing WorktreeRoot without fallback'
    Write-TestResult -Name $testName -Success ($adapterSrc -match 'no.*fallback.*worker.*allowed' -or $adapterSrc -match 'no.*fallback') -Detail ""

    # ────────────────────────────────────────────────────────────────
    # Summary
    # ────────────────────────────────────────────────────────────────
    Write-Host "`n============================================" -ForegroundColor Cyan
    Write-Host "Batch worker test results" -ForegroundColor Cyan
    Write-Host "Passed: $passed / Failed: $failed" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan

    if ($failed -gt 0) {
        Write-Host "`nFailed tests:" -ForegroundColor Red
        foreach ($tr in @($testResults | Where-Object { -not $_.passed })) {
            Write-Host "  - $($tr.name): $($tr.detail)" -ForegroundColor Red
        }
        exit 1
    } else {
        Write-Host "`nAll $passed tests passed." -ForegroundColor Green
        exit 0
    }
} finally {
    if (Test-Path -LiteralPath $temporaryRoot) {
        Remove-Item -LiteralPath $temporaryRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
