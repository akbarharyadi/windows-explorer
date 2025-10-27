# Build stage
FROM oven/bun:1.2-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/worker/package.json ./packages/worker/package.json
COPY packages/backend/package.json ./packages/backend/package.json

# Install all dependencies
RUN bun install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/worker/src ./packages/worker/src
COPY packages/worker/tsconfig.json ./packages/worker/tsconfig.json
COPY packages/backend/prisma ./packages/backend/prisma

# Build shared package
WORKDIR /app/packages/shared
RUN bun run build

# Generate Prisma client
WORKDIR /app/packages/backend
RUN bunx prisma generate

# Build worker
WORKDIR /app/packages/worker
RUN bun run build

# Production stage
FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy everything we need
COPY --from=build /app/packages/worker/dist ./dist
COPY --from=build /app/packages/worker/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD ps aux | grep 'bun' | grep -v grep || exit 1

# Start worker
CMD ["bun", "run", "dist/index.js"]
