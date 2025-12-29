#!/bin/bash

# ============================================
# 🔄 MongoDB Restore Script - Economic News App
# ============================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-economic_news}"

# Verificar argumentos
if [ -z "$1" ]; then
    echo -e "${RED}❌ Uso: $0 <archivo_backup.tar.gz>${NC}"
    echo ""
    echo "Backups disponibles:"
    ls -lh ./backups/*.tar.gz 2>/dev/null || echo "  (ninguno encontrado)"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Archivo no encontrado: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║     MongoDB Restore - Economic News        ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Advertencia
echo -e "${YELLOW}⚠️  ADVERTENCIA: Esto sobrescribirá la base de datos '$MONGO_DB'${NC}"
read -p "¿Estás seguro de continuar? (s/n): " confirm
if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "Operación cancelada."
    exit 0
fi

# Crear directorio temporal
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}📦 Extrayendo backup...${NC}"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Encontrar directorio del backup
BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "backup_*" | head -1)
if [ -z "$BACKUP_DIR" ]; then
    BACKUP_DIR="$TEMP_DIR"
fi

# Restaurar
echo -e "${BLUE}🔄 Restaurando base de datos...${NC}"
mongorestore \
    --host="$MONGO_HOST" \
    --port="$MONGO_PORT" \
    --db="$MONGO_DB" \
    --gzip \
    --drop \
    "$BACKUP_DIR/$MONGO_DB"

# Limpiar
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════╗"
echo "║         ✓ Restauración completada          ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"
