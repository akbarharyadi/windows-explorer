.PHONY: help build up down restart logs clean seed

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-db: ## View database logs
	docker-compose logs -f postgres

clean: ## Remove all containers, volumes, and images
	docker-compose down -v
	docker system prune -af

seed: ## Seed database with sample data
	docker-compose exec backend bun run prisma:seed

migrate: ## Run database migrations
	docker-compose exec backend bunx prisma migrate deploy

studio: ## Open Prisma Studio
	docker-compose exec backend bunx prisma studio

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U window-explorer -d window-explorer_db

ps: ## Show running containers
	docker-compose ps

stats: ## Show container stats
	docker stats

health: ## Check health of all services
	@echo "Backend Health:"
	@curl -s http://localhost:3000/health | jq . || echo "Backend not responding"
	@echo "\nFrontend Health:"
	@curl -s http://localhost:8080/health.html || echo "Frontend not responding"