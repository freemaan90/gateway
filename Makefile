# Nombre de los servicios
DB_SERVICE=postgres
PGADMIN_SERVICE=pgadmin

# Levantar todo
up:
	docker compose up -d

# Frenar todo
down:
	docker compose down

# Ver estado
status:
	docker compose ps

# Logs de Postgres
logs-db:
	docker compose logs -f $(DB_SERVICE)

# Logs de pgAdmin
logs-pgadmin:
	docker compose logs -f $(PGADMIN_SERVICE)

# Reiniciar Postgres
restart-db:
	docker compose restart $(DB_SERVICE)

# Entrar al psql dentro del contenedor
psql:
	docker exec -it postgres_db psql -U $$POSTGRES_USER -d $$POSTGRES_DB

# Reset total de la base (drop + recreate)
reset-db:
	docker compose down -v
	docker compose up -d
