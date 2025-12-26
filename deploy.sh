#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

HOST_ALIAS="${HOST_ALIAS:-huamei-airport}"
REMOTE_BASE="${REMOTE_BASE:-/opt/apps/sd-crypto-tools3}"
PM2_APP_NAME="${PM2_APP_NAME:-huamei-airport-parser}"
RUN_IMPORT="${RUN_IMPORT:-1}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
PACKAGE_NAME="huamei-airport-${TIMESTAMP}.tar.gz"
LOCAL_TAR="${TMPDIR:-/tmp}/${PACKAGE_NAME}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

require_cmd tar
require_cmd ssh
require_cmd scp

cd "$ROOT_DIR"

tar -czf "$LOCAL_TAR" \
  --exclude "backend/node_modules" \
  --exclude "backend/logs" \
  --exclude "backend/data" \
  backend frontend

echo "Package created: $LOCAL_TAR"

scp "$LOCAL_TAR" "${HOST_ALIAS}:/root/${PACKAGE_NAME}"

ssh "$HOST_ALIAS" "PACKAGE_NAME=${PACKAGE_NAME} REMOTE_BASE=${REMOTE_BASE} PM2_APP_NAME=${PM2_APP_NAME} RUN_IMPORT=${RUN_IMPORT} bash -s" <<'REMOTE'
set -euo pipefail

TMP_DIR="/tmp/huamei-deploy-${PACKAGE_NAME%.tar.gz}"
BACKEND_DIR="${REMOTE_BASE}/backend"
FRONTEND_DIR="${REMOTE_BASE}/frontend"
ARCHIVE_PATH="/root/${PACKAGE_NAME}"

mkdir -p "$TMP_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$TMP_DIR"

if command -v pm2 >/dev/null 2>&1; then
  pm2 stop "$PM2_APP_NAME" || true
fi

if [ -d "$BACKEND_DIR/data" ]; then
  mv "$BACKEND_DIR/data" "$TMP_DIR/backend-data"
fi
if [ -d "$BACKEND_DIR/logs" ]; then
  mv "$BACKEND_DIR/logs" "$TMP_DIR/backend-logs"
fi

rm -rf "$BACKEND_DIR"
mkdir -p "$REMOTE_BASE"
mv "$TMP_DIR/backend" "$BACKEND_DIR"

if [ -d "$TMP_DIR/backend-data" ]; then
  mv "$TMP_DIR/backend-data" "$BACKEND_DIR/data"
fi
if [ -d "$TMP_DIR/backend-logs" ]; then
  mv "$TMP_DIR/backend-logs" "$BACKEND_DIR/logs"
fi

rm -rf "$FRONTEND_DIR"
mv "$TMP_DIR/frontend" "$FRONTEND_DIR"

cd "$BACKEND_DIR"
if command -v npm >/dev/null 2>&1; then
  if [ -f package-lock.json ]; then
    npm ci --omit=dev || npm install --production
  else
    npm install --production
  fi
else
  echo "npm not found on server" >&2
  exit 1
fi

if [ "${RUN_IMPORT}" = "1" ]; then
  node scripts/importLounges.js
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME" || pm2 start ecosystem.config.js --env production
  pm2 save || true
fi

rm -rf "$TMP_DIR" "$ARCHIVE_PATH"
echo "Deploy done."
REMOTE

rm -f "$LOCAL_TAR"
