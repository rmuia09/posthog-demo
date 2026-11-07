#!/bin/bash
# HogDesk Lite — Local Test Runner
# Starts backend + frontend, runs Playwright E2E tests, then cleans up

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "========================================"
echo "HogDesk Lite — Local E2E Test Runner"
echo "========================================"

# Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 not found"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found"
    exit 1
fi

# Check Node version for Playwright
NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "WARNING: Node $NODE_VERSION detected. Playwright requires Node 20+."
    echo "   Frontend tests may fail. Upgrade Node to v20+ for full E2E testing."
    echo ""
fi

# Cleanup function
cleanup() {
    echo ""
    echo "Cleaning up..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    wait 2>/dev/null || true
    echo "Done."
}
trap cleanup EXIT

# 1. Start Backend
echo ""
echo "[1/3] Starting FastAPI backend..."
cd "$BACKEND_DIR"

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

# Load .env if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

uvicorn main:app --host 127.0.0.1 --port 8000 > /tmp/hogdesk-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be healthy
echo "Waiting for backend to start..."
for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:8000/api/v1/health > /dev/null 2>&1; then
        echo "Backend ready at http://127.0.0.1:8000"
        break
    fi
    sleep 1
done

if ! curl -sf http://127.0.0.1:8000/api/v1/health > /dev/null 2>&1; then
    echo "ERROR: Backend failed to start. Check /tmp/hogdesk-backend.log"
    cat /tmp/hogdesk-backend.log
    exit 1
fi

# 2. Start Frontend
echo ""
echo "[2/3] Starting frontend dev server..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Load .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

npm run dev > /tmp/hogdesk-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be healthy
echo "Waiting for frontend to start..."
for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:5173/ > /dev/null 2>&1; then
        echo "Frontend ready at http://127.0.0.1:5173"
        break
    fi
    sleep 1
done

if ! curl -sf http://127.0.0.1:5173/ > /dev/null 2>&1; then
    echo "ERROR: Frontend failed to start. Check /tmp/hogdesk-frontend.log"
    cat /tmp/hogdesk-frontend.log
    exit 1
fi

# 3. Run Playwright tests
echo ""
echo "[3/3] Running Playwright E2E tests..."
cd "$FRONTEND_DIR"
npx playwright test

echo ""
echo "========================================"
echo "All tests complete!"
echo "========================================"
