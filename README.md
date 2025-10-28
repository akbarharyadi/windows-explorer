# 📁 Window Explorer - Modern File Management Web App

A Windows Explorer-like web application featuring **real-time WebSocket updates**, **event-driven architecture**, and **clean architecture** principles.

## ⚡ Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Configure environment variables (see Environment Setup below)
cp packages/backend/.env.example packages/backend/.env
cp packages/worker/.env.example packages/worker/.env
cp packages/frontend/.env.example packages/frontend/.env

# 3. Start infrastructure (PostgreSQL, Redis, RabbitMQ)
docker compose up -d

# 4. Setup database
cd packages/backend
bun run prisma:migrate
bun run prisma:seed

# 5. Start all services
bun run dev
```

**Access:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- RabbitMQ UI: http://localhost:15672 (window-explorer / window-explorer_password)

## 🏗️ Architecture

```
┌─────────────┐
│  Frontend   │ ← Vue 3 + WebSocket (Real-time updates)
│  (Vue 3)    │
└──────┬──────┘
       │ HTTP + WebSocket
       ▼
┌─────────────┐   Events    ┌─────────────┐
│   Backend   │────────────▶│  RabbitMQ   │
│  (Elysia)   │             └──────┬──────┘
└──────┬──────┘                    │
       │                           │ Consume
       ├─────Redis (Cache)         ▼
       │                    ┌─────────────┐
       └─────PostgreSQL     │   Worker    │
                           │   (Bun)     │
                           └─────────────┘
```

### Monorepo Structure

```
packages/
├── backend/     # Elysia API + WebSocket server
├── worker/      # Background event processor
├── frontend/    # Vue 3 SPA with real-time UI
└── shared/      # Types, events, utilities
```

## 🚀 Features

### ✨ Real-Time Async Feedback (NEW!)

- **WebSocket updates** for instant operation status
- **Optimistic UI** with visual status indicators (⏳ → 🔄 → ✅/❌)
- **Toast notifications** for user feedback
- **Event tracking** persisted in database

### 📂 File Management

- Hierarchical folder tree with expand/collapse
- File upload with drag & drop
- File preview (PDF, images, text, video, audio)
- Context menu operations
- Global search

### 🏛️ Clean Architecture

- **Domain** layer (business logic, no dependencies)
- **Application** layer (use cases, ports)
- **Infrastructure** layer (adapters: Redis, RabbitMQ, Prisma)
- **Presentation** layer (API routes, WebSocket)

### 🎯 Event-Driven Design

- **RabbitMQ** topic-based routing (4 exchanges, 8 queues)
- **Redis Pub/Sub** for real-time WebSocket broadcasting
- **Worker service** for async processing
- **Event status tracking** (pending → processing → completed/failed)

## 🛠️ Tech Stack

| Layer         | Technology                 |
| ------------- | -------------------------- |
| **Runtime**   | Bun (fast all-in-one)      |
| **Backend**   | Elysia + Socket.IO         |
| **Frontend**  | Vue 3 + Vite               |
| **Database**  | PostgreSQL 16 + Prisma ORM |
| **Cache**     | Redis 7                    |
| **Queue**     | RabbitMQ 3.13              |
| **Monorepo**  | Turborepo                  |
| **Container** | Docker Compose             |

## 📋 Prerequisites

- **Bun** >= 1.1.0 ([Install](https://bun.sh/))
- **Docker** & **Docker Compose** ([Install](https://docs.docker.com/))

## 🔐 Environment Setup

### Backend Environment Variables

Create `packages/backend/.env`:

```bash
# Database Configuration
DATABASE_URL="postgresql://window-explorer:window-explorer_password@localhost:5432/window-explorer_db?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development
API_VERSION=v1
SERVICE_ROLE=api
FRONTEND_URL=http://localhost:5173

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ Configuration
RABBITMQ_URL="amqp://window-explorer:window-explorer_password@localhost:5672"
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=window-explorer
RABBITMQ_PASS=window-explorer_password

# Cache Settings (TTL in seconds)
CACHE_TTL_FOLDER_TREE=300
CACHE_TTL_FOLDER_CHILDREN=120
CACHE_TTL_FOLDER_BY_ID=180
CACHE_TTL_SEARCH=60
CACHE_TTL_FILE_LIST=120

# Queue Settings
QUEUE_PREFETCH_COUNT=10
```

### Worker Environment Variables

Create `packages/worker/.env`:

```bash
# Database Configuration
DATABASE_URL="postgresql://window-explorer:window-explorer_password@localhost:5432/window-explorer_db?schema=public"

# Server Configuration
NODE_ENV=development
SERVICE_ROLE=worker

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ Configuration
RABBITMQ_URL="amqp://window-explorer:window-explorer_password@localhost:5672"
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=window-explorer
RABBITMQ_PASS=window-explorer_password

# Queue Settings
QUEUE_PREFETCH_COUNT=10
```

### Frontend Environment Variables

Create `packages/frontend/.env`:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000

# Backend WebSocket URL (defaults to VITE_API_URL if not set)
VITE_BACKEND_URL=http://localhost:3000
```

### Important Configuration Notes

1. **FRONTEND_URL**: Must match the port where your frontend dev server runs (default: 5173 for Vite)
2. **WebSocket CORS**: Backend WebSocket server uses `FRONTEND_URL` for CORS configuration
3. **Database Credentials**: Match the credentials in `docker-compose.yml`
4. **RabbitMQ Credentials**: Match the credentials in `docker-compose.yml`
5. **Redis**: Default configuration works for local development

## 🔧 Development Scripts

### Root Commands

```bash
bun run dev      # Start all services (backend, worker, frontend)
bun run build    # Build all packages
bun run test     # Run all tests
bun run lint     # Lint all packages
```

### Backend Commands

```bash
cd packages/backend
bun run dev              # Start backend API + WebSocket
bun run prisma:migrate   # Run database migrations
bun run prisma:seed      # Seed sample data (13 folders, 11 files)
bun run prisma:studio    # Open database GUI (http://localhost:5555)
bun test                 # Run tests (102 tests passing)
```

### Worker Commands

```bash
cd packages/worker
bun run dev              # Start background worker
bun test                 # Run worker tests
```

### Frontend Commands

```bash
cd packages/frontend
bun run dev              # Start dev server (http://localhost:5173)
bun run build            # Build for production
bun test                 # Run component tests
```

## 📡 Real-Time Event Flow

```
User Action (Create Folder)
    ↓
Backend API creates folder + eventId
    ↓
Returns {folder, eventId} + Status: PENDING ⏳
    ↓
Publishes to RabbitMQ with eventId
    ↓
Worker consumes → Updates status to PROCESSING 🔄
    ↓
Worker processes (cache invalidation, etc.)
    ↓
Worker updates status to COMPLETED ✅ (or FAILED ❌)
    ↓
Publishes to Redis Pub/Sub
    ↓
WebSocket Server broadcasts to clients
    ↓
Frontend receives update → Shows notification + refreshes UI
```

## 🎨 UI Components

### Pending Events Display

```
┌─────────────────────────────────────┐
│ Processing...                        │
│                                      │
│ ⏳ New Folder         pending        │
│ 🔄 Project Files     processing     │
│ ✅ Documents         completed       │
│ ❌ Invalid Name      failed      ⚠️ │
└─────────────────────────────────────┘
```

### Status Colors

- 🟡 **Pending** (#fff3cd) - Waiting for worker
- 🔵 **Processing** (#d1ecf1) - Worker is processing
- 🟢 **Completed** (#d4edda) - Successfully done
- 🔴 **Failed** (#f8d7da) - Error occurred

## 📁 Project Structure

```
window-explorer/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── application/         # Use cases, ports
│   │   │   ├── domain/              # Business logic
│   │   │   ├── infrastructure/      # Redis, RabbitMQ, Prisma, WebSocket
│   │   │   └── presentation/        # API routes
│   │   └── prisma/                  # Database schema & migrations
│   ├── worker/
│   │   └── src/
│   │       ├── consumers/           # Event consumers
│   │       ├── processors/          # Business logic
│   │       └── infrastructure/      # Redis, RabbitMQ, Prisma
│   ├── frontend/
│   │   └── src/
│   │       ├── components/          # Vue components
│   │       ├── composables/         # Reusable logic (WebSocket, notifications)
│   │       └── services/            # API client
│   └── shared/
│       └── src/
│           ├── events.ts            # Event types
│           ├── eventStatus.ts       # Event status types (NEW!)
│           └── queue.ts             # Queue config
├── docker-compose.yml              # Infrastructure services
└── .env                            # Environment variables
```

## 🧪 Testing

```bash
# Backend tests (102 tests, 229 assertions)
cd packages/backend
bun test

# Infrastructure tests (35 tests)
bun test src/infrastructure/__tests__/

# Frontend tests
cd packages/frontend
bun test

# E2E tests
bun test:e2e
```

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Using Makefile

```bash
make build    # Build all images
make up       # Start services
make down     # Stop services
make logs     # View logs
```

## 📊 API Endpoints

### Event Status (NEW!)

```
GET    /api/v1/events/:eventId/status    # Get event status
GET    /api/v1/events/pending             # Get pending events
GET    /api/v1/events/stats                # Get statistics
DELETE /api/v1/events/cleanup              # Cleanup old events
```

### Folder Management

```
GET    /api/v1/folders/tree              # Get folder tree
GET    /api/v1/folders/:id/children      # Get folder contents
POST   /api/v1/folders                   # Create folder
PUT    /api/v1/folders/:id               # Update folder
DELETE /api/v1/folders/:id               # Delete folder
```

### File Management

```
GET    /api/v1/files/:id                 # Get file info
GET    /api/v1/files/:id/download        # Download file
POST   /api/v1/files/upload              # Upload file
DELETE /api/v1/files/:id                 # Delete file
```

### Search

```
GET    /api/v1/search?q={query}          # Global search
GET    /api/v1/search/folders?q={query}  # Search folders
GET    /api/v1/search/files?q={query}    # Search files
```

## 🔒 Git Hooks (Husky)

### Pre-commit

- ✅ ESLint auto-fix
- ✅ Prettier auto-format

### Pre-push

- ✅ All tests must pass
