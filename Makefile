# ============================
# 🎨 CONFIGURACIÓN Y COLORES
# ============================
RESET=\033[0m
BOLD=\033[1m
GREEN=\033[32m
BLUE=\033[34m
YELLOW=\033[33m
CYAN=\033[36m

# Runtimes de contenedores
DOCKER_CONTAINER=docker
DOCKER_COMPOSE=docker compose \
	--env-file $(CURDIR)/.env \
	-f $(CURDIR)/docker-compose.yml

PODMAN_CONTAINER=wsl -d podman-machine-default -- sudo podman
PODMAN_COMPOSE=wsl -d podman-machine-default -- sudo podman-compose \
	--env-file $(CURDIR)/.env \
	-f $(CURDIR)/docker-compose.yml

# Servicios
DB_SERVICE=postgres
PGADMIN_SERVICE=pgadmin
REDIS_SERVICE=redis

# ============================
# 📚 HELP AUTOMÁTICO
# ============================
help:
	@echo ""
	@echo "$(BOLD)Comandos disponibles:$(RESET)"
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*##/ { printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

# ============================
# 🐳 DOCKER
# ============================
docker-up: ## Levanta todos los servicios (Docker)
	$(DOCKER_COMPOSE) up -d

docker-down: ## Baja todos los servicios (Docker)
	$(DOCKER_COMPOSE) down

docker-status: ## Muestra el estado de los contenedores (Docker)
	$(DOCKER_COMPOSE) ps

docker-logs-db: ## Logs de Postgres (Docker)
	$(DOCKER_COMPOSE) logs -f $(DB_SERVICE)

docker-logs-redis: ## Logs de Redis (Docker)
	$(DOCKER_COMPOSE) logs -f $(REDIS_SERVICE)

docker-restart-db: ## Reinicia Postgres (Docker)
	$(DOCKER_COMPOSE) restart $(DB_SERVICE)

docker-restart-redis: ## Reinicia Redis (Docker)
	$(DOCKER_COMPOSE) restart $(REDIS_SERVICE)

docker-psql: ## Entra al psql dentro del contenedor (Docker)
	$(DOCKER_CONTAINER) exec -it postgres_db psql -U $$POSTGRES_USER -d $$POSTGRES_DB

docker-redis-cli: ## Entra al CLI de Redis (Docker)
	$(DOCKER_CONTAINER) exec -it redis_server redis-cli

docker-reset-db: ## Resetea la base (drop + recreate) (Docker)
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up -d

# ============================
# 🦭 PODMAN
# ============================
podman-up: ## Levanta todos los servicios (Podman/WSL)
	$(PODMAN_COMPOSE) up -d

podman-down: ## Baja todos los servicios (Podman/WSL)
	$(PODMAN_COMPOSE) down

podman-status: ## Muestra el estado de los contenedores (Podman/WSL)
	$(PODMAN_COMPOSE) ps

podman-logs-db: ## Logs de Postgres (Podman/WSL)
	$(PODMAN_COMPOSE) logs -f $(DB_SERVICE)

podman-logs-redis: ## Logs de Redis (Podman/WSL)
	$(PODMAN_COMPOSE) logs -f $(REDIS_SERVICE)

podman-restart-db: ## Reinicia Postgres (Podman/WSL)
	$(PODMAN_COMPOSE) restart $(DB_SERVICE)

podman-restart-redis: ## Reinicia Redis (Podman/WSL)
	$(PODMAN_COMPOSE) restart $(REDIS_SERVICE)

podman-psql: ## Entra al psql dentro del contenedor (Podman/WSL)
	$(PODMAN_CONTAINER) exec -it postgres_db psql -U $$POSTGRES_USER -d $$POSTGRES_DB

podman-redis-cli: ## Entra al CLI de Redis (Podman/WSL)
	$(PODMAN_CONTAINER) exec -it redis_server redis-cli

podman-reset-db: ## Resetea la base (drop + recreate) (Podman/WSL)
	$(PODMAN_COMPOSE) down -v
	$(PODMAN_COMPOSE) up -d

# ============================
# 🧬 PRISMA
# ============================
migrate-dev: ## Ejecuta migraciones en modo dev
	npx prisma migrate dev

migrate-prod: ## Ejecuta migraciones en producción
	npx prisma migrate deploy

prisma-studio: ## Abre Prisma Studio
	npx prisma studio

prisma-generate: ## Regenera el cliente de Prisma
	npx prisma generate

prisma-seed: ## Ejecuta el seed
	npx prisma db seed

# ============================
# 🚀 NESTJS
# ============================
start: ## Inicia NestJS en modo desarrollo
	npm run start:dev

build: ## Compila el proyecto
	npm run build

start-prod: ## Inicia NestJS compilado
	npm run start:prod

lint: ## Corre el linter
	npm run lint

test: ## Corre los tests
	npm run test

test-watch: ## Corre tests en watch mode
	npm run test:watch

# ============================
# 🧹 UTILIDADES
# ============================
clean-node: ## Borra node_modules y reinstala dependencias
	rm -rf node_modules
	npm install

clean-dist: ## Borra la carpeta dist
	rm -rf dist

doctor: ## Diagnóstico general del proyecto
	npx prisma doctor
