[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$BatchJsonPath,
    [Parameter(Mandatory)][string]$StateDirectory,
    [string]$WorktreeParent = '',
    [ValidateRange(1,5)][int]$MaxConcurrency = 1,
    [switch]$TestMode
)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$contractAdapter = Join-Path $PSScriptRoot 'Invoke-NanWorkerContract.ps1'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# ── Helpers ──
function Get-Sha256Hex {
    param([byte[]]$Bytes)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return (($sha.ComputeHash($Bytes) | ForEach-Object { $_.ToString('x2') }) -join '') }
    finally { $sha.Dispose() }
}

function Write-NewJson {
    param([string]$Path, [object]$Value)
    $bytes = $utf8.GetBytes(($Value | ConvertTo-Json -Depth 12 -Compress))
    $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try { $stream.Write($bytes, 0, $bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
}

function Confirm-OutsideSource {
    param([string]$Path)
    $source = $repoRoot.TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
    $candidate = [System.IO.Path]::GetFullPath($Path).TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
    return -not $candidate.StartsWith($source, [System.StringComparison]::OrdinalIgnoreCase)
}

function Remove-BatchWorktree {
    param([string]$Path,[string]$Parent,[string]$BatchId)
    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path -PathType Container)) { return }
    $resolvedPath = [System.IO.Path]::GetFullPath($Path)
    $resolvedParent = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
    $expectedName = "castilla-nan-batch-$BatchId-story-"
    if (-not $resolvedPath.StartsWith($resolvedParent, [System.StringComparison]::OrdinalIgnoreCase) -or
        -not ([System.IO.Path]::GetFileName($resolvedPath)).StartsWith($expectedName, [System.StringComparison]::Ordinal)) {
        throw "Refusing to remove unexpected batch worktree: $resolvedPath"
    }
    & git -C $repoRoot worktree remove --force $resolvedPath 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Unable to remove batch worktree: $resolvedPath" }
}

function Initialize-BatchWorktreeDependencies {
    param([string]$RepositoryRoot, [string]$WorktreeRoot)
    $source = Join-Path $RepositoryRoot 'node_modules'
    $target = Join-Path $WorktreeRoot 'node_modules'
    if (-not (Test-Path -LiteralPath $source -PathType Container) -or (Test-Path -LiteralPath $target)) { return }
    $itemType = if ($env:OS -eq 'Windows_NT') { 'Junction' } else { 'SymbolicLink' }
    New-Item -ItemType $itemType -Path $target -Target $source -ErrorAction Stop | Out-Null
}

function Test-PathsDisjoint {
    param([string[]]$PathsA, [string[]]$PathsB)
    $normA = @($PathsA | ForEach-Object { $_.Replace('\','/').TrimEnd('/') })
    $normB = @($PathsB | ForEach-Object { $_.Replace('\','/').TrimEnd('/') })
    foreach ($a in $normA) {
        foreach ($b in $normB) {
            if ($a -eq $b) { return $false }
            if ($a.StartsWith($b + '/', [StringComparison]::OrdinalIgnoreCase)) { return $false }
            if ($b.StartsWith($a + '/', [StringComparison]::OrdinalIgnoreCase)) { return $false }
        }
    }
    return $true
}

# ── ConvertTo-NativeArgument (proven StringBuilder version) ──
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

# ── Load batch contract ──
if (-not (Test-Path -LiteralPath $BatchJsonPath -PathType Leaf)) {
    throw "Batch JSON file not found: $BatchJsonPath"
}
$batch = Get-Content -LiteralPath $BatchJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json

# ── Validate batch structure ──
if (-not ($batch.PSObject.Properties.Name -contains 'stories')) {
    throw "Batch contract is missing 'stories' array."
}
$stories = @($batch.stories)
if ($stories.Count -lt 1 -or $stories.Count -gt 20) {
    throw "Batch must contain 1-20 stories, got $($stories.Count)."
}

$StateDirectory = [System.IO.Path]::GetFullPath($StateDirectory)
if (-not (Confirm-OutsideSource -Path $StateDirectory)) {
    throw "StateDirectory must be outside the source repository."
}
if (Test-Path -LiteralPath $StateDirectory) {
    throw "StateDirectory must not already exist."
}
New-Item -ItemType Directory -Path $StateDirectory | Out-Null

if (-not [string]::IsNullOrWhiteSpace($WorktreeParent)) {
    $WorktreeParent = [System.IO.Path]::GetFullPath($WorktreeParent)
    if (-not (Confirm-OutsideSource -Path $WorktreeParent)) {
        throw "WorktreeParent must be outside the source repository."
    }
    if (-not (Test-Path -LiteralPath $WorktreeParent -PathType Container)) {
        throw "WorktreeParent must already exist."
    }
}

# ── Validate baseSha ──
$headSha = (& git -C $repoRoot rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $headSha -notmatch '^[a-f0-9]{40}$') { throw 'Repository HEAD is unavailable.' }
$requestedBaseSha = if ($batch.PSObject.Properties.Name -contains 'baseSha') { [string]$batch.baseSha } else { '' }
if ($requestedBaseSha -and $requestedBaseSha -notmatch '^[a-f0-9]{40}$') { throw 'baseSha must be a 40-character hex string.' }
if ($requestedBaseSha -and $requestedBaseSha -ne $headSha) { throw "baseSha does not match repository HEAD ($headSha)." }
$baseRef = $headSha

# ── Validate stories ──
$seenIds = @{}
$seenPaths = @()
$storyContracts = @()

foreach ($story in $stories) {
    $id = [string]$story.id
    if ([string]::IsNullOrWhiteSpace($id) -or $id -notmatch '^[a-z0-9][a-z0-9-]{0,63}$') {
        throw "Story id '$id' does not match ^[a-z0-9][a-z0-9-]{0,63}$"
    }
    if ($seenIds.ContainsKey($id)) {
        throw "Duplicate story id: $id"
    }
    $seenIds[$id] = $true

    foreach ($field in @('objective','allowedPaths','validationCommands','frontierPlan','acceptanceCriteria')) {
        if (-not ($story.PSObject.Properties.Name -contains $field)) {
            throw "Story '$id' is missing field: $field"
        }
    }
    if ([string]::IsNullOrWhiteSpace($story.objective)) { throw "Story '$id' objective must be non-empty." }
    if ([string]::IsNullOrWhiteSpace($story.frontierPlan)) { throw "Story '$id' frontierPlan must be non-empty." }
    if (@($story.allowedPaths).Count -eq 0) { throw "Story '$id' allowedPaths must contain at least one path." }
    if (@($story.validationCommands).Count -eq 0) { throw "Story '$id' validationCommands must contain at least one command." }
    if (@($story.acceptanceCriteria).Count -eq 0) { throw "Story '$id' acceptanceCriteria must contain at least one item." }

    # Reject glm5.2
    $modelProfile = if ($story.PSObject.Properties.Name -contains 'modelProfile') { [string]$story.modelProfile } else { 'mechanical' }
    if ($modelProfile -match '(?i)glm5\.2') { throw "Story '$id' model profile references unsupported glm5.2." }

    $storyContracts += @{
        id = $id
        modelProfile = $modelProfile
    }
}

# ── Validate schemaVersion ──
$schemaVersion = if ($batch.PSObject.Properties.Name -contains 'schemaVersion') { [int]$batch.schemaVersion } else { $null }
if ($schemaVersion -ne 1) { throw "schemaVersion must be 1, got '$schemaVersion'." }

# ── Validate modelProfile values ──
$validModelProfiles = @('mechanical','reasoning','long-context')
foreach ($story in $stories) {
    $mp = if ($story.PSObject.Properties.Name -contains 'modelProfile') { [string]$story.modelProfile } else { 'mechanical' }
    if ($mp -match '(?i)glm5\.2') { throw "Story '$($story.id)' model profile references unsupported glm5.2." }
    if ($validModelProfiles -notcontains $mp) {
        throw "Story '$($story.id)' modelProfile '$mp' is not valid. Allowed: $($validModelProfiles -join ', ')."
    }
}

# ── Validate budgetProfile values ──
$validBudgetProfiles = @('small','batch','research','extended')
foreach ($story in $stories) {
    $bp = if ($story.PSObject.Properties.Name -contains 'budgetProfile') { [string]$story.budgetProfile } else { 'small' }
    if ($validBudgetProfiles -notcontains $bp) {
        throw "Story '$($story.id)' budgetProfile '$bp' is not valid. Allowed: $($validBudgetProfiles -join ', ')."
    }
}

# ── Validate allowed paths (reject empty, absolute, traversal) ──
foreach ($story in $stories) {
    foreach ($ap in @($story.allowedPaths)) {
        if ([string]::IsNullOrWhiteSpace($ap)) { throw "Story '$($story.id)' contains an empty allowed path." }
        $apNorm = $ap.Replace('\','/')
        if ($apNorm -match '^[a-zA-Z]:/' -or $apNorm -match '^/') { throw "Story '$($story.id)' allowed path '$ap' is absolute. Use relative paths only." }
        if ($apNorm -match '(^|/)\.\.(/|$)') { throw "Story '$($story.id)' allowed path '$ap' contains directory traversal." }
        if ($apNorm -match '[*?\[\]]') { throw "Story '$($story.id)' allowed path '$ap' contains a wildcard; batch paths must be exact." }
    }
}

# ── Validate path disjointness ──
for ($i = 0; $i -lt $stories.Count; $i++) {
    $pathsA = @($stories[$i].allowedPaths)
    for ($j = $i + 1; $j -lt $stories.Count; $j++) {
        $pathsB = @($stories[$j].allowedPaths)
        if (-not (Test-PathsDisjoint -PathsA $pathsA -PathsB $pathsB)) {
            throw "Allowed paths for story '$($stories[$i].id)' and '$($stories[$j].id)' overlap."
        }
    }
}

# ── Write batch contract snapshot ──
$batchId = [guid]::NewGuid().ToString('N')
$contractSnapshot = [ordered]@{
    batchId = $batchId
    schemaVersion = 1
    storyCount = $stories.Count
    maxConcurrency = $MaxConcurrency
    baseSha = $baseRef
    stories = @($stories | ForEach-Object {
        [ordered]@{
            id = $_.id
            objective = $_.objective
            allowedPaths = @($_.allowedPaths)
            validationCommands = @($_.validationCommands)
            frontierPlan = $_.frontierPlan
            acceptanceCriteria = @($_.acceptanceCriteria)
            modelProfile = if ($_.PSObject.Properties.Name -contains 'modelProfile') { $_.modelProfile } else { 'mechanical' }
            budgetProfile = if ($_.PSObject.Properties.Name -contains 'budgetProfile') { $_.budgetProfile } else { 'small' }
            maxObservedTokens = if ($_.PSObject.Properties.Name -contains 'maxObservedTokens') { $_.maxObservedTokens } else { $null }
            maxExecutionSeconds = if ($_.PSObject.Properties.Name -contains 'maxExecutionSeconds') { $_.maxExecutionSeconds } else { 900 }
            maxStepsWithoutMutation = if ($_.PSObject.Properties.Name -contains 'maxStepsWithoutMutation') { $_.maxStepsWithoutMutation } else { 3 }
        }
    })
}
Write-NewJson -Path (Join-Path $StateDirectory 'batch-contract.json') -Value $contractSnapshot

$batchHash = Get-Sha256Hex -Bytes ($utf8.GetBytes(($contractSnapshot | ConvertTo-Json -Depth 12 -Compress)))

# ── Resolve baseRef for detached worktrees ──

# ── Store individual story contract files ──
$storyContractPaths = @()
$storyIndex = 0
foreach ($story in $stories) {
    $storyDir = Join-Path $StateDirectory "story-$($story.id)"
    New-Item -ItemType Directory -Path $storyDir -Force | Out-Null
    $storyContractPath = Join-Path $storyDir 'contract.json'

    $storyObj = $story
    if ($TestMode -and $batch.PSObject.Properties.Name -contains 'mockPlans') {
        $batchMockPlans = @($batch.mockPlans)
        if ($storyIndex -lt $batchMockPlans.Count -and $batchMockPlans[$storyIndex] -ne $null) {
            $storyObj = @{}
            foreach ($prop in $story.PSObject.Properties) {
                $storyObj[$prop.Name] = $prop.Value
            }
            $storyObj['mockPlan'] = $batchMockPlans[$storyIndex]
        }
    }
    Write-NewJson -Path $storyContractPath -Value ([pscustomobject]$storyObj)
    $storyContractPaths += $storyContractPath
    $storyIndex++
}

# ── Execute stories with bounded concurrency ──
$results = @()
$runQueue = @(, $true) * $stories.Count  # just to track remaining
$completed = @()
$failed = @()
$activeJobs = @()
$queueIndex = 0
$storyResults = @()

function Start-StoryJob {
    param([int]$Index, [string]$ContractPath, [string]$StateDir, [string]$Worktree, [bool]$TestModeOn)
    $argList = @(
        '-NoProfile','-ExecutionPolicy','Bypass','-File',$contractAdapter,
        '-ContractPath',$ContractPath,
        '-StateDirectory',$StateDir
    )
    if (-not [string]::IsNullOrWhiteSpace($Worktree)) {
        $argList += @('-WorktreeRoot',$Worktree)
    }
    if ($TestModeOn) {
        $argList += '-TestMode'
    }
    $start = New-Object System.Diagnostics.ProcessStartInfo
    $start.FileName = 'powershell.exe'
    $start.Arguments = (($argList | ForEach-Object { ConvertTo-NativeArgument -Value $_ }) -join ' ')
    $start.WorkingDirectory = $repoRoot
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $start
    if (-not $process.Start()) { throw "Failed to start story $Index" }
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    return @{
        index = $Index
        process = $process
        stdoutTask = $stdoutTask
        stderrTask = $stderrTask
    }
}

function Collect-Job {
    param($Job)
    $Job.process.WaitForExit()
    $exitCode = $Job.process.ExitCode
    $stdout = $Job.stdoutTask.GetAwaiter().GetResult()
    $stderr = $Job.stderrTask.GetAwaiter().GetResult()
    $Job.process.Dispose()

    # Parse the last JSON line from stdout (the story result)
    $resultObj = $null
    $lines = @($stdout -split "`r?`n" | Where-Object { $_.Trim() })
    foreach ($line in $lines) {
        try {
            $parsed = $line | ConvertFrom-Json
            if ($parsed.storyId) { $resultObj = $parsed }
        } catch {}
    }

    return @{
        index = $Job.index
        exitCode = $exitCode
        result = $resultObj
        stdout = $stdout
        stderr = $stderr
    }
}

$jobSemaphore = New-Object System.Threading.Semaphore($MaxConcurrency, $MaxConcurrency)

try {
    # In live mode WorktreeParent is required
    if (-not $TestMode -and [string]::IsNullOrWhiteSpace($WorktreeParent)) {
        throw 'Live execution requires WorktreeParent to be set.'
    }

    while ($queueIndex -lt $stories.Count -or $activeJobs.Count -gt 0) {
        # Launch new jobs when concurrency permits
        while ($activeJobs.Count -lt $MaxConcurrency -and $queueIndex -lt $stories.Count) {
            $jobSemaphore.WaitOne() | Out-Null
            $idx = $queueIndex
            $queueIndex++
            $jobWorktreePath = $null
            try {
                if (-not $TestMode) {
                    $jobWorktreePath = Join-Path $WorktreeParent "castilla-nan-batch-$batchId-story-$idx"
                    $previousErrorActionPreference = $ErrorActionPreference
                    try {
                        $ErrorActionPreference = 'Continue'
                        $gitOutput = @(& git -C $repoRoot worktree add --detach $jobWorktreePath $baseRef 2>&1)
                        $gitExitCode = $LASTEXITCODE
                    } finally {
                        $ErrorActionPreference = $previousErrorActionPreference
                    }
                    if ($gitExitCode -ne 0) {
                        throw "Failed to create detached worktree at $jobWorktreePath`: $($gitOutput -join ' ')"
                    }
                    Initialize-BatchWorktreeDependencies -RepositoryRoot $repoRoot -WorktreeRoot $jobWorktreePath
                }
                $job = Start-StoryJob -Index $idx -ContractPath $storyContractPaths[$idx] `
                    -StateDir $StateDirectory -Worktree $jobWorktreePath -TestModeOn $TestMode
                $job | Add-Member -NotePropertyName '__worktreePath' -NotePropertyValue $jobWorktreePath -Force
                $activeJobs += $job
            } catch {
                $jobSemaphore.Release() | Out-Null
                if (-not $TestMode) { Remove-BatchWorktree -Path $jobWorktreePath -Parent $WorktreeParent -BatchId $batchId }
                throw
            }
        }

        # Poll for completions
        $completedJobs = @()
        foreach ($job in $activeJobs) {
            if ($job.process.HasExited) {
                $completedJobs += $job
            }
        }

        foreach ($job in $completedJobs) {
            $collect = Collect-Job -Job $job
            $storyResults += $collect
            $jobSemaphore.Release() | Out-Null
            $activeJobs = @($activeJobs | Where-Object { $_ -ne $job })

            # Clean up the exact worktree path recorded on the job
            $wtPath = if ($job.PSObject.Properties.Name -contains '__worktreePath') {
                $job.__worktreePath
            } else { $null }
            if (-not $TestMode) { Remove-BatchWorktree -Path $wtPath -Parent $WorktreeParent -BatchId $batchId }
        }

        if ($completedJobs.Count -eq 0 -and $activeJobs.Count -gt 0) {
            Start-Sleep -Milliseconds 200
        }
    }
} finally {
    foreach ($job in $activeJobs) {
        if (-not $job.process.HasExited) {
            & taskkill.exe /PID $job.process.Id /T /F 2>$null | Out-Null
            $job.process.WaitForExit(5000) | Out-Null
        }
        $job.process.Dispose()
        # Cleanup worktree for killed jobs using stored exact path
        $wtPath = if ($job.PSObject.Properties.Name -contains '__worktreePath') {
            $job.__worktreePath
        } else { $null }
        if (-not $TestMode) { Remove-BatchWorktree -Path $wtPath -Parent $WorktreeParent -BatchId $batchId }
    }
    $jobSemaphore.Dispose()
}

# ── Aggregate results ──
$aggregate = @()
$allProviderTokens = [long]0
$allClientTokens = @{input=0L;output=0L;reasoning=0L;cacheRead=0L;cacheWrite=0L;total=0L}
$awaitingReview = 0
foreach ($collected in $storyResults) {
    $r = $collected.result
    $storyEntry = [ordered]@{
        storyId = if ($r) { $r.storyId } else { "index-$($collected.index)" }
        exitCode = $collected.exitCode
        workerStatus = if ($r) { $r.status } else { 'worker-failed' }
        candidateReady = if ($r) { [bool]$r.candidateReady } else { $false }
        patchAvailable = if ($r) { [bool]$r.patchAvailable } else { $false }
        contractViolation = if ($r) { [bool]$r.contractViolation } else { $false }
        validationFailed = if ($r) { [bool]$r.validationFailed } else { $false }
        changedPaths = if ($r) { @($r.changedPaths) } else { @() }
        providerTokens = if ($r) { [long]$r.providerEvidence.providerReportedTokens } else { 0 }
        providerVerified = if ($r) { [bool]$r.providerEvidence.verified } else { $false }
        responseIdSetHash = if ($r) { $r.providerEvidence.responseIdSetHash } else { $null }
        selectedModel = if ($r -and @($r.attempts).Count -gt 0) { $r.attempts[0].model } else { $null }
        patchPath = if ($r) { $r.patchPath } else { $null }
        patchSha256 = if ($r) { $r.patchSha256 } else { $null }
        telemetryPath = if ($r) { $r.telemetryPath } else { $null }
        telemetrySha256 = if ($r) { $r.telemetrySha256 } else { $null }
        clientTokens = if ($r) { $r.tokensUsage } else { @{input=0;output=0;reasoning=0;cacheRead=0;cacheWrite=0;total=0} }
    }
    $aggregate += $storyEntry
    $allProviderTokens += [long]$storyEntry.providerTokens
    if ($r -and $r.tokensUsage) {
        $allClientTokens.input += [long]$r.tokensUsage.input
        $allClientTokens.output += [long]$r.tokensUsage.output
        $allClientTokens.reasoning += [long]$r.tokensUsage.reasoning
        $allClientTokens.cacheRead += [long]$r.tokensUsage.cacheRead
        $allClientTokens.cacheWrite += [long]$r.tokensUsage.cacheWrite
        $allClientTokens.total += [long]$r.tokensUsage.total
    }
    if ($storyEntry.candidateReady -and $storyEntry.patchAvailable -and $storyEntry.providerVerified) {
        $awaitingReview++
    }
}

$finalStatus = if ($awaitingReview -eq $stories.Count) {
    'awaiting-frontier-review'
} elseif ($awaitingReview -gt 0) {
    'partial-awaiting-frontier-review'
} else {
    'blocked'
}

$batchResult = [ordered]@{
    schemaVersion = 1
    batchId = $batchId
    batchHash = $batchHash
    status = $finalStatus
    storiesRequested = $stories.Count
    storiesCompleted = @($storyResults).Count
    storiesReady = $awaitingReview
    maxConcurrency = $MaxConcurrency
    baseSha = $baseRef
    providerReportedTokens = $allProviderTokens
    clientObservedTokens = $allClientTokens
    stories = @($aggregate)
    stateDirectory = $StateDirectory
    telemetryRoot = $StateDirectory
}

$batchResultPath = Join-Path $StateDirectory 'batch-result.json'
Write-NewJson -Path $batchResultPath -Value $batchResult

Write-Output ($batchResult | ConvertTo-Json -Depth 12 -Compress)
if ($awaitingReview -eq $stories.Count) { exit 0 } else { exit 1 }
