#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Monitor System - Docker Deploy Script
# Builds and deploys backend + frontend
# ─────────────────────────────────────────────

PROJECT_NAME="monitor"
CONTAINERS=("monitor-backend" "monitor-frontend")
IMAGES=("monitor-system-backend" "monitor-system-frontend")

COMPOSE_FILE="docker-compose.yml"

echo "═══════════════════════════════════════════"
echo "  Monitor System - Deploy"
echo "═══════════════════════════════════════════"

# ── Pre-check: .env file must exist ──
if [ ! -f .env ]; then
    echo ""
    echo "  ERROR: .env file not found!"
    echo ""
    echo "  Create one from the example:"
    echo "    cp .env.example .env"
    echo "    # then edit .env with your DATABASE_URL, TEAMS_WEBHOOK_URL, etc."
    echo ""
    exit 1
fi
echo ""
echo "▸ .env file found"

# ── Step 1: Stop and remove existing containers ──
echo ""
echo "▸ Stopping existing containers..."
for container in "${CONTAINERS[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "  Stopping and removing: ${container}"
        docker stop "${container}" 2>/dev/null || true
        docker rm -f "${container}" 2>/dev/null || true
    else
        echo "  Not running: ${container}"
    fi
done

# ── Step 2: Remove existing images ──
echo ""
echo "▸ Removing existing images..."
for image in "${IMAGES[@]}"; do
    matching=$(docker images -q "${image}" 2>/dev/null)
    if [ -n "${matching}" ]; then
        echo "  Removing image: ${image}"
        docker rmi -f ${matching} 2>/dev/null || true
    else
        echo "  No image found: ${image}"
    fi
done

# ── Step 3: Bring down any compose services ──
echo ""
echo "▸ Bringing down compose services..."
docker compose -f "${COMPOSE_FILE}" down --remove-orphans 2>/dev/null || true

# ── Step 4: Build with no cache ──
echo ""
echo "▸ Building images (no cache)..."
docker compose -f "${COMPOSE_FILE}" build --no-cache

# ── Step 5: Start services ──
echo ""
echo "▸ Starting services..."
docker compose -f "${COMPOSE_FILE}" up -d

# ── Step 6: Verify ──
echo ""
echo "▸ Waiting for containers to start..."
sleep 3
echo ""
docker compose -f "${COMPOSE_FILE}" ps

echo ""
echo "═══════════════════════════════════════════"
echo "  Deploy complete!"
echo ""
echo "  Frontend:  http://localhost:7071"
echo "  Backend:   ${NEXT_PUBLIC_API_URL:-http://localhost:7070}"
echo "═══════════════════════════════════════════"
