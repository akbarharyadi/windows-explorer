# Build stage
FROM oven/bun:1.2-alpine AS build

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy all packages first (monorepo structure)
COPY . .

# Install dependencies for all packages
WORKDIR /app
RUN bun install --frozen-lockfile

# Build shared package
WORKDIR /app/packages/shared
RUN bun run build

# Build worker package
WORKDIR /app/packages/worker
RUN bun run build

# Production stage
FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy built application
COPY --from=build /app/packages/worker/dist ./dist
COPY --from=build /app/packages/worker/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./node_modules/@window-explorer/shared

# Expose port (though worker is headless)
EXPOSE 3000

# Health check - create a file when worker is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD test -f /app/.worker_running || exit 1

# Start application and touch a file to indicate it's running
CMD ["sh", "-c", "touch /app/.worker_running && bun run dist/index.js"]