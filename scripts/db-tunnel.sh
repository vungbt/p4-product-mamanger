#!/bin/bash
set -euo pipefail

# SSH tunnel → Postgres prod trên VPS (bind 127.0.0.1:5433, không public).
# IDE: Host 127.0.0.1 · Port 5433 · User/Password/DB từ .env.prod

SERVER="${SERVER:-couponlinkh}"
LOCAL_PORT="${LOCAL_PORT:-5433}"
REMOTE_HOST="${REMOTE_HOST:-127.0.0.1}"
REMOTE_PORT="${REMOTE_PORT:-5433}"

usage() {
  cat <<EOF
Usage: ./scripts/db-tunnel.sh [--server alias] [--port N]

  Forwards localhost:LOCAL_PORT → SERVER:REMOTE_HOST:REMOTE_PORT
  Default: couponlinkh · 5433 → 127.0.0.1:5433

  Ctrl+C to stop.
EOF
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --server) SERVER="$2"; shift 2 ;;
    --port)   LOCAL_PORT="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if lsof -nP -iTCP:"$LOCAL_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $LOCAL_PORT already in use:"
  lsof -nP -iTCP:"$LOCAL_PORT" -sTCP:LISTEN
  echo ""
  echo "If it's an old tunnel: kill \$(lsof -t -iTCP:$LOCAL_PORT -sTCP:LISTEN)"
  exit 1
fi

echo "Tunnel: 127.0.0.1:${LOCAL_PORT} → ${SERVER}:${REMOTE_HOST}:${REMOTE_PORT}"
echo "IDE: host=127.0.0.1 port=${LOCAL_PORT} db=p4_product_manager (creds: .env.prod)"
echo "Ctrl+C to stop."
echo ""

exec ssh -N \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -L "${LOCAL_PORT}:${REMOTE_HOST}:${REMOTE_PORT}" \
  "$SERVER"
