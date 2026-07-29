# CLAUDE.md — Pinca Backend (NestJS)

> Fuente de verdad para cualquier Claude que retome este repo. El historial de sesiones **detallado** (incluida buena parte del trabajo hecho sobre este backend) vive en `pinca_frontend/CLAUDE.md` — este archivo es el que faltaba acá mismo, con el estado actual + su propio historial de sesiones desde hoy en adelante.
>
> Para guías de arquitectura/patrones más profundas, ver `GUIA_NESTJS_PINCA.md` (contrato JWT/RBAC, estructura de módulos).

## 1. Estado actual (snapshot 2026-07-29)

**Proyecto**: PINCA (Pinturas Industriales del Caribe S.A.S) — API del ERP.
**Stack**: NestJS 11 + TypeORM 0.3 (`synchronize: false`, SQL mayormente crudo vía `dataSource.query`) + MySQL 8 + Passport-JWT + class-validator + Joi (validación de env) + Helmet + `@nestjs/schedule` (cron).

**Migración CI4→NestJS: 100% completa.** No queda nada corriendo en CodeIgniter 4 — el stack unificado `pinca-erp` (ver §3) es NestJS sirviendo API + frontend estático + `/uploads`. El README y partes de `GUIA_NESTJS_PINCA.md` todavía describen la fase de convivencia con CI4 ("Fase 0/1", "strangler fig") — **está desactualizado**, no confiar en esas secciones para el estado actual.

40 módulos en `src/modules/` (uno por dominio: `auth`, `usuarios`, `bodegas`, `catalogo`, `item`, `item-proveedor`, `inventario`, `bodega-inventario`, `formulaciones`, `formulaciones-costos`, `preparaciones`, `costos`, `costos-produccion`, `cotizaciones`, `remisiones`, `facturas`, `notas-credito`, `pagos-cliente`, `cartera`, `gestiones-cobro`, `clientes`, `proveedores`, `ordenes-compra`, `requisiciones`, `instalaciones`, `categorias`, `unidades`, `numeracion`, `configuracion`, `empresa`, `permisos`, `sincronizacion`, `trazabilidad`, `dashboard`, `salud-sistema`, `notificaciones`, `auditoria`, `search`, `comparador`, `nomina`, `facturacion-electronica`).

**`facturacion-electronica` (nuevo, 2026-07-29, EN EVALUACIÓN — no confundir con `facturas`)**: cliente de la API de **Factus** (proveedor de facturación electrónica DIAN en evaluación). Módulo **aislado**: no toca la tabla `facturas` ni ningún otro módulo real — es un harness admin-only para seguir probando el sandbox del proveedor. Ver detalle en el historial de sesión (§7, 2026-07-29).

## 2. Comandos

```bash
npm run start:dev    # watch mode (NO recompila sobre /mnt/c en Docker — ver §4)
npm run build         # nest build → dist/
npm run typecheck     # tsc --noEmit
npm run lint          # eslint --fix
npm test              # jest (unit)
npm run test:e2e       # supertest
```

**Tests golden** (`test/*.mjs`, 35 archivos): comparaban Nest vs CI4 durante la migración. **CI4 ya no existe** → esa comparación quedó obsoleta. El método de validación actual es funcional directo sobre Nest corriendo en Docker (mintear un JWT, `curl` contra los endpoints, limpiar fixtures). Ver receta en §5.

## 3. Docker — stack unificado `pinca-erp`

```bash
cd pinca_backend_nest
docker compose up -d          # levanta TODO: db + api + phpMyAdmin
```

| Contenedor | Qué es |
|---|---|
| `pinca-erp-api` | Nest — sirve `/api/*`, el frontend estático (build de `pinca_frontend/dist`, Opción A) y `/uploads` |
| `pinca-erp-db` | MySQL 8, volumen `pinca_db_data` (persistente, **nunca** `down -v`) |
| `pinca-erp-pma` | phpMyAdmin en `:8081` |

- API: `http://localhost:3009/api` (puerto fijo, no el 3000 default de Nest).
- ⚠️ **El watch de `start:dev` NO recompila al editar desde el host** si el proyecto vive en `/mnt/c/...` (drvfs no dispara inotify). Después de tocar `src/`, hay que `docker restart pinca-erp-api` y esperar ~40s a que recompile.
- ⚠️ Cualquier `npm install <pkg>` nuevo debe ir seguido de `docker compose build api` — si no, un futuro `up` sin rebuild pierde la dependencia (ya pasó una vez con `helmet`/`@nestjs/schedule`).
- IA (clasificador químico en `sincronizacion`): **OpenRouter primario** (`OPENROUTER_API_KEY` + `OPENROUTER_MODEL`, default `google/gemini-2.5-flash`), Gemini/Anthropic como respaldo. Todo en `pinca_backend_nest/.env` (no versionado).

## 4. Patrones de código establecidos

- **Nada de ORM "mágico" para queries de negocio** — casi todo es `this.dataSource.query('SELECT ... WHERE id = ?', [id])` con placeholders `?` (nunca interpolación de strings en valores — auditado, cero SQL injection en toda la base).
- **Transacciones** (`dataSource.transaction(async (m) => {...})`) + `FOR UPDATE` en cualquier flujo que lockee saldo/stock/folios concurrentes (facturas, pagos, capas de inventario, numeración).
- **Shape de respuesta uniforme**: éxito `{ok:true, ...}` (via `ApiResponse`/`ResponseInterceptor`), error `{ok:false, msg}` (via `HttpExceptionFilter`). Un puñado de endpoints viejos (`login`, `refresh`, `me`) usan `apiSuccessFlat` (top-level, sin el wrapper) por compatibilidad con el frontend.
- **RBAC**: `JwtAuthGuard` global + `RolesGuard` (`@Roles('admin')` a nivel de clase o método) + `VisorReadonlyGuard` (rol `visor` = solo lectura en TODO, sin excepción por módulo). Un controller entero puede quedar admin-only con un solo `@Roles('admin')` en la clase (ej. `nomina`).
- **Paginación server-side opcional y retrocompatible**: `findAll(query)` sin `?page` devuelve el array completo de siempre; con `?page=&limit=` devuelve `{data, meta:{total,page,limit,pages}, stats}`. Ya aplicado a facturas/cotizaciones/remisiones/OC/catálogo/item_proveedor/producción/pagos/clientes/proveedores/sincronización/cartera. Molde a seguir si se agrega paginación a un recurso nuevo.
- **DTOs con `class-validator`** + `ValidationPipe` global (transforma errores al shape `{msg, errors:{campo:mensaje}}` que espera el frontend).

## 5. Receta para probar endpoints en runtime (Docker)

```bash
# 1) Verificar que el contenedor esté arriba y sano
curl -s http://127.0.0.1:3009/api/health   # {"ok":true,"db":true,...}

# 2) Mintear un JWT admin (el payload va ANIDADO bajo "data")
docker exec pinca-erp-api node -e '
  const jwt=require("jsonwebtoken");
  const n=Math.floor(Date.now()/1000);
  process.stdout.write(jwt.sign(
    {iat:n, exp:n+3600, data:{id:2, username:"root", nombre:"root", rol:"admin", modulos:[], token_version:1}},
    process.env.TOKEN_SECRET, {algorithm:"HS256"}
  ))'

# 3) Probar
curl -s http://127.0.0.1:3009/api/<recurso> -H "Authorization: Bearer <TOKEN>"
```

- `id`/`username` deben existir en `usuarios` (columna real es `id_usuarios`, no `id`) y el `token_version` del payload debe matchear el de la fila (si no, 401).
- Para probar mutaciones, marcar los datos de prueba con un prefijo reconocible (`__TEST__`) e insertarlos/borrarlos con `docker exec pinca-erp-db mysql -uroot -ppassword gestorpincadb -e "..."`. Verificar conteos antes/después para confirmar cero residuo.
- Tras editar código: `docker restart pinca-erp-api` (no watch, ver §3) + esperar el health-check antes de pegarle.

## 6. Pendientes conocidos (no bloqueantes)

- **Tipos inconsistentes en algunos SELECT**: columnas `DECIMAL` vuelven como **string** desde `mysql2`/TypeORM raw query (ej. `dias_trabajados`, `salario_base`, `monto`), mientras que valores calculados en JS (ej. `total_saldo` en `nomina.getPeriodo`) vuelven como **number**. El mismo campo (`total_saldo`) es string en `GET /nomina/periodos` (SQL `SUM()`) y number en `GET /nomina/periodos/:id` (calculado en JS). El frontend ya castea con `Number(...)` defensivamente en todos lados, así que no es un bug activo — pero vale unificar si se toca ese service.
- **README.md y partes de GUIA_NESTJS_PINCA.md describen la Fase 0 de convivencia con CI4** — desactualizado post-migración-completa. Actualizar si alguien se confunde con esto.
- Rotar `GEMINI_API_KEY` (sigue en claro en `.env`, decisión pendiente del usuario — no es bloqueante mientras OpenRouter sea el proveedor primario).

---

## 7. Historial de sesiones

### 2026-07-28 — Auditoría de endpoints `/nomina` (sin cambios de código)

Sesión pedida desde el lado frontend (ver `pinca_frontend/CLAUDE.md` de la misma fecha para el detalle completo de la sesión — ahí se rediseñó la vista de liquidación, se agregó un comprobante de pago en PDF, y se reorganizó el sidebar).

**Alcance acá**: probar los 16 endpoints de `NominaController` uno por uno contra el backend corriendo en Docker (JWT real, datos marcados `__TEST__`, limpieza al final). **Resultado: los 16 OK**, incluidos los guard-rails de estado:

- CRUD empleados (crear/listar/obtener/actualizar/archivar) ✓
- Descuentos comerciales (registrar/listar por empleado/listar todos) ✓ — confirmado que se auto-aplican contra el saldo pendiente al generar el siguiente período
- CRUD períodos (crear/listar/obtener/cerrar/pagar/eliminar) ✓
- Ajustar días (`PUT /detalle/:id`, solo en borrador) ✓
- Abono parcial + pago masivo (`POST /detalle/:id/abonos`, `PATCH /periodos/:id/pagar`) ✓ — probé la combinación completa (abono parcial → pago del resto), transición borrador→cerrada→pagada correcta
- Guard-rails: cerrar dos veces (400), pagar/abonar antes de cerrar (400), ajustar días después de cerrado (400), eliminar período no-borrador (400), período inexistente (404) — todos responden con el status y mensaje esperado

**Único hallazgo** (documentado en §6): inconsistencia de tipo en `total_saldo` entre `listarPeriodos` (string) y `getPeriodo` (number). No es un bug activo, el frontend ya lo castea.

**Cero cambios de código en este repo** — la sesión fue 100% de verificación. Todos los datos de prueba (`__TEST__`) fueron insertados y borrados via SQL directo, conteos verificados antes/después (0 residuo).

**Este CLAUDE.md fue creado hoy** — antes no existía en este repo (el historial pre-2026-07-28 de trabajo hecho sobre este backend vive en `pinca_frontend/CLAUDE.md`, secciones §15 en adelante).

### 2026-07-29 — Facturación electrónica DIAN: evaluación de Factus (Fase 0 + módulo aislado)

Un proveedor de facturación electrónica (**Factus**, `factus.com.co`) mandó credenciales de sandbox v2 para evaluar integración. Sesión de **exploración + harness de prueba**, SIN tocar `facturas` ni ningún módulo real (decisión explícita del usuario: "nada todavía" hasta terminar de evaluar).

**Fase 0 (manual, contra el sandbox real, sin código)**:
- Auth OAuth2 "password grant" (Laravel Passport): `POST /oauth/token` form-urlencoded `grant_type=password + client_id/secret + username/password` → `access_token` (1h) + `refresh_token`.
- El sandbox (`sandboxv2@factus.com.co`) es una cuenta **genérica compartida** entre todos los que evalúan el proveedor (empresa "FACTUS V2", NIT `1000789002`, San Gil-Santander) — NO es privada de PINCA. Ya trae 6 rangos de numeración precargados (Factura de Venta id=389 prefijo `SETP` resol. `18760000001` vigente hasta 2030, Documento Soporte id=2058, 2×Nota Crédito, Nota Débito, Nota de Ajuste).
- **Creé y validé una factura de prueba con datos ficticios** usando `unit_measure_code:"94"` (otra unidad) y `standard_code:"999"` (sin clasificar) como fallback — **el DIAN la validó igual**, con CUFE real, QR y PDF/XML descargables. Esto baja mucho el costo estimado de mapear el catálogo de PINCA a códigos UNSPSC reales para un MVP.
- Confirmado con un request roto a propósito: un **422 (error de formato) NO consume el consecutivo** del rango de numeración — seguro reintentar tras corregir. Un documento con `is_validated:true` puede traer avisos DIAN no bloqueantes en `data.errors` (ej. "NIT no coincide con RUT") — no es un fallo real, hay que leer `is_validated`/status HTTP, no "si `errors` viene vacío".
- Analizada la colección Postman oficial (67 requests) que el proveedor mandó por separado: la API cubre bastante más que facturas de venta — notas crédito/débito, **documento soporte** (autofactura para compras a proveedores no obligados a facturar — aplica al lado de `ordenes-compra`/`proveedores`, no solo ventas), lookup de adquirente por NIT contra DIAN (`/v2/dian/acquirer`, en sandbox devuelve datos mock), y **nómina electrónica DIAN** (`/v2/payrolls/*` — es una obligación legal DISTINTA del módulo `Nomina` interno de PINCA, que solo liquida/paga; no confundir ni mezclar alcance sin pedido explícito).

**Módulo nuevo `facturacion-electronica`** (aislado, admin-only vía `@Roles('admin')` a nivel de clase, igual que `nomina`):
- `factus.service.ts` — maneja el ciclo de vida del token (login password-grant, cache en memoria con buffer de 60s, `refresh_token` antes de re-loguear, reintento automático de 1 vez si un request da 401), wrapper `request()` que traduce errores 4xx de Factus (incl. el detalle campo-por-campo de los 422) a `BadRequestException` — así el `HttpExceptionFilter` global los devuelve en el shape `{ok:false, msg}` de siempre.
- `dto/factura-electronica.dto.ts` — DTOs con class-validator para factura y nota crédito (`customer`, `items[]` con `taxes[]`, `payment_details[]` — este último **obligatorio**, Factus lo exige siempre aunque parezca opcional a simple vista).
- `facturacion-electronica.controller.ts` — endpoints de prueba: `GET empresa`, `GET rangos-numeracion`, `POST facturas` (crea+valida), `GET facturas/:number`, `GET facturas/:number/pdf` y `/xml` (devuelven el **binario real** con `Content-Type` correcto, no el JSON en base64 que entrega Factus — se decodifica en el service), `POST notas-credito`, `GET notas-credito/:number`.
- Config: `FACTUS_*` en `.env` (mismo patrón que `OPENROUTER_*` — no está en el schema Joi porque es opcional/en evaluación) + pasadas en `docker-compose.yml`. IDs de rango de numeración del sandbox como default (`FACTUS_NUMBERING_RANGE_FACTURA=389`, `FACTUS_NUMBERING_RANGE_NOTA_CREDITO=390`), overrideables por request.

**Validado en runtime (Docker, `pinca-erp-api`)**: los 3 endpoints de lectura + crear factura + descargar PDF (`application/pdf` real, no JSON) + descargar XML (UBL 2.0 válido) — todos probados con JWT admin real contra el módulo ya wireado en `app.module.ts`, no contra scripts sueltos. Un bug propio detectado y corregido en el camino: el campo interno `_httpStatus` que usaba para pasar el status HTTP junto al JSON se filtraba en la respuesta al frontend — `fetchJson()` ahora devuelve `{status, json}` en vez de mutar el JSON.

**Pendiente** (explícitamente diferido por el usuario): NO tocar/ocultar el módulo `facturas` interno hasta terminar de probar Factus de punta a punta. Próximos pasos cuando se retome: cerrar los gaps de datos reales en `clientes` (`identification_document_code`, `legal_organization_code`, `tribute_code`, `municipality_code` — hoy no existen en `Cliente` entity) antes de conectar esto al flujo real de `facturas`.
