#!/usr/bin/env bash
# deploy-to-vps.sh — Build chime and rsync to /opt/chime on the VPS.
#
# Usage:
#   ./scripts/deploy-to-vps.sh           # deploy to production
#   ./scripts/deploy-to-vps.sh dev       # deploy to /opt/chime-dev
#
# Prerequisites:
#   - SSH access to snel-bot (or replace HOST below)
#   - npm run build runs clean (lint/tsc/build pass locally)

set -euo pipefail

ENV="${1:-prod}"
HOST="snel-bot"
REMOTE_BASE="/opt/chime${ENV == 'dev' && '-dev' || ''}"
RELEASE_DIR="${REMOTE_BASE}/releases"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RELEASE="${RELEASE_DIR}/${TIMESTAMP}"

echo "=== CHIME deploy to ${HOST}:${RELEASE} ==="

# 1. Build
echo "[1/4] Building..."
npm run build

# 2. Create release dir on VPS
echo "[2/4] Preparing remote dir..."
ssh "${HOST}" "mkdir -p '${RELEASE}' '${REMOTE_BASE}/logs' '${REMOTE_BASE}/shared'"

# 3. Rsync
echo "[3/4] Rsyncing..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next/cache' \
  . "${HOST}:${RELEASE}/"

# 4. Update symlink and restart
echo "[4/4] Updating symlink and restarting PM2..."
ssh "${HOST}" bash -s <<EOF
  ln -sfn '${RELEASE}' '${REMOTE_BASE}/current'
  cd '${REMOTE_BASE}'
  pm2 delete chime 2>/dev/null || true
  pm2 start ecosystem.config.cjs
  pm2 save
EOF

echo "Deployed to ${REMOTE_BASE}/current"
echo "Check status: ssh ${HOST} 'pm2 describe chime'"
