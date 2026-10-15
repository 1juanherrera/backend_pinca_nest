#!/usr/bin/env bash
set -euo pipefail

CONTAINER="${BACKUP_CONTAINER:-pinca-erp-db}"
PRODUCTION_DB="gestorpincadb"

if [[ $# -lt 2 ]]; then
  echo "Uso: $0 <archivo.sql.gz> <nombre_bd_destino>"
  echo "Ejemplo: $0 /opt/pinca-backups/gestorpincadb_2026-10-15.sql.gz pinca_test"
  exit 1
fi

DUMP_FILE="$1"
TARGET_DB="$2"

if [[ "${TARGET_DB}" == "${PRODUCTION_DB}" ]]; then
  echo "[ERROR] Restaurar directamente sobre '${PRODUCTION_DB}' (producción) está bloqueado."
  echo "        Usa un nombre de BD diferente para restaurar (ej: pinca_restore_test)."
  exit 1
fi

if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "[ERROR] Archivo no encontrado: ${DUMP_FILE}"
  exit 1
fi

echo "[$(date)] Creando BD '${TARGET_DB}' si no existe..."
docker exec "${CONTAINER}" sh -c \
  'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`'"${TARGET_DB}"'\`"'

echo "[$(date)] Restaurando ${DUMP_FILE} → ${TARGET_DB}..."
gunzip -c "${DUMP_FILE}" \
  | docker exec -i "${CONTAINER}" sh -c \
    'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "'"${TARGET_DB}"'"'

echo "[$(date)] Restauración completada en '${TARGET_DB}'."
echo "Para verificar: docker exec ${CONTAINER} sh -c 'mysql -u\"\$MYSQL_USER\" -p\"\$MYSQL_PASSWORD\" ${TARGET_DB} -e \"SHOW TABLES\"'"
