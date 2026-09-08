[CmdletBinding()]
param(
  [string]$SshHost = "mcpspain-official-sources-vps",
  [string]$PublicUrl = "https://salida-cyl.157-90-22-40.sslip.io",
  [string]$ReleaseId = ""
)

$ErrorActionPreference = "Stop"

# One activation implementation, including locking, staging and retention.
# Resolve Git for Windows explicitly; Windows/WSL bash is unsuitable here.
$gitExecutable = (Get-Command git -ErrorAction Stop).Source
$gitDirectory = Split-Path (Split-Path $gitExecutable -Parent) -Parent
$bashExecutable = Join-Path $gitDirectory "bin/bash.exe"
if (-not (Test-Path -LiteralPath $bashExecutable)) {
  throw "Git for Windows bash was not found. Run deployVps.sh in a supported POSIX environment."
}
$deploymentScript = (Join-Path $PSScriptRoot "deployVps.sh").Replace("\", "/")
$oldSmokeUrl = $env:CADDY_SMOKE_BASE_URL
try {
  $env:CADDY_SMOKE_BASE_URL = $PublicUrl
  & $bashExecutable $deploymentScript $SshHost $ReleaseId
  if ($LASTEXITCODE -ne 0) {
    throw "VPS deployment failed with exit code $LASTEXITCODE. Review the observed remote state above."
  }
} finally {
  $env:CADDY_SMOKE_BASE_URL = $oldSmokeUrl
}
