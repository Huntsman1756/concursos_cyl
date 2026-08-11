[CmdletBinding()]
param([switch]$Live)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
Push-Location $repoRoot
try {
    $version = (& opencode --version).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'OpenCode is not available.' }
    $models = @(& opencode models nan)
    foreach ($required in @('nan/qwen3.6', 'nan/gemma4')) {
        if ($models -notcontains $required) { throw "Missing required model: $required" }
    }
    $codeAgent = (& opencode debug agent nan-code | Out-String) | ConvertFrom-Json
    $bulletinAgent = (& opencode debug agent nan-bulletin | Out-String) | ConvertFrom-Json
    if ($codeAgent.model.providerID -ne 'nan' -or $codeAgent.model.modelID -ne 'qwen3.6') {
        throw 'nan-code does not resolve to nan/qwen3.6.'
    }
    if ($bulletinAgent.model.providerID -ne 'nan' -or $bulletinAgent.model.modelID -ne 'gemma4') {
        throw 'nan-bulletin does not resolve to nan/gemma4.'
    }
    foreach ($agent in @($codeAgent, $bulletinAgent)) {
        $mcpRule = @($agent.permission | Where-Object { $_.permission -eq 'esdata_*' -and $_.action -eq 'deny' })
        if ($mcpRule.Count -ne 1) { throw "Agent $($agent.name) does not deny the inherited esdata MCP tools." }
    }
    if ($Live) {
        $qwen = (& opencode run --pure --model nan/qwen3.6 --agent nan-code --format json --title orchestration-live-qwen -- 'Return exactly QWEN_ROUTE_OK. Do not use tools.' | Out-String)
        if ($LASTEXITCODE -ne 0 -or $qwen -notmatch 'QWEN_ROUTE_OK') { throw 'Qwen live route probe failed.' }
        $gemma = (& opencode run --pure --model nan/gemma4 --agent nan-bulletin --format json --title orchestration-live-gemma -- 'Return exactly GEMMA_ROUTE_OK. Do not use tools.' | Out-String)
        if ($LASTEXITCODE -ne 0 -or $gemma -notmatch 'GEMMA_ROUTE_OK') { throw 'Gemma live route probe failed.' }
    }
    [pscustomobject]@{
        status = 'ok'
        opencode = $version
        qwen = if ($Live) { 'live-ok' } else { 'configured' }
        gemma = if ($Live) { 'live-ok' } else { 'configured' }
        api_key = 'not-read'
    } | ConvertTo-Json
} finally {
    Pop-Location
}
