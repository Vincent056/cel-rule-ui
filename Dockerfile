# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (leveraging Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy source
COPY . .

# Build UI (allows overriding API endpoint at build time via VITE_CEL_RPC_ENDPOINT)
ARG VITE_CEL_RPC_ENDPOINT=/mcp
ENV VITE_CEL_RPC_ENDPOINT=${VITE_CEL_RPC_ENDPOINT}
RUN npm run build

# --- Runtime Stage ---
FROM nginx:alpine AS runtime

# Copy build output to nginx html dir
COPY --from=builder /app/dist /usr/share/nginx/html


# Copy nginx config to serve UI and allow SPA routing
COPY --from=builder /app/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script for runtime configuration
COPY --from=builder /app/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set default VITE_RPC_BASE_URL (can be overridden at runtime)
ENV VITE_RPC_BASE_URL=http://localhost:8080

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
