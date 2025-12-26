#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

HOST_ALIAS="${HOST_ALIAS:-}"
SSH_TARGET="${SSH_TARGET:-}"
SSH_CONFIG="${SSH_CONFIG:-$HOME/.ssh/config}"
REMOTE_BASE="${REMOTE_BASE:-/opt/apps/sd-crypto-tools3}"
PM2_APP_NAME="${PM2_APP_NAME:-huamei-airport-parser}"
RUN_IMPORT="${RUN_IMPORT:-1}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:5678/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-8}"
HEALTH_DELAY="${HEALTH_DELAY:-2}"

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

detect_host_alias() {
  local config="${SSH_CONFIG}"
  if [ -f "$config" ]; then
    local alias
    alias="$(awk '
      /^[[:space:]]*Host[[:space:]]+/ {
        hosts="";
        for (i=2;i<=NF;i++) {
          if ($i ~ /^#/) break;
          if (hosts=="") hosts=$i; else hosts=hosts" " $i;
        }
      }
      /^[[:space:]]*HostName[[:space:]]+/ {
        if ($2 == "101.201.78.140" && hosts != "") {
          split(hosts, arr, " ");
          print arr[1];
          exit;
        }
      }
    ' "$config")"
    if [ -n "$alias" ]; then
      echo "$alias"
      return 0
    fi
  fi
  return 1
}

is_ascii() {
  LC_ALL=C printf "%s" "$1" | grep -q '^[\x20-\x7E]*$'
}

load_host_config() {
  local alias="$1"
  if [ ! -f "$SSH_CONFIG" ]; then
    return 1
  fi
  awk -v target="$alias" '
    /^[[:space:]]*Host[[:space:]]+/ {
      inside=0;
      for (i=2;i<=NF;i++) {
        if ($i==target) inside=1;
      }
    }
    inside && /^[[:space:]]*HostName[[:space:]]+/ { print "HOSTNAME="$2; }
    inside && /^[[:space:]]*User[[:space:]]+/ { print "USER="$2; }
    inside && /^[[:space:]]*IdentityFile[[:space:]]+/ { print "IDENTITY="$2; }
    inside && /^[[:space:]]*Port[[:space:]]+/ { print "PORT="$2; }
  ' "$SSH_CONFIG"
}

declare -a SSH_OPTS=()
if [ -z "$SSH_TARGET" ]; then
  if [ -z "$HOST_ALIAS" ]; then
    HOST_ALIAS="$(detect_host_alias || true)"
  fi
  HOST_ALIAS="${HOST_ALIAS:-huamei-airport}"

  if [ -n "$HOST_ALIAS" ] && is_ascii "$HOST_ALIAS"; then
    SSH_TARGET="$HOST_ALIAS"
  else
    cfg="$(load_host_config "$HOST_ALIAS" || true)"
    eval "$cfg"
    if [ -z "${HOSTNAME:-}" ]; then
      echo "无法解析 SSH 主机信息，请设置 SSH_TARGET 或 HOST_ALIAS。" >&2
      exit 1
    fi
    if [ -n "${IDENTITY:-}" ]; then
      IDENTITY="${IDENTITY/#\~/$HOME}"
      SSH_OPTS+=("-o" "IdentityFile=${IDENTITY}")
    fi
    if [ -n "${PORT:-}" ]; then
      SSH_OPTS+=("-o" "Port=${PORT}")
    fi
    if [ -n "${USER:-}" ]; then
      SSH_TARGET="${USER}@${HOSTNAME}"
    else
      SSH_TARGET="${HOSTNAME}"
    fi
  fi
fi
if [ -z "$SSH_TARGET" ]; then
  echo "SSH_TARGET is empty. Please set SSH_TARGET or configure ~/.ssh/config." >&2
  exit 1
fi

cd "$ROOT_DIR"

TAR_EXTRA_OPTS=""
if tar --help 2>&1 | grep -q -- '--no-xattrs'; then
  TAR_EXTRA_OPTS="--no-xattrs"
fi
if [ -n "$TAR_EXTRA_OPTS" ]; then
  COPYFILE_DISABLE=1 tar $TAR_EXTRA_OPTS -czf "$LOCAL_TAR" \
    --exclude "backend/node_modules" \
    --exclude "backend/logs" \
    --exclude "backend/data" \
    backend frontend
else
  COPYFILE_DISABLE=1 tar -czf "$LOCAL_TAR" \
    --exclude "backend/node_modules" \
    --exclude "backend/logs" \
    --exclude "backend/data" \
    backend frontend
fi

echo "Package created: $LOCAL_TAR"

SCP_OPTS=()
if [ ${#SSH_OPTS[@]} -gt 0 ]; then
  SCP_OPTS=("${SSH_OPTS[@]}")
fi
scp "${SCP_OPTS[@]}" "$LOCAL_TAR" "${SSH_TARGET}:/root/${PACKAGE_NAME}"

SSH_CMD_OPTS=()
if [ ${#SSH_OPTS[@]} -gt 0 ]; then
  SSH_CMD_OPTS=("${SSH_OPTS[@]}")
fi
HEALTH_URL_ESCAPED="$(printf '%q' "$HEALTH_URL")"
HEALTH_RETRIES_ESCAPED="$(printf '%q' "$HEALTH_RETRIES")"
HEALTH_DELAY_ESCAPED="$(printf '%q' "$HEALTH_DELAY")"
ssh "${SSH_CMD_OPTS[@]}" "$SSH_TARGET" "PACKAGE_NAME=${PACKAGE_NAME} REMOTE_BASE=${REMOTE_BASE} PM2_APP_NAME=${PM2_APP_NAME} RUN_IMPORT=${RUN_IMPORT} HEALTH_URL=${HEALTH_URL_ESCAPED} HEALTH_RETRIES=${HEALTH_RETRIES_ESCAPED} HEALTH_DELAY=${HEALTH_DELAY_ESCAPED} bash -s" <<'REMOTE'
set -euo pipefail

TMP_DIR="/tmp/huamei-deploy-${PACKAGE_NAME%.tar.gz}"
BACKEND_DIR="${REMOTE_BASE}/backend"
FRONTEND_DIR="${REMOTE_BASE}/frontend"
ARCHIVE_PATH="/root/${PACKAGE_NAME}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:5678/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-8}"
HEALTH_DELAY="${HEALTH_DELAY:-2}"

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

SERVICE_PORT=""
if [ -n "$HEALTH_URL" ]; then
  SERVICE_PORT="$(echo "$HEALTH_URL" | sed -n 's|.*://[^:/]*:\([0-9][0-9]*\).*|\1|p')"
fi
if [ -z "$SERVICE_PORT" ] && [ -f "$BACKEND_DIR/ecosystem.config.js" ]; then
  SERVICE_PORT="$(node -e "const cfg=require('./ecosystem.config.js');const app=cfg.apps&&cfg.apps[0];const port=(app&&app.env_production&&app.env_production.PORT)||(app&&app.env&&app.env.PORT)||'';if(port)console.log(port);" 2>/dev/null || true)"
fi
if [ -n "$SERVICE_PORT" ]; then
  echo "Service port: $SERVICE_PORT"
  echo "Local URL: http://127.0.0.1:${SERVICE_PORT}/simple.html"
fi

if command -v curl >/dev/null 2>&1; then
  echo "Health check: $HEALTH_URL"
  health_ok=0
  for _ in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
      health_ok=1
      break
    fi
    sleep "$HEALTH_DELAY"
  done
  if [ "$health_ok" -eq 1 ]; then
    echo "Health check OK"
  else
    echo "Health check failed after ${HEALTH_RETRIES} attempts" >&2
    exit 1
  fi
else
  echo "curl not found, skipped health check" >&2
fi

rm -rf "$TMP_DIR" "$ARCHIVE_PATH"
echo "Deploy done."
REMOTE

rm -f "$LOCAL_TAR"
