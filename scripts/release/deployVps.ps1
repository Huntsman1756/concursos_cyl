[CmdletBinding()]
param(
  [string]$SshHost = "mcpspain-official-sources-vps",
  [string]$PublicUrl = "https://salidacyl.es",
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
$oldEnvironmentExclusions = $env:MSYS2_ENV_CONV_EXCL
try {
  $env:CADDY_SMOKE_BASE_URL = $PublicUrl
  # This is a URL path, not a filesystem path for MSYS to translate.
  $env:MSYS2_ENV_CONV_EXCL = (@($oldEnvironmentExclusions, "VITE_PUBLIC_BASE_PATH") | Where-Object { $_ }) -join ";"
  & $bashExecutable $deploymentScript $SshHost $ReleaseId
  if ($LASTEXITCODE -ne 0) {
    throw "VPS deployment failed with exit code $LASTEXITCODE. Review the observed remote state above."
  }
} finally {
  $env:CADDY_SMOKE_BASE_URL = $oldSmokeUrl
  $env:MSYS2_ENV_CONV_EXCL = $oldEnvironmentExclusions
}
