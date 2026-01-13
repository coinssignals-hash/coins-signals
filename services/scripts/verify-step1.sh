#!/bin/bash
# =============================================================================
# Trading Signals Platform - PASO 1 Verification Script
# =============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         PASO 1 - Verificación de Servicios Base                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

check() {
    local name=$1
    local cmd=$2
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ $name${NC}"
        ((FAIL++))
    fi
}

echo "🔍 Verificando contenedores..."
echo ""

check "Docker está instalado" "docker --version"
check "Docker Compose está instalado" "docker compose version"
check "Contenedor 'trading_signals_db' está corriendo" "docker ps | grep trading_signals_db"
check "Contenedor 'trading_signals_redis' está corriendo" "docker ps | grep trading_signals_redis"

echo ""
echo "🔍 Verificando conectividad..."
echo ""

check "PostgreSQL responde" "docker compose exec -T db pg_isready -U trading -d trading_signals"
check "Redis responde" "docker compose exec -T redis redis-cli ping | grep PONG"

echo ""
echo "🔍 Verificando TimescaleDB..."
echo ""

check "Extensión TimescaleDB instalada" "docker compose exec -T db psql -U trading -d trading_signals -c \"SELECT extname FROM pg_extension WHERE extname = 'timescaledb';\" | grep timescaledb"
check "Extensión uuid-ossp instalada" "docker compose exec -T db psql -U trading -d trading_signals -c \"SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp';\" | grep uuid-ossp"

echo ""
echo "🔍 Verificando volúmenes persistentes..."
echo ""

check "Volumen postgres_data existe" "docker volume ls | grep postgres_data"
check "Volumen redis_data existe" "docker volume ls | grep redis_data"

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 TODAS LAS VERIFICACIONES PASARON ($PASS/$PASS)${NC}"
    echo ""
    echo "Puedes responder: PASO 1 OK"
else
    echo -e "${RED}⚠️  ALGUNAS VERIFICACIONES FALLARON ($FAIL errores)${NC}"
    echo ""
    echo "Revisa los logs con: make logs"
fi

echo ""
