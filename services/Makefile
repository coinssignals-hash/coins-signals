# =============================================================================
# Trading Signals Platform - Makefile
# =============================================================================

.PHONY: help up down logs logs-db logs-redis ps clean rebuild db-shell redis-cli health

# Default target
help:
	@echo "╔══════════════════════════════════════════════════════════════════╗"
	@echo "║       Trading Signals Platform - Available Commands              ║"
	@echo "╠══════════════════════════════════════════════════════════════════╣"
	@echo "║  make up          - Start all services                           ║"
	@echo "║  make down        - Stop all services                            ║"
	@echo "║  make logs        - View all logs                                ║"
	@echo "║  make logs-db     - View database logs                           ║"
	@echo "║  make logs-redis  - View Redis logs                              ║"
	@echo "║  make ps          - Show running containers                      ║"
	@echo "║  make health      - Check health of services                     ║"
	@echo "║  make db-shell    - Open PostgreSQL shell                        ║"
	@echo "║  make redis-cli   - Open Redis CLI                               ║"
	@echo "║  make clean       - Remove all containers and volumes            ║"
	@echo "║  make rebuild     - Rebuild and restart all services             ║"
	@echo "╚══════════════════════════════════════════════════════════════════╝"

# Start services
up:
	@echo "🚀 Starting services..."
	docker compose up -d
	@echo "✅ Services started!"
	@make ps

# Stop services
down:
	@echo "🛑 Stopping services..."
	docker compose down
	@echo "✅ Services stopped!"

# View all logs
logs:
	docker compose logs -f

# View database logs
logs-db:
	docker compose logs -f db

# View Redis logs
logs-redis:
	docker compose logs -f redis

# Show running containers
ps:
	docker compose ps

# Check health of services
health:
	@echo "🔍 Checking services health..."
	@echo ""
	@echo "📦 PostgreSQL/TimescaleDB:"
	@docker compose exec -T db pg_isready -U trading -d trading_signals && echo "   ✅ PostgreSQL is ready" || echo "   ❌ PostgreSQL is not ready"
	@echo ""
	@echo "📦 Redis:"
	@docker compose exec -T redis redis-cli ping && echo "   ✅ Redis is ready" || echo "   ❌ Redis is not ready"
	@echo ""
	@echo "🔍 Checking TimescaleDB extension..."
	@docker compose exec -T db psql -U trading -d trading_signals -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'timescaledb';" 2>/dev/null || echo "   ⚠️  TimescaleDB extension check failed"

# Open PostgreSQL shell
db-shell:
	@echo "🔌 Connecting to PostgreSQL..."
	docker compose exec db psql -U trading -d trading_signals

# Open Redis CLI
redis-cli:
	@echo "🔌 Connecting to Redis..."
	docker compose exec redis redis-cli

# Remove all containers and volumes
clean:
	@echo "🧹 Cleaning up..."
	docker compose down -v --remove-orphans
	@echo "✅ Cleanup complete!"

# Rebuild and restart
rebuild:
	@echo "🔄 Rebuilding services..."
	docker compose down
	docker compose build --no-cache
	docker compose up -d
	@echo "✅ Services rebuilt and started!"
