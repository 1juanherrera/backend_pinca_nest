# PINCA Backend — NestJS (migración desde CodeIgniter 4)

Migración incremental (*strangler fig*) del backend de PINCA de **CodeIgniter 4 (PHP)** a **NestJS 11 (TypeScript)**. NestJS y CI4 conviven detrás del mismo proxy, apuntando a la **misma base MySQL**, y se migran módulos uno a uno sin downtime.

> 📖 **Leé `GUIA_NESTJS_PINCA.md`** antes de tocar código. Es la guía de mejores prácticas, el contrato JWT/RBAC exacto con CI4, y el orden de migración.

## Estado — Fase 0 (esqueleto + compatibilidad)

Ya implementado:
- ✅ Config tipada + validación de env (`@nestjs/config` + Joi). No arranca sin `TOKEN_SECRET`/DB.
- ✅ TypeORM sobre la BD existente (`synchronize: false` — no altera el schema).
- ✅ **Auth compatible con CI4**: `JwtStrategy` valida tokens HS256 con payload `data.*` + chequeo de `token_version` contra BD. Login sigue en CI4 por ahora.
- ✅ **RBAC**: `JwtAuthGuard` (global) + `VisorReadonlyGuard` (visor solo lectura) + `RolesGuard` (@Roles admin/superadmin).
- ✅ **Shapes compatibles con el frontend**: `ResponseInterceptor` (`{ok, msg, ...}`) + `HttpExceptionFilter` (`{ok:false, msg}`).
- ✅ `GET /api/health` público.
- ✅ **Módulo plantilla `unidades`** (CRUD end-to-end) — patrón a replicar.

## Requisitos
- Node 20+ (probado con Node 24)
- El stack de `pinca_backend` corriendo (aporta MySQL `gestor-pinca-db`)

## Setup local (sin Docker)

```bash
cd pinca_backend_nest
npm install
cp .env.example .env
# Editar .env: pegar el TOKEN_SECRET EXACTO de pinca_backend/.env
#   DB_HOST=127.0.0.1 si la BD está expuesta en localhost:3306
npm run start:dev
```

Probar:
```bash
curl http://localhost:3000/api/health
# Con un token real emitido por CI4 (login en el backend PHP):
curl http://localhost:3000/api/unidades -H "Authorization: Bearer <TOKEN_DE_CI4>"
```

## Setup con Docker (coexistencia)

```bash
# 1) Asegurate de que el stack CI4 esté arriba (crea la red y la BD)
cd ../pinca_backend && docker compose up -d

# 2) Verificá el nombre real de la red y ajustá docker-compose.yml si difiere
docker network ls | grep app-network

# 3) Exportá el TOKEN_SECRET (mismo que CI4) y levantá Nest
cd ../pinca_backend_nest
export TOKEN_SECRET=<el_mismo_de_ci4>
docker compose up -d
```

## Verificación de compatibilidad JWT (crítico)
1. Hacé login en el backend CI4 → obtenés un `token`.
2. Usá ese token contra Nest: `GET /api/unidades` debe responder 200.
3. Sin token → `401 {"ok":false,"msg":"Token no proporcionado"}` (idéntico a CI4).
4. Con un usuario `visor`, un `POST /api/unidades` → `403` (solo lectura).

## Scripts
| Comando | Qué hace |
|---|---|
| `npm run start:dev` | Dev con hot-reload |
| `npm run build` | Compila a `dist/` |
| `npm run typecheck` | `tsc --noEmit` (sin emitir) |
| `npm run lint` | ESLint + fix |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | Tests e2e (supertest) |

## Estructura
Ver `GUIA_NESTJS_PINCA.md §2`. Resumen: `src/config`, `src/database`, `src/common` (guards/interceptors/filters/decorators), `src/modules/<dominio>`.

## Próximo (Fase 1)
Migrar CRUDs simples replicando el módulo `unidades`: `categorias`, `bodegas`, `instalaciones`, `proveedores`, `clientes`. Para cada uno: generar la entidad (`typeorm-model-generator` o a mano verificando el schema), service, controller, DTOs, y **test de contrato** contra el JSON que devuelve CI4.
