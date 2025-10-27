# Build stage
FROM oven/bun:1.2-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/frontend/package.json ./packages/frontend/package.json

# Install all dependencies
RUN bun install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/frontend/src ./packages/frontend/src
COPY packages/frontend/index.html ./packages/frontend/index.html
COPY packages/frontend/vite.config.ts ./packages/frontend/vite.config.ts
COPY packages/frontend/tsconfig.json ./packages/frontend/tsconfig.json

# Build shared package
WORKDIR /app/packages/shared
RUN bun run build

# Build frontend
WORKDIR /app/packages/frontend
RUN bunx vite build

# Production stage
FROM nginx:alpine

# Copy built static files
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
