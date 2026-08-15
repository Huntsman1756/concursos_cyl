[CmdletBinding()]
param(
  [string]$SshHost = "mcpspain-official-sources-vps",
  [string]$PublicUrl = "https://salida-cyl.157-90-22-40.sslip.io",
  [string]$ReleaseId = ""
)

$ErrorActionPreference = "Stop"

# Calculate SHA once at the start
$commit = (git rev-parse HEAD).Trim().ToLower()
if ($commit -notmatch "^[0-9a-f]{40}$") { throw "Invalid commit SHA: $commit" }

if ($ReleaseId -eq "") {
  $timestamp = [DateTime]::UtcNow.ToString("yyyyMMddHHmmss")
  $ReleaseId = "$timestamp-$commit"
}

if ($ReleaseId -notmatch "^[a-zA-Z0-9._-]+$") {
  throw "ReleaseId contains unsupported characters."
}

$root = (git rev-parse --show-toplevel).Trim()
$dist = Join-Path $root "dist"
$archive = Join-Path ([System.IO.Path]::GetTempPath()) "salida-cyl-$ReleaseId.tar.gz"
$remoteArchive = "/tmp/salida-cyl-$ReleaseId.tar.gz"
$remoteRelease = "/srv/salida-cyl/releases/$ReleaseId"

# Capture existing env vars to restore later
$oldBase = $env:VITE_PUBLIC_BASE_PATH
$oldSmokeCommit = $env:CADDY_SMOKE_EXPECTED_COMMIT
$oldSmokeUrl = $env:CADDY_SMOKE_BASE_URL

try {
  Push-Location $root
  $gitStatus = git status --porcelain
  if ($LASTEXITCODE -ne 0) { throw "git status failed." }
  if ($gitStatus) { throw "Working directory is not clean. Commit or stash changes before deployment." }

  $env:VITE_PUBLIC_BASE_PATH = "/"
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci failed." }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

  if (-not (Test-Path $dist)) { throw "Build output directory '$dist' not found." }

  # Use relative script path and pass expected SHA
  $scriptFullPath = Join-Path $root 'scripts\release\writeVersionMetadata.ts'
  $tsxPath = Join-Path $root "node_modules\.bin\tsx.cmd"
  if (-not (Test-Path $tsxPath)) { throw "tsx.cmd not found at $tsxPath" }
  & $tsxPath "$scriptFullPath" "$dist" "$commit"
  if ($LASTEXITCODE -ne 0) { throw "Failed to write version metadata." }

  tar -czf $archive -C $dist .
  if ($LASTEXITCODE -ne 0) { throw "Could not create release archive." }

  scp $archive "${SshHost}:$remoteArchive"
  if ($LASTEXITCODE -ne 0) { throw "Could not upload release archive." }

  ssh $SshHost @"
set -eu
install -d -o caddy -g caddy -m 0755 '$remoteRelease'
tar -xzf '$remoteArchive' -C '$remoteRelease'
chown -R caddy:caddy '$remoteRelease'
test -f '$remoteRelease/index.html'
ln -sfn '$remoteRelease' /srv/salida-cyl/current.next
mv -Tf /srv/salida-cyl/current.next /srv/salida-cyl/current
rm -f '$remoteArchive'
find /srv/salida-cyl/releases -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm -rf --
systemctl reload caddy
"@
  if ($LASTEXITCODE -ne 0) { throw "Remote activation failed." }

  $env:CADDY_SMOKE_EXPECTED_COMMIT = $commit
  $env:CADDY_SMOKE_BASE_URL = $PublicUrl
  npm run release:caddy:verify
  if ($LASTEXITCODE -ne 0) { throw "Live deployment verification failed." }

  Write-Output "Published release $ReleaseId at $PublicUrl"
} finally {
  Pop-Location
  Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
  # Restore original env values
  $env:VITE_PUBLIC_BASE_PATH = $oldBase
  $env:CADDY_SMOKE_EXPECTED_COMMIT = $oldSmokeCommit
  $env:CADDY_SMOKE_BASE_URL = $oldSmokeUrl
}
