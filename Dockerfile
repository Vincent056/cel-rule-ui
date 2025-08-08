# TODO: In the future, create a production build with nginx to host the built UI
# For now, using development server for convenience

# --- Development Stage ---
FROM registry.access.redhat.com/ubi9/ubi:latest

# Install Node.js 20
RUN dnf module install -y nodejs:20 && \
    dnf clean all

# Create app user
RUN useradd -u 1001 -m -s /bin/bash appuser

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies as root (for global packages if needed)
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy source code
COPY . .

# Make entrypoint script executable
RUN chmod +x /app/docker/dev-entrypoint.sh

# Change ownership to app user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set default environment variables (can be overridden at runtime)
ENV VITE_RPC_BASE_URL=http://localhost:8349

# Expose the dev server port
EXPOSE 5173

# Use the entrypoint script
ENTRYPOINT ["/app/docker/dev-entrypoint.sh"]
