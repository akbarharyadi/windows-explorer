# Build stage
FROM oven/bun:1.2-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Build application
RUN bun build src/index.ts --outdir=dist --target=bun

# Production stage
FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start application
CMD ["bun", "run", "dist/index.js"]