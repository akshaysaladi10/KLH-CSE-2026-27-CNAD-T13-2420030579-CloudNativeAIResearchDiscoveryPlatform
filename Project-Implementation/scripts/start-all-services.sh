#!/bin/sh
set -e

echo "=================================================="
echo "Starting Cloud-Native AI Research Discovery Cluster"
echo "=================================================="

export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

# 1. Start Auth Service
echo "--> Starting Auth Service (port 3001)..."
cd /app/services/auth-service
PORT=3001 node src/server.js &
AUTH_PID=$!

# 2. Start Paper Service
echo "--> Starting Paper Service (port 3002)..."
cd /app/services/paper-service
PORT=3002 node src/server.js &
PAPER_PID=$!

# 3. Start Search & Recommendation Service
echo "--> Starting Search & Recommendation Service (port 3003)..."
cd /app/services/search-recommendation-service
PORT=3003 node src/server.js &
SEARCH_PID=$!

# 4. Start PDF PyMuPDF Service
echo "--> Starting PDF Extraction Service (port 8001)..."
cd /app/services/pdf-service
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 &
PDF_PID=$!

# 5. Start AI Synthesis Service
echo "--> Starting AI Synthesis Service (port 8002)..."
cd /app/services/ai-service
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8002 &
AI_PID=$!

# Wait for internal services to spin up
sleep 3

# Trap exit signals to terminate all child processes
trap 'kill -TERM $AUTH_PID $PAPER_PID $SEARCH_PID $PDF_PID $AI_PID' SIGTERM SIGINT

# 6. Start Public API Gateway in Foreground
echo "--> Starting API Gateway on external port $PORT..."
cd /app/api-gateway
export AUTH_SERVICE_URL="http://localhost:3001"
export PAPER_SERVICE_URL="http://localhost:3002"
export SEARCH_REC_SERVICE_URL="http://localhost:3003"
export PDF_SERVICE_URL="http://localhost:8001"
export AI_SERVICE_URL="http://localhost:8002"

exec node src/server.js
