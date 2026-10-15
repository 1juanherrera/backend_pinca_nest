# Backups — PINCA ERP

## Resumen

- **Qué**: dump completo de `gestorpincadb` (estructura + datos + rutinas/triggers/eventos)
- **Dónde**: `/opt/pinca-backups/` en el servidor + opcionalmente GCS
- **Cuándo**: cron diario a las 2:00 AM
- **Retención local**: 7 días (configurable con `BACKUP_RETENTION_DAYS`)
- **Retención GCS**: 30 días automático via lifecycle rule del bucket

## Setup rápido

### 1. Hacer el script ejecutable

```bash
chmod +x deploy/backup/backup.sh deploy/backup/restore.sh
```

### 2. Configurar el cron

```bash
crontab -e
# Agregar esta línea:
0 2 * * * /ruta/al/proyecto/deploy/backup/backup.sh >> /var/log/pinca-backup.log 2>&1
```

### 3. Variables de entorno (opcionales)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `BACKUP_CONTAINER` | `pinca-erp-db` | Nombre del contenedor MySQL |
| `BACKUP_DB` | `gestorpincadb` | Base de datos a respaldar |
| `BACKUP_LOCAL_DIR` | `/opt/pinca-backups` | Directorio local de destino |
| `BACKUP_RETENTION_DAYS` | `7` | Días de retención local |
| `BACKUP_MIN_SIZE` | `102400` | Tamaño mínimo válido (bytes) |
| `GCS_BACKUP_BUCKET` | _(vacío = sin GCS)_ | Bucket de Google Cloud Storage |
| `N8N_BACKUP_WEBHOOK_URL` | _(vacío = sin alerta)_ | Webhook para alertar si falla |

### 4. GCS (cuando se configure)

```bash
# Crear bucket
gcloud storage buckets create gs://pinca-backups-prod --location=us-central1

# Service account con permisos mínimos (solo crear objetos, no borrar)
gcloud iam service-accounts create pinca-backup --display-name="PINCA Backup"
gcloud storage buckets add-iam-policy-binding gs://pinca-backups-prod \
  --member="serviceAccount:pinca-backup@PROJECT.iam.gserviceaccount.com" \
  --role="roles/storage.objectCreator"

# Lifecycle rule: borrar después de 30 días
cat > /tmp/lifecycle.json << 'EOF'
{
  "rule": [{
    "action": {"type": "Delete"},
    "condition": {"age": 30}
  }]
}
EOF
gcloud storage buckets update gs://pinca-backups-prod --lifecycle-file=/tmp/lifecycle.json

# Autenticar en el servidor
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/pinca-backup-key.json"
export GCS_BACKUP_BUCKET="pinca-backups-prod"
```

## Usuario MySQL dedicado para backups

En lugar de usar root o el usuario de la app, crear uno con permisos mínimos:

```sql
CREATE USER 'backup'@'%' IDENTIFIED BY '<contraseña-segura>';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER, PROCESS
  ON gestorpincadb.* TO 'backup'@'%';
FLUSH PRIVILEGES;
```

Luego ajustar las variables del contenedor o del script para usar este usuario.

## Restaurar un backup

```bash
# Restaurar en una BD de prueba (NUNCA directamente en gestorpincadb)
./deploy/backup/restore.sh /opt/pinca-backups/gestorpincadb_2026-10-15_020000.sql.gz pinca_restore_test
```

El script bloquea restauración directa sobre `gestorpincadb` por seguridad.

## Verificar que los backups funcionan

Hacer al menos una vez al mes:

```bash
# 1. Restaurar el backup más reciente en una BD de prueba
./deploy/backup/restore.sh /opt/pinca-backups/$(ls -t /opt/pinca-backups/*.sql.gz | head -1) pinca_verify

# 2. Comparar conteo de tablas
docker exec pinca-erp-db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" pinca_verify -e "
  SELECT TABLE_NAME, TABLE_ROWS
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = '\''pinca_verify'\''
  ORDER BY TABLE_NAME"'

# 3. Limpiar
docker exec pinca-erp-db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "DROP DATABASE pinca_verify"'
```
