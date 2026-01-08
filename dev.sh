#!/bin/bash

# Development Script - Start both backend and frontend

echo "🚀 Starting Content Hub Monorepo..."
echo ""
echo "Backend API will run on:  http://localhost:3001"
echo "Frontend UI will run on:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to kill all background processes on exit
cleanup() {
  echo ""
  echo "🛑 Stopping all services..."
  kill $(jobs -p) 2>/dev/null
  exit 0
}

trap cleanup EXIT INT

# Start backend in background
echo "📡 Starting Backend API (port 3001)..."
npm run backend:dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend in foreground
echo "🎨 Starting Frontend UI (port 3000)..."
npm run frontend:dev

wait
