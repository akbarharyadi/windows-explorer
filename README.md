# Window Explorer - File Management Web Application

A Windows Explorer-like web application built with modern technologies and Clean Architecture.

## 🏗️ Architecture

This project uses a **monorepo** structure with the following packages:

- **`packages/backend`** - Backend API service (Elysia + Bun)
- **`packages/worker`** - Background worker service for async processing
- **`packages/frontend`** - Frontend application (Vue 3)
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
│   ├── backend/              # Backend API service
│   │   └── src/
│   ├── worker/               # Background worker service
│   │   └── src/
│   ├── frontend/             # Frontend application
│   │   └── src/
│   └── shared/               # Shared types and utilities
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml        # Infrastructure services
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
- [Step 01.5: Shared Package - Event Types](./plan/01.5-shared-package-events.md)
- [Step 02: Database Setup](./plan/02-database-setup.md)
- [Step 02.5: Redis & RabbitMQ Setup](./plan/02.5-rabbitmq-clean-architecture.md)
- [Step 03: Backend API](./plan/03-backend-api.md)
- [Step 03.5: Worker Microservice](./plan/03.5-worker-microservice.md)
- [Step 04: Frontend App](./plan/04-frontend-app.md)
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

## 📝 License

This project is private and proprietary.

## 👥 Contributors

- Your Team

---

**Status**: ✅ Step 01 Complete - Monorepo setup with Docker and Git hooks configured
**Next Step**: Implement [Step 01.5 - Shared Package Event Types](./plan/01.5-shared-package-events.md)
