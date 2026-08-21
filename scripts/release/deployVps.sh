#!/usr/bin/env sh

set -eu

if [ "$#" -gt 2 ]; then
  echo "Usage: $0 [ssh-host] [release-id]" >&2
  exit 1
fi

SSH_HOST=${1:-mcpspain-official-sources-vps}
RELEASE_ID=${2:-}

case "$SSH_HOST" in
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
  ''|*[!A-Za-z0-9._-]*)
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
PUBLIC_URL=${CADDY_SMOKE_BASE_URL:-https://salida-cyl.157-90-22-40.sslip.io}
ARCHIVE=

cleanup() {
  if [ -n "$ARCHIVE" ]; then
    rm -f "$ARCHIVE"
  fi
}
trap cleanup EXIT

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

ARCHIVE=$(mktemp "${TMPDIR:-/tmp}/salida-cyl-${RELEASE_ID}.XXXXXX.tar.gz")
tar -czf "$ARCHIVE" -C "$DIST" .

scp "$ARCHIVE" "$SSH_HOST:$REMOTE_ARCHIVE"

ssh "$SSH_HOST" "set -eu
install -d -o caddy -g caddy -m 0755 '$REMOTE_RELEASE'
tar -xzf '$REMOTE_ARCHIVE' -C '$REMOTE_RELEASE'
chown -R caddy:caddy '$REMOTE_RELEASE'
test -f '$REMOTE_RELEASE/index.html'
test -f '$REMOTE_RELEASE/version.json'
ln -sfn '$REMOTE_RELEASE' '/srv/salida-cyl/current.next'
mv -Tf '/srv/salida-cyl/current.next' '/srv/salida-cyl/current'
rm -f '$REMOTE_ARCHIVE'
find '/srv/salida-cyl/releases' -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\\n' | sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm -rf --
systemctl reload caddy"

export CADDY_SMOKE_EXPECTED_COMMIT="$COMMIT"
export CADDY_SMOKE_BASE_URL="$PUBLIC_URL"
npm run release:caddy:verify

echo "Published release $RELEASE_ID at $PUBLIC_URL"
