#!/usr/bin/env sh

set -eu

if [ "$#" -gt 2 ]; then
  echo "Usage: $0 [ssh-host] [release-id]" >&2
  exit 1
fi

SSH_HOST=${1:-mcpspain-official-sources-vps}
RELEASE_ID=${2:-}

case "$SSH_HOST" in
  -*)
    echo "SSH host must not start with '-'." >&2
    exit 1
    ;;
  ''|*[!A-Za-z0-9._-]*)
    echo "SSH host contains unsupported characters." >&2
    exit 1
    ;;
esac

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(git -C "$SCRIPT_DIR/../.." rev-parse --show-toplevel)
cd "$ROOT"

COMMIT=$(git rev-parse HEAD)
if [ "${#COMMIT}" -ne 40 ]; then
  echo "Invalid commit SHA: $COMMIT" >&2
  exit 1
fi
case "$COMMIT" in
  ''|*[!0-9a-f]*)
    echo "Invalid commit SHA: $COMMIT" >&2
    exit 1
    ;;
esac

if [ -z "$RELEASE_ID" ]; then
  RELEASE_ID="$(date -u +%Y%m%d%H%M%S)-$COMMIT"
fi
case "$RELEASE_ID" in
  ''|'.'|'..'|*[!A-Za-z0-9._-]*)
    echo "Release ID contains unsupported characters." >&2
    exit 1
    ;;
esac

GIT_STATUS=$(git status --porcelain)
if [ -n "$GIT_STATUS" ]; then
  echo "Working directory is not clean. Commit or stash changes before deployment." >&2
  exit 1
fi

DIST="$ROOT/dist"
REMOTE_ARCHIVE="/tmp/salida-cyl-$RELEASE_ID.tar.gz"
REMOTE_RELEASE="/srv/salida-cyl/releases/$RELEASE_ID"
REMOTE_STAGING="/srv/salida-cyl/releases/.staging-$RELEASE_ID"
REMOTE_CURRENT="/srv/salida-cyl/current"
REMOTE_CURRENT_NEXT="/srv/salida-cyl/current.next"
PUBLIC_URL=${CADDY_SMOKE_BASE_URL:-https://salida-cyl.157-90-22-40.sslip.io}
ARCHIVE=
LIVE_OBSERVED_SHA=unknown
LIVE_CURRENT_ACTIVATION_STATE=unknown

cleanup() {
  if [ -n "$ARCHIVE" ]; then
    rm -f "$ARCHIVE"
  fi
}
trap cleanup EXIT

normalise_sha() {
  value=${1:-}
  if [ "${#value}" -eq 40 ]; then
    case "$value" in
      *[!0-9a-f]*) ;;
      *) printf '%s\n' "$value"; return 0;;
    esac
  fi
  printf '%s\n' unknown
}

normalise_current_state() {
  case "${1:-}" in
    "$REMOTE_RELEASE") printf 'release %s\n' "$RELEASE_ID";;
    unknown|'') printf '%s\n' unknown;;
    *) printf '%s\n' other;;
  esac
}

observe_current_state() {
  observed_sha_raw=$(ssh "$SSH_HOST" "if test -f '$REMOTE_CURRENT/version.json'; then
sed -n -E 's/.*\"commit\"[[:space:]]*:[[:space:]]*\"([0-9a-f]{40})\".*/\1/p' '$REMOTE_CURRENT/version.json' | head -n 1
else
printf '%s\\n' unknown
fi" 2>/dev/null) || observed_sha_raw=unknown
  LIVE_OBSERVED_SHA=$(normalise_sha "$observed_sha_raw")

  current_target_raw=$(ssh "$SSH_HOST" "if test -L '$REMOTE_CURRENT'; then
readlink '$REMOTE_CURRENT'
else
printf '%s\\n' unknown
fi" 2>/dev/null) || current_target_raw=unknown
  LIVE_CURRENT_ACTIVATION_STATE=$(normalise_current_state "$current_target_raw")
}

export VITE_PUBLIC_BASE_PATH="/"
npm ci
npm run build

if [ ! -d "$DIST" ]; then
  echo "Build output directory '$DIST' not found." >&2
  exit 1
fi

"$ROOT/node_modules/.bin/tsx" \
  "$ROOT/scripts/release/writeVersionMetadata.ts" \
  "$DIST" \
  "$COMMIT"

ARCHIVE=$(mktemp "${TMPDIR:-/tmp}/salida-cyl-${RELEASE_ID}.tar.gz.XXXXXX")
tar -czf "$ARCHIVE" -C "$DIST" .

if scp "$ARCHIVE" "$SSH_HOST:$REMOTE_ARCHIVE"; then
  :
else
  ssh "$SSH_HOST" "rm -f -- '$REMOTE_ARCHIVE'" >/dev/null 2>&1 || :
  echo "Archive upload failed for release $RELEASE_ID (expected commit $COMMIT; remote archive cleanup was attempted)." >&2
  exit 1
fi

if ssh "$SSH_HOST" "set -eu
archive_owned=1
staging_owned=0
current_next_owned=0
remote_cleanup() {
  if [ "\$current_next_owned" -eq 1 ] && test -L '$REMOTE_CURRENT_NEXT'; then
    rm -f -- '$REMOTE_CURRENT_NEXT' || :
  fi
  if [ "\$staging_owned" -eq 1 ] && test -d '$REMOTE_STAGING' && ! test -L '$REMOTE_STAGING'; then
    rm -rf -- '$REMOTE_STAGING' || :
  fi
  if [ "\$archive_owned" -eq 1 ]; then
    rm -f -- '$REMOTE_ARCHIVE' || :
  fi
}
trap remote_cleanup EXIT
if test -e '$REMOTE_RELEASE' || test -L '$REMOTE_RELEASE'; then
  echo 'Release already exists; refusing to mutate it.' >&2
  exit 1
fi
if test -e '$REMOTE_STAGING' || test -L '$REMOTE_STAGING'; then
  echo 'Release staging path already exists; refusing to mutate it.' >&2
  exit 1
fi
if test -e '$REMOTE_CURRENT_NEXT' || test -L '$REMOTE_CURRENT_NEXT'; then
  echo 'current.next already exists; refusing to replace it.' >&2
  exit 1
fi
if ! mkdir -m 0755 '$REMOTE_STAGING'; then
  echo 'Could not reserve release staging path.' >&2
  exit 1
fi
staging_owned=1
tar -xzf '$REMOTE_ARCHIVE' -C '$REMOTE_STAGING'
chown -R caddy:caddy '$REMOTE_STAGING'
test -f '$REMOTE_STAGING/index.html'
test -f '$REMOTE_STAGING/version.json'
if ! mv -Tn '$REMOTE_STAGING' '$REMOTE_RELEASE'; then
  echo 'Could not publish release without replacing an existing path.' >&2
  exit 1
fi
if test -e '$REMOTE_STAGING' || test -L '$REMOTE_STAGING'; then
  echo 'Release publish did not consume the reserved staging path.' >&2
  exit 1
fi
staging_owned=0
if ! ln -s '$REMOTE_RELEASE' '$REMOTE_CURRENT_NEXT'; then
  echo 'Could not reserve current.next.' >&2
  exit 1
fi
current_next_owned=1
if ! test -L '$REMOTE_CURRENT_NEXT'; then
  echo 'current.next is not a symlink; refusing to activate it.' >&2
  exit 1
fi
if ! mv -Tf '$REMOTE_CURRENT_NEXT' '$REMOTE_CURRENT'; then
  echo 'Could not activate current atomically.' >&2
  exit 1
fi
current_next_owned=0
if ! rm -f '$REMOTE_ARCHIVE'; then
  echo 'Could not remove the uploaded archive.' >&2
  exit 1
fi
archive_owned=0
find '/srv/salida-cyl/releases' -mindepth 1 -maxdepth 1 -type d ! -name '.staging-*' -printf '%T@ %p\\n' | sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm -rf --
systemctl reload caddy"; then
  :
else
  ssh "$SSH_HOST" "rm -f -- '$REMOTE_ARCHIVE'" >/dev/null 2>&1 || :
  observe_current_state
  echo "Remote activation failed for release $RELEASE_ID (expected commit $COMMIT; observed SHA: $LIVE_OBSERVED_SHA; current activation state: $LIVE_CURRENT_ACTIVATION_STATE)." >&2
  exit 1
fi

export CADDY_SMOKE_EXPECTED_COMMIT="$COMMIT"
export CADDY_SMOKE_BASE_URL="$PUBLIC_URL"
if npm run release:caddy:verify; then
  :
else
  observe_current_state
  echo "Live deployment verification failed for release $RELEASE_ID (expected commit $COMMIT; observed SHA: $LIVE_OBSERVED_SHA; current activation state: $LIVE_CURRENT_ACTIVATION_STATE)." >&2
  exit 1
fi

echo "Published release $RELEASE_ID at $PUBLIC_URL"
