#!/bin/sh

# Default value if not provided
VITE_RPC_BASE_URL=${VITE_RPC_BASE_URL:-"http://localhost:8080"}

echo "Configuring RPC Base URL to: $VITE_RPC_BASE_URL"

# Find all JS files in the built app and replace the placeholder
find /usr/share/nginx/html -name "*.js" -exec sed -i "s|__VITE_RPC_BASE_URL_PLACEHOLDER__|$VITE_RPC_BASE_URL|g" {} \;

# Start nginx
exec nginx -g "daemon off;"
