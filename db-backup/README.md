# db-backup — PINCA ERP

Backups completos (esquema + datos + rutinas/triggers/eventos) de la base de datos `gestorpincadb` del stack `pinca-erp` (NestJS unificado). Repo separado a propósito — los backups no van en el historial de `pinca_backend_nest` (esa carpeta `backups/` está en `.gitignore` ahí), para no ensuciar el repo de código con dumps pesados y poder clonar/traer solo la data a otra máquina.

## Archivos

| Archivo | Fecha | Notas |
|---|---|---|
| `gestorpincadb_2026-07-31.sql` | 2026-07-31 | 58/58 tablas, incluye datos + rutinas/triggers/eventos. Generado con `mysqldump --single-transaction --routines --triggers --events`. |

## Cómo se generó

```bash
docker exec pinca-erp-db mysqldump --single-transaction --routines --triggers --events \
  -uuser -ppassword gestorpincadb > gestorpincadb_<fecha>.sql
```

`--single-transaction` evita bloquear tablas InnoDB durante el dump (consistente sin parar el sistema). El warning `Access denied; ... PROCESS privilege ... tablespaces` es benigno — el usuario de la app no tiene ese privilegio global, mysqldump solo omite metadata de tablespaces que no hace falta para restaurar.

## Cómo importarla (PC personal)

Necesitás un MySQL 8 corriendo (por ejemplo, el mismo stack Docker `pinca-erp` de `pinca_backend_nest/docker-compose.yml`, o un MySQL local).

```bash
# Crear la base si no existe
mysql -uroot -p -e "CREATE DATABASE IF NOT EXISTS gestorpincadb CHARACTER SET utf8mb4;"

# Importar
mysql -uroot -p gestorpincadb < gestorpincadb_2026-07-31.sql
```

Si estás usando el Docker del proyecto:

```bash
docker exec -i pinca-erp-db mysql -uroot -ppassword gestorpincadb < gestorpincadb_2026-07-31.sql
```

## Credenciales de referencia (sandbox/dev, ver `.env` del backend para las reales)

- Usuario app: `user` / `password`
- Root: `password` (NO `rootpassword`, ver `pinca_backend_nest/CLAUDE.md`)
- DB: `gestorpincadb`

⚠️ Este repo va a contener datos reales de PINCA (clientes, proveedores, inventario, costos). Tratarlo como confidencial — no lo subas a un remoto público.
