# ============================
# 🎨 CONFIGURACIÓN Y COLORES
# ============================
RESET=\033[0m
BOLD=\033[1m
GREEN=\033[32m
BLUE=\033[34m
YELLOW=\033[33m
CYAN=\033[36m

# Runtime de contenedores — se ejecuta dentro de WSL (podman-machine-default)
CONTAINER=wsl -d podman-machine-default -- sudo podman
COMPOSE=wsl -d podman-machine-default -- sudo podman-compose \
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
up: ## Levanta todos los servicios
	$(COMPOSE) up -d

down: ## Baja todos los servicios
	$(COMPOSE) down

status: ## Muestra el estado de los contenedores
	$(COMPOSE) ps

logs-db: ## Logs de Postgres
	$(COMPOSE) logs -f $(DB_SERVICE)

logs-redis: ## Logs de Redis
	$(COMPOSE) logs -f $(REDIS_SERVICE)

restart-db: ## Reinicia Postgres
	$(COMPOSE) restart $(DB_SERVICE)

restart-redis: ## Reinicia Redis
	$(COMPOSE) restart $(REDIS_SERVICE)

psql: ## Entra al psql dentro del contenedor
	$(CONTAINER) exec -it postgres_db psql -U $$POSTGRES_USER -d $$POSTGRES_DB

redis-cli: ## Entra al CLI de Redis
	$(CONTAINER) exec -it redis_server redis-cli

reset-db: ## Resetea la base (drop + recreate)
	$(COMPOSE) down -v
	$(COMPOSE) up -d

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
