[CmdletBinding()]
param(
  [string]$SshHost = "mcpspain-official-sources-vps",
  [string]$PublicUrl = "https://salida-cyl.157-90-22-40.sslip.io",
  [string]$ReleaseId = ""
)

$ErrorActionPreference = "Stop"

if ($ReleaseId -eq "") {
  $commit = (git rev-parse --short=12 HEAD).Trim()
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

try {
  Push-Location $root
  $env:VITE_PUBLIC_BASE_PATH = "/"
  npm ci
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

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

  $env:CADDY_SMOKE_BASE_URL = $PublicUrl
  npm run release:caddy:verify
  if ($LASTEXITCODE -ne 0) { throw "Live deployment verification failed." }

  Write-Output "Published release $ReleaseId at $PublicUrl"
} finally {
  Pop-Location
  Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
}
