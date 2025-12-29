#!/bin/bash

# ============================================
# 🚀 Script de Inicialización - Economic News App
# ============================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║   Economic News App - Setup Wizard         ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar si .env ya existe
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  El archivo .env ya existe.${NC}"
    read -p "¿Deseas sobrescribirlo? (s/n): " overwrite
    if [ "$overwrite" != "s" ] && [ "$overwrite" != "S" ]; then
        echo -e "${GREEN}✓ Manteniendo configuración existente.${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}📝 Configuración de variables de entorno${NC}"
echo "----------------------------------------"

# API URL del backend
echo ""
read -p "URL del backend FastAPI [http://localhost:8000]: " API_URL
API_URL=${API_URL:-http://localhost:8000}

# Usar datos mock
echo ""
echo "¿Usar datos de prueba (mock) en lugar del backend real?"
read -p "Usar mock data (s/n) [n]: " USE_MOCK
if [ "$USE_MOCK" = "s" ] || [ "$USE_MOCK" = "S" ]; then
    USE_MOCK_DATA="true"
else
    USE_MOCK_DATA="false"
fi

# OpenAI API Key (para el backend)
echo ""
echo -e "${YELLOW}La API Key de OpenAI es necesaria para el análisis de noticias con IA.${NC}"
read -p "OpenAI API Key (dejar vacío para omitir): " OPENAI_KEY

# MongoDB URL
echo ""
read -p "MongoDB URL [mongodb://localhost:27017]: " MONGO_URL
MONGO_URL=${MONGO_URL:-mongodb://localhost:27017}

# Redis URL
echo ""
read -p "Redis URL [redis://localhost:6379]: " REDIS_URL
REDIS_URL=${REDIS_URL:-redis://localhost:6379}

# Crear archivo .env
echo ""
echo -e "${BLUE}📄 Creando archivo .env...${NC}"

cat > $ENV_FILE << EOF
# ============================================
# Economic News App - Variables de Entorno
# Generado automáticamente el $(date)
# ============================================

# Frontend Configuration
VITE_API_URL=$API_URL
VITE_USE_MOCK_DATA=$USE_MOCK_DATA

# Backend Configuration
OPENAI_API_KEY=$OPENAI_KEY
MONGODB_URL=$MONGO_URL
REDIS_URL=$REDIS_URL

# Environment
NODE_ENV=development
ENV=development
EOF

echo -e "${GREEN}✓ Archivo .env creado exitosamente${NC}"

# Verificar Docker
echo ""
echo -e "${BLUE}🐳 Verificando Docker...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker está instalado${NC}"
    docker --version
else
    echo -e "${YELLOW}⚠️  Docker no está instalado. Visita: https://docker.com/products/docker-desktop${NC}"
fi

# Verificar Node.js
echo ""
echo -e "${BLUE}📦 Verificando Node.js...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js está instalado${NC}"
    node --version
else
    echo -e "${YELLOW}⚠️  Node.js no está instalado. Visita: https://nodejs.org${NC}"
fi

# Preguntar si instalar dependencias
echo ""
read -p "¿Instalar dependencias del frontend ahora? (s/n): " install_deps
if [ "$install_deps" = "s" ] || [ "$install_deps" = "S" ]; then
    echo -e "${BLUE}📥 Instalando dependencias...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
fi

# Resumen
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════╗"
echo "║         ✓ Configuración completada         ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Próximos pasos:"
echo ""
echo "  1. Ejecutar solo frontend (con mock data):"
echo -e "     ${BLUE}npm run dev${NC}"
echo ""
echo "  2. Ejecutar con Docker (frontend + backend):"
echo -e "     ${BLUE}docker-compose up --build${NC}"
echo ""
echo "  3. Ver la aplicación:"
echo -e "     Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "     Backend:  ${BLUE}http://localhost:8000${NC}"
echo ""
