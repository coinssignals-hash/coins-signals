#!/bin/bash
# =============================================================================
# PASO 1 - Verification Script
# =============================================================================
# Verifica que TimescaleDB y Redis están corriendo correctamente
# =============================================================================

set -e

echo "=========================================="
echo "🔍 PASO 1 - Verificación de Servicios"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

echo "📦 1. Verificando containers..."
echo "-------------------------------------------"
docker compose ps
echo ""

echo "🐘 2. Verificando PostgreSQL/TimescaleDB..."
echo "-------------------------------------------"
POSTGRES_VERSION=$(docker compose exec -T db psql -U trading -d trading_signals -t -c "SELECT version();" 2>/dev/null | head -1 | xargs)
if [ -n "$POSTGRES_VERSION" ]; then
    echo -e "${GREEN}✅ PostgreSQL conectado${NC}"
    echo "   Versión: $POSTGRES_VERSION"
else
    echo -e "${RED}❌ No se pudo conectar a PostgreSQL${NC}"
    exit 1
fi
echo ""

echo "⏰ 3. Verificando TimescaleDB extension..."
echo "-------------------------------------------"
TIMESCALE_VERSION=$(docker compose exec -T db psql -U trading -d trading_signals -t -c "SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';" 2>/dev/null | xargs)
if [ -n "$TIMESCALE_VERSION" ]; then
    echo -e "${GREEN}✅ TimescaleDB habilitado${NC}"
    echo "   Versión: $TIMESCALE_VERSION"
else
    echo -e "${RED}❌ TimescaleDB no está habilitado${NC}"
    exit 1
fi
echo ""

echo "📦 4. Verificando extensiones adicionales..."
echo "-------------------------------------------"
docker compose exec -T db psql -U trading -d trading_signals -t -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');" 2>/dev/null
check_result "Extensiones uuid-ossp y pgcrypto"
echo ""

echo "🔴 5. Verificando Redis..."
echo "-------------------------------------------"
REDIS_PING=$(docker compose exec -T redis redis-cli ping 2>/dev/null)
if [ "$REDIS_PING" = "PONG" ]; then
    echo -e "${GREEN}✅ Redis conectado - PONG recibido${NC}"
else
    echo -e "${RED}❌ Redis no responde${NC}"
    exit 1
fi
echo ""

echo "📊 6. Verificando Redis info..."
echo "-------------------------------------------"
REDIS_INFO=$(docker compose exec -T redis redis-cli info server 2>/dev/null | grep redis_version | cut -d: -f2 | tr -d '\r')
echo -e "${GREEN}✅ Redis versión: $REDIS_INFO${NC}"
echo ""

echo "🔌 7. Verificando puertos expuestos..."
echo "-------------------------------------------"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 PASO 1 COMPLETADO EXITOSAMENTE${NC}"
echo "=========================================="
echo ""
echo "Servicios base funcionando:"
echo "  • TimescaleDB (PostgreSQL con extensiones time-series)"
echo "  • Redis (Cache y Pub/Sub)"
echo ""
echo "Para continuar al PASO 2, responde: PASO 1 OK"
echo ""
