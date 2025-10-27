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

# Build frontend package
WORKDIR /app/packages/frontend
RUN bun run build

# Production stage with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health.html || exit 1

# Create health check file
RUN echo "OK" > /usr/share/nginx/html/health.html

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]