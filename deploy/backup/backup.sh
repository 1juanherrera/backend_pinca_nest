#!/usr/bin/env bash
set -euo pipefail

# — Configuración —
CONTAINER="${BACKUP_CONTAINER:-pinca-erp-db}"
DB_NAME="${BACKUP_DB:-gestorpincadb}"
LOCAL_DIR="${BACKUP_LOCAL_DIR:-/opt/pinca-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
MIN_SIZE_BYTES="${BACKUP_MIN_SIZE:-102400}"  # 100 KB
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
FILENAME="${DB_NAME}_${TIMESTAMP}.sql.gz"
FILEPATH="${LOCAL_DIR}/${FILENAME}"

# GCS (opcional — si no hay bucket configurado, solo backup local)
GCS_BUCKET="${GCS_BACKUP_BUCKET:-}"

# Webhook de alerta (opcional — n8n u otro)
ALERT_WEBHOOK="${N8N_BACKUP_WEBHOOK_URL:-}"

alert_failure() {
  local msg="$1"
  echo "[ERROR] ${msg}" >&2
  if [[ -n "${ALERT_WEBHOOK}" ]]; then
    curl -sf -X POST "${ALERT_WEBHOOK}" \
      -H 'Content-Type: application/json' \
      -d "{\"event\":\"backup_failed\",\"db\":\"${DB_NAME}\",\"timestamp\":\"${TIMESTAMP}\",\"error\":\"${msg}\"}" \
      || echo "[WARN] No se pudo enviar alerta al webhook" >&2
  fi
  exit 1
}

mkdir -p "${LOCAL_DIR}"

# — Dump —
echo "[$(date)] Iniciando backup de ${DB_NAME}..."

docker exec "${CONTAINER}" sh -c \
  'exec mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers --events "$1"' \
  -- "${DB_NAME}" \
  | gzip > "${FILEPATH}" \
  || alert_failure "mysqldump o gzip falló (exit $?)"

# — Validación de tamaño —
ACTUAL_SIZE=$(stat -c%s "${FILEPATH}" 2>/dev/null || stat -f%z "${FILEPATH}")
if (( ACTUAL_SIZE < MIN_SIZE_BYTES )); then
  alert_failure "Dump demasiado pequeño: ${ACTUAL_SIZE} bytes (mínimo ${MIN_SIZE_BYTES})"
fi

# — Validación de contenido —
if ! gunzip -c "${FILEPATH}" | tail -c 200 | grep -q 'Dump completed'; then
  alert_failure "El dump no termina en 'Dump completed' — posiblemente truncado"
fi

echo "[$(date)] Backup local OK: ${FILEPATH} (${ACTUAL_SIZE} bytes)"

# — Subir a GCS (si está configurado) —
if [[ -n "${GCS_BUCKET}" ]]; then
  gcloud storage cp "${FILEPATH}" "gs://${GCS_BUCKET}/${FILENAME}" \
    || alert_failure "Fallo al subir a GCS (gs://${GCS_BUCKET})"
  echo "[$(date)] Subido a gs://${GCS_BUCKET}/${FILENAME}"
fi

# — Limpieza local (conservar últimos N días) —
find "${LOCAL_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date)] Limpieza local: eliminados backups con más de ${RETENTION_DAYS} días"

echo "[$(date)] Backup completado exitosamente."
