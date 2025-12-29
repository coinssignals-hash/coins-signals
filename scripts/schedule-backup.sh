#!/bin/bash

# ============================================
# ⏰ Scheduled Backup Setup - Cron Job
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"

echo "╔════════════════════════════════════════════╗"
echo "║   Configurar Backup Automático (Cron)      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Verificar que el script existe
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ No se encontró backup.sh en $SCRIPT_DIR"
    exit 1
fi

# Hacer ejecutable
chmod +x "$BACKUP_SCRIPT"

echo "Opciones de frecuencia:"
echo "  1) Cada hora"
echo "  2) Cada 6 horas"
echo "  3) Diario (medianoche)"
echo "  4) Semanal (domingo medianoche)"
echo ""
read -p "Selecciona una opción (1-4): " option

case $option in
    1) CRON_SCHEDULE="0 * * * *" ;;
    2) CRON_SCHEDULE="0 */6 * * *" ;;
    3) CRON_SCHEDULE="0 0 * * *" ;;
    4) CRON_SCHEDULE="0 0 * * 0" ;;
    *) echo "Opción inválida"; exit 1 ;;
esac

# Añadir al crontab
CRON_CMD="$CRON_SCHEDULE cd $(dirname $SCRIPT_DIR) && $BACKUP_SCRIPT >> ./backups/backup.log 2>&1"

# Verificar si ya existe
(crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT"; echo "$CRON_CMD") | crontab -

echo ""
echo "✓ Backup automático configurado"
echo "  Frecuencia: $CRON_SCHEDULE"
echo "  Script: $BACKUP_SCRIPT"
echo ""
echo "Para ver cron jobs activos:"
echo "  crontab -l"
echo ""
echo "Para eliminar el backup automático:"
echo "  crontab -e  (y elimina la línea del backup)"
echo ""
