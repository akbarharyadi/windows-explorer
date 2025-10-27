# Build stage
FROM oven/bun:1.2-alpine AS build

WORKDIR /app

# Copy package files and lock file
COPY package.json bun.lock ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Copy prisma schema
COPY packages/backend/prisma ./packages/backend/prisma/

# Copy shared package source
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Build shared package
RUN cd packages/shared && bun run build

# Copy backend source code
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/tsconfig.json ./packages/backend/

# Generate Prisma Client
RUN cd packages/backend && bunx prisma generate

# Build application
RUN cd packages/backend && bun build src/index.ts --outdir=dist --target=bun

# Production stage
FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy built application
COPY --from=build /app/packages/backend/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/backend/prisma ./prisma
COPY --from=build /app/packages/backend/package.json ./
COPY --from=build /app/packages/shared ./node_modules/@window-explorer/shared

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start application
CMD ["bun", "run", "dist/index.js"]