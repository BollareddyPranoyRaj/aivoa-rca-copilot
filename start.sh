#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "   AIVOA.AI - Pharmaceutical API RCA & CAPA Copilot      "
echo "=========================================================="

# Check PostgreSQL service
echo "Checking PostgreSQL service..."
if which brew >/dev/null 2>&1; then
    brew services start postgresql@15 >/dev/null 2>&1 || true
fi

# Ensure database exists
if which /opt/homebrew/opt/postgresql@15/bin/createdb >/dev/null 2>&1; then
    /opt/homebrew/opt/postgresql@15/bin/createdb -U $(whoami) aivoa_rca 2>/dev/null || true
fi

# Trap to kill background jobs on Ctrl+C
cleanup() {
    echo ""
    echo "Shutting down AIVOA.AI servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Backend Server
echo "Starting FastAPI Backend Server on http://127.0.0.1:8000..."
cd "$DIR/backend"
venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for Backend to initialize..."
for i in {1..20}; do
    if curl -s http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1; then
        echo "Backend is live!"
        break
    fi
    sleep 0.5
done

# Start Frontend Dev Server
echo "Starting Vite React Frontend on http://localhost:3000..."
cd "$DIR/frontend"
npm run dev -- --host 127.0.0.1 --port 3000 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "   🚀 AIVOA.AI ROOT CAUSE ANALYSIS APPLICATION READY!    "
echo "=========================================================="
echo "   Web Application UI : http://localhost:3000            "
echo "   Interactive API Docs: http://localhost:8000/docs      "
echo "   Database            : PostgreSQL (aivoa_rca)           "
echo "   Sample Documents    : sample_documents/ (PDF & TXT)   "
echo "=========================================================="
echo "Press Ctrl+C to stop both servers."
echo ""

wait
