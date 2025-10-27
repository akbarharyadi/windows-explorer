.PHONY: help build up down restart logs clean migrate migrate-dev generate-client studio seed shell-db dump-db restore-db ps stats health

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all infrastructure services
	docker-compose up -d

down: ## Stop all infrastructure services
	docker-compose down

restart: ## Restart all infrastructure services
	docker-compose restart

logs: ## View logs from all infrastructure services
	docker-compose logs -f

logs-db: ## View database logs
	docker-compose logs -f postgres

logs-redis: ## View Redis logs
	docker-compose logs -f redis

logs-rabbitmq: ## View RabbitMQ logs
	docker-compose logs -f rabbitmq

clean: ## Remove all containers, volumes, and images
	docker-compose down -v
	docker system prune -af

migrate: ## Run database migrations (requires backend code locally)
	cd packages/backend && bunx prisma migrate deploy

migrate-dev: ## Create new migration (requires backend code locally)
	cd packages/backend && bunx prisma migrate dev

generate-client: ## Generate Prisma client (requires backend code locally)
	cd packages/backend && bunx prisma generate

studio: ## Open Prisma Studio (requires backend code locally)
	cd packages/backend && bunx prisma studio

seed: ## Seed database with sample data (requires backend code locally)
	cd packages/backend && bun run prisma:seed

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U window-explorer -d window-explorer_db

dump-db: ## Create database backup
	docker-compose exec postgres pg_dump -U window-explorer window-explorer_db > backups/backup-$$(date +%Y%m%d-%H%M%S).sql

restore-db: ## Restore database from backup (specify file with BACKUP_FILE=filename)
	docker-compose exec -T postgres psql -U window-explorer window-explorer_db < $(BACKUP_FILE)

ps: ## Show running containers
	docker-compose ps

stats: ## Show container stats
	docker stats

health: ## Check health of all infrastructure services
	@echo "PostgreSQL Health:"
	@docker-compose exec postgres pg_isready -U window-explorer && echo "✅ Healthy" || echo "❌ Unhealthy"
	@echo ""
	@echo "Redis Health:"
	@docker-compose exec redis redis-cli ping && echo "✅ Healthy" || echo "❌ Unhealthy"
	@echo ""
	@echo "RabbitMQ Health:"
	@docker-compose exec rabbitmq rabbitmqctl status > /dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Unhealthy"