#!/bin/sh

# Default values
DEFAULT_RPC_BASE_URL="http://localhost:8349"

# Use environment variables or defaults
export VITE_RPC_BASE_URL="${VITE_RPC_BASE_URL:-$DEFAULT_RPC_BASE_URL}"

echo "Starting development server with:"
echo "  VITE_RPC_BASE_URL=$VITE_RPC_BASE_URL"

# Start the dev server
exec npm run dev -- --host 0.0.0.0 --port 5173