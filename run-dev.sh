#!/bin/bash

# Development run script for CEL Chat UI
# This script makes it easy to run the chat UI with custom settings

# Default values
DEFAULT_RPC_URL="http://localhost:8349"
DEFAULT_PORT="5173"

# Parse command line arguments
RPC_URL="${1:-$DEFAULT_RPC_URL}"
PORT="${2:-$DEFAULT_PORT}"

echo "Starting CEL Chat UI Development Server"
echo "======================================="
echo "RPC Server URL: $RPC_URL"
echo "UI Port: $PORT"
echo ""

# Build the image if it doesn't exist
if ! podman image exists cel-chat-ui:dev; then
    echo "Building development image..."
    podman build -t cel-chat-ui:dev .
fi

# Stop any existing container
podman stop cel-chat-ui 2>/dev/null || true
podman rm cel-chat-ui 2>/dev/null || true

# Run the container
echo "Starting container..."
podman run -d \
    --name cel-chat-ui \
    -p "${PORT}:5173" \
    -e VITE_RPC_BASE_URL="$RPC_URL" \
    cel-chat-ui:dev

echo ""
echo "Chat UI is starting..."
echo "Access it at: http://localhost:${PORT}"
echo ""
echo "To view logs: podman logs -f cel-chat-ui"
echo "To stop: podman stop cel-chat-ui"