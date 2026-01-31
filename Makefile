.PHONY: help up down build logs shell install dev build-prod

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start Vue container
	docker compose up -d

down: ## Stop Vue container
	docker compose down

build: ## Build Vue container
	docker compose build --no-cache

rebuild: down build up ## Rebuild and start container

logs: ## Show container logs
	docker compose logs -f vue

shell: ## Open shell in container
	docker compose exec vue sh

install: ## Install npm dependencies
	docker compose exec vue npm install

dev: up ## Start development server
	docker compose logs -f vue

build-prod: ## Build for production
	docker compose exec vue npm run build

type-check: ## Run TypeScript type checking
	docker compose exec vue npm run type-check

lint: ## Run ESLint
	docker compose exec vue npm run lint

status: ## Show container status
	docker compose ps
