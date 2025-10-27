# Window Explorer - File Management Web Application

A Windows Explorer-like web application built with modern technologies and Clean Architecture.

## 🏗️ Architecture

This project uses a **monorepo** structure with the following packages:

- **`packages/backend`** - Backend API service (Elysia + Bun)
- **`packages/worker`** - Background worker service for async processing
- **`packages/frontend`** - Frontend application (Vue 3) with file preview and management
- **`packages/shared`** - Shared types and utilities

## 🛠️ Tech Stack

### Core Technologies

- **Runtime**: [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- **Monorepo**: [Turborepo](https://turbo.build/) - High-performance build system
- **Package Manager**: Bun workspaces

### Backend

- **Framework**: Elysia
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Cache**: Redis 7
- **Message Queue**: RabbitMQ 3.13
- **Architecture**: Clean Architecture

### Frontend

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Git Hooks**: Husky
- **Code Quality**: ESLint + Prettier + lint-staged

## 📋 Prerequisites

- **Bun** >= 1.1.0 ([Install](https://bun.sh/docs/installation))
- **Docker** & **Docker Compose** ([Install](https://docs.docker.com/get-docker/))
- **Git** ([Install](https://git-scm.com/downloads))

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Start Infrastructure (Docker)

```bash
docker compose up -d
```

This will start:

- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **RabbitMQ** on port `5672` (Management UI: `15672`)

### 3. Access Services

- **RabbitMQ Management**: http://localhost:15672
  - Username: `window_explorer`
  - Password: `window_explorer123`

- **PostgreSQL**:
  - Host: `localhost:5432`
  - Database: `window_explorer_db`
  - Username: `window_explorer`
  - Password: `window_explorer123`

- **Redis**:
  - Host: `localhost:6379`

### 4. Setup Database (Backend)

```bash
cd packages/backend

# 1. Generate Prisma client
bun run prisma:generate

# 2. Run migrations
bun run prisma:migrate

# 3. Seed database with sample data (13 folders, 11 files)
bun run prisma:seed

# 4. Verify database setup
bun run test-db.ts
```

### 5. Test Infrastructure Setup

Verify Redis and RabbitMQ are working:

```bash
cd packages/backend

# Run Redis integration tests (20 tests)
bun test src/infrastructure/__tests__/redis.test.ts

# Run RabbitMQ integration tests (15 tests)
bun test src/infrastructure/__tests__/rabbitmq.test.ts

# Or run all infrastructure tests (35 tests)
bun test src/infrastructure/__tests__/
```

### 6. Explore Database (Optional)

Open Prisma Studio untuk melihat data secara visual:

```bash
cd packages/backend
bun run prisma:studio
```

Akses di: http://localhost:5555

## 📦 Available Scripts

### Root Level

```bash
# Run all services in development mode
bun run dev

# Build all packages
bun run build

# Run linting
bun run lint

# Run tests
bun run test

# Clean all build artifacts and node_modules
bun run clean
```

### Backend Package

```bash
cd packages/backend

# Generate Prisma client
bun run prisma:generate

# Run migrations
bun run prisma:migrate

# Seed database
bun run prisma:seed

# Open Prisma Studio (visual database editor)
bun run prisma:studio

# Run tests
bun test

# Verify database setup
bun run test-db.ts
```

### Turborepo Commands

```bash
# Build specific package
bunx turbo run build --filter=@window-explorer/shared

# Run dev for specific package
bunx turbo run dev --filter=@window-explorer/backend

# Run tests for all packages
bunx turbo run test
```

## 🔒 Git Hooks

This project uses **Husky** to enforce code quality:

### Pre-commit Hook

Automatically runs **before every commit**:

- ✅ ESLint (auto-fix)
- ✅ Prettier (auto-format)

### Pre-push Hook

Automatically runs **before every push**:

- ✅ Unit tests (must pass)

## 📁 Project Structure

```
window-explorer/
├── .husky/                    # Git hooks
│   ├── pre-commit            # ESLint + Prettier
│   └── pre-push              # Run tests
├── packages/
│   ├── backend/              # Backend API service (Clean Architecture)
│   │   ├── src/
│   │   │   ├── application/         # Application layer (use cases, ports)
│   │   │   │   └── ports/           # Application interfaces (CachePort, EventPublisherPort)
│   │   │   ├── domain/              # Business logic (no dependencies)
│   │   │   │   ├── entities/        # FolderEntity, FileEntity
│   │   │   │   ├── repositories/    # Repository interfaces (ports)
│   │   │   │   └── errors/          # Domain errors
│   │   │   └── infrastructure/      # External dependencies
│   │   │       ├── cache/           # Redis cache implementation
│   │   │       │   ├── config.ts           # Cache TTL & key patterns
│   │   │       │   ├── redis.ts            # Redis connection
│   │   │       │   └── redis.adapter.ts    # CachePort implementation
│   │   │       ├── messaging/       # RabbitMQ messaging implementation
│   │   │       │   ├── rabbitmq.ts         # RabbitMQ connection manager
│   │   │       │   └── rabbitmq.publisher.ts  # EventPublisherPort implementation
│   │   │       ├── database/
│   │   │       │   ├── prisma.ts           # Prisma client
│   │   │       │   ├── seed.ts             # Database seeding
│   │   │       │   └── repositories/       # Repository implementations (adapters)
│   │   │       └── __tests__/       # Infrastructure integration tests
│   │   │           ├── test-infrastructure.ts  # Test utilities
│   │   │           ├── redis.test.ts           # Redis tests (20 tests)
│   │   │           └── rabbitmq.test.ts        # RabbitMQ tests (15 tests)
│   │   ├── tests/
│   │   │   └── unit/                # Unit tests
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Database schema
│   │   │   └── migrations/          # Database migrations
│   │   ├── test-db.ts               # Database verification script
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── worker/               # Background worker service (TODO)
│   │   └── src/
│   ├── frontend/             # Frontend application (Vue 3) ✅
│   │   ├── src/
│   │   │   ├── components/           # Vue components
│   │   │   │   ├── FolderTree.vue    # Folder tree view
│   │   │   │   ├── FolderList.vue    # File and folder list view
│   │   │   │   ├── FilePreview.vue   # File preview modal
│   │   │   │   ├── FileUpload.vue    # File upload component
│   │   │   │   ├── SearchBar.vue     # Search functionality
│   │   │   │   ├── ContextMenu.vue   # Context menu component
│   │   │   │   └── CreateFolderModal.vue  # Folder creation modal
│   │   │   ├── composables/          # Vue composables
│   │   │   │   ├── useFolders.ts     # Folder management logic
│   │   │   │   ├── useTreeState.ts   # Tree expansion state
│   │   │   │   ├── useSearch.ts      # Search functionality
│   │   │   │   ├── useDragAndDrop.ts # Drag and drop operations
│   │   │   │   └── useFileUpload.ts  # File upload management
│   │   │   ├── services/             # API service
│   │   │   │   └── api.ts            # API client
│   │   │   ├── types/                # TypeScript definitions
│   │   │   │   └── index.ts          # Type definitions
│   │   │   ├── App.vue               # Main application component
│   │   │   └── main.ts               # Entry point
│   └── shared/               # Shared types and utilities ✅
│       ├── src/
│       │   ├── events.ts            # Event type definitions
│       │   ├── queue.ts             # Queue configuration
│       │   ├── eventBuilder.ts      # Event builder helpers
│       │   ├── utils.ts             # Utility functions
│       │   └── index.ts             # Main export
│       ├── package.json
│       └── tsconfig.json
├── plan/                     # Implementation plans
├── docker-compose.yml        # Infrastructure services
├── .env                      # Environment variables
├── package.json              # Root package.json
├── turbo.json                # Turborepo configuration
├── tsconfig.json             # TypeScript configuration
├── eslint.config.js          # ESLint configuration
├── .prettierrc               # Prettier configuration
└── README.md                 # This file
```

## 🐳 Docker Services

### Start All Services

```bash
docker compose up -d
```

### Stop All Services

```bash
docker compose down
```

### View Logs

```bash
docker compose logs -f
```

### Remove Volumes (Reset Data)

```bash
docker compose down -v
```

## 🧪 Development Workflow

### 1. Create a new feature branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make changes

```bash
# Edit files
# Pre-commit hook will automatically run ESLint + Prettier
git add .
git commit -m "feat: your feature description"
```

### 3. Push changes

```bash
# Pre-push hook will automatically run tests
git push origin feature/your-feature-name
```

## 📚 Documentation

Detailed implementation plans are available in the [`plan/`](./plan/) directory:

- [Step 01: Setup Monorepo](./plan/01-setup-monorepo.md) ✅ **COMPLETED**
- [Step 01.5: Shared Package - Event Types](./plan/01.5-shared-package-events.md) ✅ **COMPLETED**
- [Step 02: Database Setup](./plan/02-database-setup.md) ✅ **COMPLETED**
- [Step 02.5: Redis & RabbitMQ Setup](./plan/02.5-redis-rabbitmq-setup.md) ✅ **COMPLETED**
- [Step 03: Backend API](./plan/03-backend-api.md) ✅ **COMPLETED**
- [Step 03.5: Worker Microservice](./plan/03.5-worker-microservice.md) ✅ **COMPLETED**
- [Step 04: Frontend App](./plan/04-frontend-app.md) ✅ **COMPLETED**
- [Step 05: Docker Setup](./plan/05-docker-setup.md)
- [Step 06: Testing & Deployment](./plan/06-testing-deployment.md)

## 🔧 Troubleshooting

### Bun command not found

Re-run the Bun installer and ensure the Bun binary directory is on your `PATH`:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Docker services not starting

Check if ports are already in use:

```bash
# Check PostgreSQL port
lsof -i :5432

# Check Redis port
lsof -i :6379

# Check RabbitMQ ports
lsof -i :5672
lsof -i :15672
```

### Turborepo cache issues

Clean the Turborepo cache:

```bash
bunx turbo run clean
rm -rf .turbo
```

### Redis connection issues

Verify Redis is running and accessible:

```bash
# Check Redis container
docker ps | grep redis

# Test Redis connection
docker exec window-explorer-redis redis-cli ping

# View Redis logs
docker logs window-explorer-redis
```

### RabbitMQ connection issues

Verify RabbitMQ is running:

```bash
# Check RabbitMQ container
docker ps | grep rabbitmq

# Check RabbitMQ health
docker exec window-explorer-rabbitmq rabbitmq-diagnostics ping

# View RabbitMQ logs
docker logs window-explorer-rabbitmq

# Access RabbitMQ Management UI
# Open http://localhost:15672 in browser
# Credentials: window_explorer / window_explorer123
```

### Running infrastructure tests fails

Ensure all Docker services are running:

```bash
# Check all services are healthy
docker compose ps

# Restart services if needed
docker compose restart

# Run tests after services are up
cd packages/backend
bun test src/infrastructure/__tests__/
```

## 📝 License

This project is private and proprietary.

## 👥 Contributors

- Your Team

---

## 📊 Current Progress

**Completed Steps:**

- ✅ **Step 01**: Monorepo setup with Turborepo, Docker, Git hooks
- ✅ **Step 01.5**: Shared package with event types, queue configuration, EventBuilder
- ✅ **Step 02**: Database setup with Prisma, Clean Architecture, seed data
- ✅ **Step 02.5**: Redis & RabbitMQ setup with Application layer ports and Infrastructure adapters
- ✅ **Step 03**: Complete Backend API implementation with caching and event publishing

**Current Status:**

- **Backend Package**: Domain + Application + Infrastructure + Presentation layers complete
  - ✅ Clean Architecture (Domain + Application + Infrastructure + Presentation layers)
  - ✅ 13 folders in hierarchical structure
  - ✅ 11 files distributed across folders
  - ✅ Repository pattern with full CRUD operations
  - ✅ Redis cache with TTL strategies
  - ✅ RabbitMQ event publishing with topic-based routing
  - ✅ 102 tests passing in backend (229 assertions) + 60 tests in shared package
  - ✅ 19 API endpoints (folders, files, search)
  - ✅ FolderService & FileService with cache + events integration
  - ✅ Error handler & CORS middlewares
  - ✅ Complete Elysia server with documentation
  - ✅ Build system working (Turbo + Bun)
  - ✅ Comprehensive JSDoc documentation
  - ✅ Git hooks configured (pre-commit & pre-push)

- **Worker Package**: Background processing and event consumption complete
  - ✅ Event-driven architecture with RabbitMQ consumption
  - ✅ Folder, File, Cache, and Search consumers
  - ✅ FolderProcessor, SearchIndexer, and CacheWarmer processors
  - ✅ Cache invalidation and warming capabilities
  - ✅ Search indexing for fast searching
  - ✅ Graceful shutdown and error handling
  - ✅ Docker configuration for deployment

- **Frontend Package**: Complete user interface with file management capabilities
  - ✅ Folder tree view with expand/collapse functionality
  - ✅ File list with preview and download capabilities
  - ✅ Context menu with folder/file operations
  - ✅ Drag and drop for moving items
  - ✅ Search functionality across folders and files
  - ✅ File upload with progress tracking
  - ✅ File preview modal for supported formats (PDF, images, text, video, audio)
  - ✅ Direct download for unsupported file types
  - ✅ Comprehensive inline documentation for all components
  - ✅ Full TypeScript support with type safety
  - ✅ Responsive design and modern UI

**Latest Implementation (Step 04 - Frontend App):**

- **Components**: Complete Vue 3 component architecture (FolderTree, FolderList, FilePreview, FileUpload, etc.)
- **File Operations**: Preview for supported formats + download for others
- **User Interface**: Tree view, file list, context menus, drag and drop
- **Technical Implementation**: TypeScript, composables, responsive design
- **Documentation**: Comprehensive inline documentation for all frontend code

**Backend & Infrastructure Integration (Steps 02.5, 03 & 03.5):**

- **Application Ports**: CachePort and EventPublisherPort interfaces
- **Redis Infrastructure**:
  - RedisCacheAdapter implementing CachePort with ioredis
  - Cache configuration with TTL strategies for different data types
  - 35 infrastructure integration tests (20 Redis tests)
- **RabbitMQ Infrastructure**:
  - RabbitMQEventPublisher implementing EventPublisherPort
  - Topic-based routing with 4 exchanges and 8 queues
  - 35 infrastructure integration tests (15 RabbitMQ tests)
- **Worker Service**:
  - Separate microservice for background tasks
  - Event consumption and processing capabilities
  - Cache management and search indexing
  - Docker containerization
- **API Development**:
  - 19 complete endpoints for folders, files, and search functionality
  - Full CRUD operations with caching and event publishing
  - 102 tests passing (229 assertions) + 60 tests in shared package

- **File/Project Statistics**:
  - Backend: 23 files created, 4 modified, 3,550 lines added in Steps 02.5 & 03
  - Worker: Additional files created in Step 03.5
  - Frontend: 38 files created in Step 04 (components, composables, services, types)
- **Testing**: All lint checks passed, all CI checks passed (build + test)

---

## 🌐 Frontend Features

The frontend application now includes the following features:

### File Management

- **Tree View**: Hierarchical folder structure with expand/collapse functionality
- **File List**: Display of files in each folder with size information
- **Context Menu**: Right-click context menu with options for folders and files
- **Drag and Drop**: Move folders and files between locations

### File Preview & Download

- **Preview Modal**: Popup modal for previewing supported file types
- **Supported Formats**: PDF, images (JPG, PNG, GIF, etc.), text files (TXT, MD, JSON, etc.), videos, and audio files
- **Download Fallback**: Direct download for unsupported file types
- **Progress Tracking**: File upload progress indicators

### Search & Navigation

- **Global Search**: Search across all folders and files
- **Folder Creation**: Create new folders in any location
- **File Upload**: Drag and drop or browse to upload files

### Technical Implementation

- **Vue 3 Composition API**: Modern component architecture
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Responsive Design**: Works on different screen sizes
- **Component Architecture**: Modular, reusable components

## 🏗️ Backend API

The backend API provides the following endpoints:

### Folder Management

- `GET /api/v1/folders/tree` - Retrieve complete folder tree
- `GET /api/v1/folders/{id}/children` - Get subfolders and files in a folder
- `POST /api/v1/folders` - Create new folder
- `PATCH /api/v1/folders/{id}/move` - Move folder to new location
- `DELETE /api/v1/folders/{id}` - Delete folder

### File Management

- `GET /api/v1/files/{id}/preview` - Preview file content (for supported types)
- `GET /api/v1/files/{id}/download` - Download file
- `POST /api/v1/files/upload` - Upload file to a folder
- `PATCH /api/v1/files/{id}/move` - Move file to new location
- `DELETE /api/v1/files/{id}` - Delete file

### Search

- `GET /api/v1/search?q={query}` - Search across all folders and files
