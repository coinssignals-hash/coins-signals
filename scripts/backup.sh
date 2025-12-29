#!/bin/bash

# ============================================
# 🗄️ MongoDB Backup Script - Economic News App
# ============================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración por defecto
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-economic_news}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_${MONGO_DB}_${TIMESTAMP}"

# Cargar variables de .env si existe
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    if [ ! -z "$MONGODB_URL" ]; then
        # Extraer host y puerto de la URL
        MONGO_HOST=$(echo $MONGODB_URL | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
        MONGO_PORT=$(echo $MONGODB_URL | sed -n 's/.*:\([0-9]*\).*/\1/p')
    fi
fi

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║      MongoDB Backup - Economic News        ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar mongodump
echo -e "${BLUE}🔍 Verificando herramientas...${NC}"
if ! command -v mongodump &> /dev/null; then
    echo -e "${RED}❌ mongodump no está instalado.${NC}"
    echo ""
    echo "Instálalo con:"
    echo "  Ubuntu/Debian: sudo apt-get install mongodb-database-tools"
    echo "  macOS: brew install mongodb-database-tools"
    echo "  O descarga de: https://www.mongodb.com/try/download/database-tools"
    exit 1
fi
echo -e "${GREEN}✓ mongodump encontrado${NC}"

# Crear directorio de backups
echo -e "${BLUE}📁 Preparando directorio de backups...${NC}"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ Directorio: $BACKUP_DIR${NC}"

# Verificar conexión a MongoDB
echo -e "${BLUE}🔗 Verificando conexión a MongoDB...${NC}"
if command -v mongosh &> /dev/null; then
    if ! mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" --eval "db.adminCommand('ping')" --quiet 2>/dev/null; then
        echo -e "${YELLOW}⚠️  No se pudo conectar a MongoDB en $MONGO_HOST:$MONGO_PORT${NC}"
        echo -e "${YELLOW}   Intentando con Docker...${NC}"
        MONGO_HOST="localhost"
    fi
elif command -v mongo &> /dev/null; then
    if ! mongo --host "$MONGO_HOST" --port "$MONGO_PORT" --eval "db.adminCommand('ping')" --quiet 2>/dev/null; then
        echo -e "${YELLOW}⚠️  No se pudo conectar a MongoDB${NC}"
    fi
fi
echo -e "${GREEN}✓ Conexión verificada${NC}"

# Realizar backup
echo ""
echo -e "${BLUE}💾 Iniciando backup de '$MONGO_DB'...${NC}"
echo "   Host: $MONGO_HOST:$MONGO_PORT"
echo "   Destino: $BACKUP_DIR/$BACKUP_NAME"
echo ""

mongodump \
    --host="$MONGO_HOST" \
    --port="$MONGO_PORT" \
    --db="$MONGO_DB" \
    --out="$BACKUP_DIR/$BACKUP_NAME" \
    --gzip

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup completado${NC}"
else
    echo -e "${RED}❌ Error durante el backup${NC}"
    exit 1
fi

# Comprimir backup
echo ""
echo -e "${BLUE}📦 Comprimiendo backup...${NC}"
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
cd - > /dev/null

BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
echo -e "${GREEN}✓ Backup comprimido: ${BACKUP_NAME}.tar.gz ($BACKUP_SIZE)${NC}"

# Limpiar backups antiguos
echo ""
echo -e "${BLUE}🧹 Limpiando backups antiguos (>${RETENTION_DAYS} días)...${NC}"
DELETED=$(find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo -e "${GREEN}✓ $DELETED backup(s) antiguo(s) eliminado(s)${NC}"

# Listar backups existentes
echo ""
echo -e "${BLUE}📋 Backups disponibles:${NC}"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "   (ninguno)"

# Resumen
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════╗"
echo "║           ✓ Backup completado              ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "Archivo: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "Tamaño:  $BACKUP_SIZE"
echo ""
echo "Para restaurar:"
echo -e "  ${BLUE}./scripts/restore.sh $BACKUP_DIR/${BACKUP_NAME}.tar.gz${NC}"
echo ""
