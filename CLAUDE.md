# CLAUDE.md — Pinca Backend (NestJS)

> Fuente de verdad para cualquier Claude que retome este repo. El historial de sesiones **detallado** (incluida buena parte del trabajo hecho sobre este backend) vive en `pinca_frontend/CLAUDE.md` — este archivo es el que faltaba acá mismo, con el estado actual + su propio historial de sesiones desde hoy en adelante.
>
> Para guías de arquitectura/patrones más profundas, ver `GUIA_NESTJS_PINCA.md` (contrato JWT/RBAC, estructura de módulos).

## 1. Estado actual (snapshot 2026-07-29)

**Proyecto**: PINCA (Pinturas Industriales del Caribe S.A.S) — API del ERP.
**Stack**: NestJS 11 + TypeORM 0.3 (`synchronize: false`, SQL mayormente crudo vía `dataSource.query`) + MySQL 8 + Passport-JWT + class-validator + Joi (validación de env) + Helmet + `@nestjs/schedule` (cron).

**Migración CI4→NestJS: 100% completa.** No queda nada corriendo en CodeIgniter 4 — el stack unificado `pinca-erp` (ver §3) es NestJS sirviendo API + frontend estático + `/uploads`. El README y partes de `GUIA_NESTJS_PINCA.md` todavía describen la fase de convivencia con CI4 ("Fase 0/1", "strangler fig") — **está desactualizado**, no confiar en esas secciones para el estado actual.

40 módulos en `src/modules/` (uno por dominio: `auth`, `usuarios`, `bodegas`, `catalogo`, `item`, `item-proveedor`, `inventario`, `bodega-inventario`, `formulaciones`, `formulaciones-costos`, `preparaciones`, `costos`, `costos-produccion`, `cotizaciones`, `remisiones`, `facturas`, `notas-credito`, `pagos-cliente`, `cartera`, `gestiones-cobro`, `clientes`, `proveedores`, `ordenes-compra`, `requisiciones`, `instalaciones`, `categorias`, `unidades`, `numeracion`, `configuracion`, `empresa`, `permisos`, `sincronizacion`, `trazabilidad`, `dashboard`, `salud-sistema`, `notificaciones`, `auditoria`, `search`, `comparador`, `nomina`, `facturacion-electronica`).

**`facturacion-electronica` (nuevo, 2026-07-29, EN EVALUACIÓN — no confundir con `facturas`)**: cliente de la API de **Factus** (proveedor de facturación electrónica DIAN en evaluación). Módulo **aislado**: no toca la tabla `facturas` ni ningún otro módulo real — es un harness admin-only para seguir probando el sandbox del proveedor. Desde 2026-07-30 incluye también `tirilla.service.ts` (ESC/POS, impresora térmica de red vía `node-thermal-printer`), ya que Factus no ofrece formato de tirilla, solo PDF de página completa. Ver detalle en el historial de sesión (§7, 2026-07-29 y 2026-07-30).

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

### 2026-07-30 — Logo en el PDF de Factus (bug de sandbox) + tirilla ESC/POS propia

Sesión de seguimiento a la evaluación de Factus. Dos preguntas del usuario: (1) si el PDF de Factus trae su logo o el de PINCA, y (2) si Factus también genera tirillas (recibo térmico) o solo el formato de página completa.

**Logo**: confirmado que SÍ es configurable — Factus expone `PUT /v2/companies` (razón social/NIT/dirección) y `POST /v2/companies/logo` (multipart, campo `image`, límite documentado 200KB). El sandbox usado es una cuenta **genérica compartida** con otros evaluadores del proveedor (no privada de PINCA) — se le avisó al usuario antes de tocarlo, autorizó proceder. Al intentar subir el logo real de PINCA (`public/uploads/empresa/logo_default.png`, reescalado a 250×250 con Pillow), **el endpoint devuelve `500 Internal Server Error` de forma consistente** — probado con el logo real (RGBA y RGB), con una imagen trivial de un solo color, y con dos clientes HTTP distintos (Node `fetch`/`FormData` y `curl -F`). Descartado que sea un problema de nuestro lado; parece un bug/caída del lado de Factus en ese endpoint del sandbox. `GET /v2/companies` confirma que no quedó ningún cambio a medias.

**Tirillas**: revisada toda la colección oficial de Factus (67 requests) — no existe ningún endpoint ni parámetro de formato para recibo térmico/tirilla, solo el PDF de página completa ya conocido. Si se necesita tirilla, hay que generarla nosotros a partir del JSON que ya devuelve `GET /v2/bills/:number`.

**Construido `tirilla.service.ts`** (nuevo, en el módulo `facturacion-electronica`): usa `node-thermal-printer` (agregado a `package.json`) para armar el layout ESC/POS (encabezado empresa, datos cliente, ítems con `tableCustom`, totales, CUFE, QR vía `printQR(d.links.qr)`, corte de papel) a partir del mismo JSON de `factus.service.ts`. `characterSet: PC858_EURO` para soportar tildes/ñ — sin verificar todavía contra el modelo real de impresora del cliente.

- Impresora asumida **en red** (TCP puerto 9100) — confirmado explícitamente por el usuario, no USB. Config nueva en `.env` y `docker-compose.yml`: `PRINTER_IP` (vacío por defecto = módulo de impresión deshabilitado con `BadRequestException` clara) / `PRINTER_PORT` (default `9100`).
- Dos endpoints nuevos en `facturacion-electronica.controller.ts`: `GET facturas/:number/tirilla/preview` (usa `printer.getText()`, **no requiere impresora física** — sirve para revisar el layout de texto) y `POST facturas/:number/tirilla/imprimir` (`isPrinterConnected()` + `execute()` real por TCP).
- Gotcha de Docker: el `node_modules` del contenedor `pinca-erp-api` es un volumen anónimo (`docker-compose.yml`) — un `docker compose build api` normal NO alcanza para que el contenedor vea la dependencia nueva, porque Compose reutiliza el volumen anónimo del contenedor anterior al recrear. Hace falta `docker compose up -d --force-recreate -V api` (la flag `-V` renueva los volúmenes anónimos) para que efectivamente tome el `node_modules` reinstalado en la imagen nueva.
- **Validado en runtime**: el preview generó correctamente el layout completo contra una factura real del sandbox (`SETP990014125`) — encabezado, cliente, ítems, totales, CUFE y los bytes de comando del QR (el texto plano de `getText()` incluye bytes de control ESC/POS crudos donde hay QR/negrita/alineación, no es una vista "bonita", pero el contenido de negocio se lee bien). El endpoint de impresión real devuelve el 400 esperado cuando `PRINTER_IP` está vacío (probado). **NO se pudo probar la impresión real contra hardware** — el usuario no estaba en la sede del cliente en el momento de la sesión.

**Pendiente**: cuando el usuario tenga la IP real de la impresora del cliente, setear `PRINTER_IP` en `.env` + `docker compose up -d --force-recreate -V api` (o simple `docker restart` si el contenedor ya tiene el node_modules correcto) y probar `POST .../tirilla/imprimir` de punta a punta. Revisar si `PC858_EURO` renderiza bien los acentos en el modelo real (no todos los clones ESC/POS soportan el mismo codepage). Reintentar el logo de Factus más adelante o reportarlo a su soporte.

### 2026-08-03 — Nómina Electrónica DIAN vía Factus: BLOQUEADA (cuenta sin habilitar)

El usuario pidió implementar Nómina Electrónica DIAN vía Factus (`/v2/payrolls`), reemplazando el cálculo del módulo interno `nomina` **sin borrarlo**. Antes de escribir código se probó el sandbox real (mismas credenciales `.env` de `facturacion-electronica`):

- `GET /v2/payrolls` responde OK — hay 1 documento de otro evaluador de la cuenta compartida (`reference_code 990000039`, número `NEF1`, worker con `identification_document`/`worker_type`/`contract_type`/`payment_method`, `totals.deduction/accruals/paid`).
- `POST /v2/payrolls` (crear) devuelve `403 Forbidden`: `"La empresa no tiene habilitada la creación de este documento"`. La cuenta sandbox compartida **no tiene activo el producto Nómina Electrónica para creación** (solo lectura del documento ajeno que ya existe) — en Colombia esto requiere su propia habilitación/resolución DIAN, separada de la de facturación de venta, probablemente con plan/costo aparte en Factus.
- No se pudo determinar la ruta de detalle por número/id (`GET /v2/payrolls/{number}` y `/{id}` dieron 404) ni el payload de creación — sin poder crear, no hay 422 de validación campo-por-campo que reverse-engineerear (a diferencia de como se hizo con `facturas`).

**Cero cambios de código** — decisión explícita del usuario de pausar y gestionar primero con soporte de Factus la habilitación en la cuenta, antes de escribir el módulo. `nomina_empleados` seguirá necesitando campos nuevos cuando se retome (tipo de documento/contrato/jornada, EPS, fondo de pensión, ARL, fondo de cesantías, método de pago) — no existen hoy.

### 2026-07-30/31 — Gaps de datos en cotizaciones/OC/pagos (NIT, ciudad, dirección)

Disparado desde el lado frontend: al construir un layout alternativo de PDF (estilo Factus, ver `pinca_frontend/CLAUDE.md`) se detectó que varios campos legales del cliente/proveedor salían siempre vacíos en los PDFs (incluidos los formatos Carta/Tiquete ya existentes, no solo el nuevo) porque las queries de listado/detalle nunca los traían del JOIN. Bug preexistente, no introducido en esta sesión.

- **`cotizaciones.service.ts`** (`findAll` — usado tanto por el modo legacy como el paginado — y `findOne`): agregado `c.numero_documento AS nit_cliente, c.ciudad, c.direccion` al SELECT. Antes solo traía `nombre_empresa`/`nombre_encargado`/`email`/`telefono` del cliente.
- **`ordenes-compra.service.ts`** (`detalle()`, el endpoint que usa `ExportOrdenCompra.jsx`): agregado `p.numero_documento AS nit_proveedor, p.direccion AS direccion_proveedor`.
- **`pagos-cliente.service.ts`** (`index()`, tanto el modo legacy como el paginado — dos SELECT casi idénticos, se tocaron los dos): agregado `c.numero_documento AS nit_cliente`.

Ningún cambio de shape rompe nada existente — son columnas nuevas agregadas al SELECT, no renombradas ni quitadas. **Validado en runtime** (Docker, `docker restart pinca-erp-api` + JWT admin minteado): `GET /ordenes_compra/45/detalle` (OC-003, proveedor real BRENNTAG COLOMBIA) devuelve `nit_proveedor: "860002590-1"` y `direccion_proveedor` correctos; para cotizaciones se insertó una fila `__TEST__COT-0001` (cliente real id 1, Distribuidora Andina), se confirmó `nit_cliente: "900123456"` vía `GET /cotizaciones`, y se borró después (0 residuo). `typecheck` limpio en los 3 archivos.

No se tocó nada de `facturas` — ese módulo ya tenía sus propios JOIN completos desde antes.

### 2026-08-10 — Limpieza/refactor general + bug real de costeo (IVA + matching de proveedor)

Sesión disparada por `/goal` de limpieza de código (buscar y eliminar código no usado, console.logs de depuración, sugerir refactor de funciones complejas). Auditoría inicial: **el backend ya estaba limpio** — ESLint (`@typescript-eslint/no-unused-vars`) 0 issues en 177 archivos, 0 código comentado muerto, 0 archivos/exports huérfanos. Único hallazgo: `@nestjs/jwt` declarado en `package.json` pero nunca usado (la auth firma/verifica JWT a mano con `jsonwebtoken`) — reportado, no removido (tocar `package.json`/lockfile es un cambio de mayor alcance, se dejó como sugerencia).

**Refactors puros (sin cambio de comportamiento) en las 3 funciones más largas/complejas del backend**, extrayendo métodos privados nombrados, validados con `tsc --noEmit` + ESLint + comparación de respuestas HTTP antes/después en Docker (git stash del cambio → capturar respuesta original → restaurar → comparar):

- **`costos-produccion.service.ts::getCostosProduccionBatch`** (177 líneas → helpers `fetchProductosConFormula`, `fetchIngredientesPorFormulas`, `fetchStockPorMp`, `fetchProveedoresPorMp`, `calcularCostoProducto`, `calcularCobertura`). Read-only, bajo riesgo. Respuesta **idéntica byte a byte** antes/después.
- **`preparaciones.service.ts::create`** (161 líneas → `validarUnidad`, `validarItemActivo`, `resolverFormulacionActiva`, `resolverVersionId`, `obtenerIngredientes`, `parseDetalleYCapas`, `calcularFactorVolumen`, `insertarPreparacion`, `insertarDetalleIngredientes`, `insertarCostosIndirectos`). Transaccional. Validado creando una preparación real (item 1, BARNIZ TRANSPARENTE, 5 gal) con el código refactorizado y con el original (vía `git stash`), comparando el JSON de respuesta — idéntico. Cancelada y limpiado el residuo (0 filas remanentes).
- **`preparaciones.service.ts::ajustarInventario`** (179 líneas → `fetchIngredientesConCosto`, `resolverConsumoCapas`, `upsertInventarioLegacy`, `resolverLoteSnapshot`, `registrarCostoCongelado`). La más crítica (dinero + stock + consumo de capas). Validado en 3 modos reales contra Docker: legacy sin capas (item 1), FIFO automático (item 297/ETHYL SILICATO, capas 36/85), y selección MANUAL explícita de capa — los 3 con reintegro exacto al cancelar y cero residuo. Comparado también contra el código original vía `git stash` para el camino FIFO — idéntico.

### Bug real encontrado a partir de una pregunta del usuario ("¿por qué me da otros valores la interfaz?")

Al generar unos documentos de costeo para cliente (ver `pinca_frontend/CLAUDE.md` de la misma fecha) usando `GET /costos-produccion/:id`, los números no coincidían con lo que mostraba la pantalla de Formulaciones real. Investigación llevó a encontrar que **dos servicios calculan "el precio de un insumo" con 3 criterios distintos**:

1. **IVA**: `costos-produccion.service.ts` usaba `ip.precio_unitario` (sin IVA); `formulaciones-costos.service.ts::getOpcionesProveedorFormulacion` (la fuente real que alimenta Formulaciones) usa `ip.precio_con_iva` (con fallback a `precio_unitario` si no hay IVA cargado).
2. **Prioridad de proveedor**: `costos-produccion` priorizaba proveedores **vinculados directo** (`item_proveedor.item_general_id = mp_id`) sobre coincidencias por nombre, aunque no fueran los más baratos; `formulaciones-costos` deja ganar **al más barato siempre**, vinculado o no.
3. **`matchNombre`** (heurística de coincidencia por nombre cuando no hay vínculo directo): la de `costos-produccion` no tenía guarda de longitud → matcheaba falsos positivos como "ACRONAL" dentro de "COLARCRYL ACRONAL 50" (un producto totalmente distinto). La de `formulaciones-costos` sí tiene la guarda `shorter/longer >= 0.4` que rechaza ese caso.

**Decisión del usuario** (confirmada explícitamente): el criterio de `formulaciones-costos`/Formulaciones es el correcto — con IVA, el más barato siempre gana, y con la guarda de longitud en el nombre. **Corregido `costos-produccion.service.ts`** (afecta `getCostosProduccionBatch` vía `fetchProveedoresPorMp` y `getCostoProduccionDetalle` que tiene su propio bloque duplicado) para igualar exactamente ese criterio. Validado ingrediente por ingrediente contra `GET /formulaciones/:id/opciones-ingredientes` para los productos 461 y 462 — **17/17 y 16/16 coinciden exacto** tras el fix (antes había 1 mismatch por producto, siempre el mismo patrón ACRONAL/DIOXIDO DE TITANIO).

### Bug real #2 (frontend, ver detalle en `pinca_frontend/CLAUDE.md`): `parseCOP` faltante en `FormulacionesTable.jsx`

De paso se encontró que el total mostrado en Formulaciones seguía sin coincidir por ~$9.600 (el valor exacto del AGUA) incluso después del fix de arriba — causa: el campo `costo_total_materia` que devuelve `calculateCosts` viene pre-formateado en pesos colombianos como *string* (`toCOP()`, ej. `"9.600"`), y el frontend hacía `Number("9.600")` → **9.6** (JS interpreta el punto como decimal, no como separador de miles) en vez de 9600. Afecta a cualquier insumo sin proveedor vinculado (hoy solo el agua, pero el patrón es peligroso si algún insumo caro se queda sin proveedor). Fix del lado frontend con `parseCOP` (ver ese repo).

### Dato (no código): `costos_item.volumen` NULL en VIN461/462

Los dos productos nuevos cargados por foto de libreta (`memoria del asistente`, sesión previa) nunca tuvieron seteado `costos_item.volumen` (volumen base en galones que rinde la receta) → NULL → el backend asumía 1 galón por defecto (`COALESCE(NULLIF(volumen,0),1)`), lo que multiplicaba el costo ×100 al simular un lote real. **No es un bug de código** — es un dato faltante. Se insertaron las filas `costos_item` para item 461 y 462 con `volumen=100` directo en la BD (no vía migración/seed versionado — cambio de dato en runtime, confirmado por el usuario).

**Validado**: `tsc --noEmit` limpio en los 3 archivos tocados, ESLint 0 issues, `docker restart pinca-erp-api` + comparación de respuestas reales para cada fix.

**Pendiente**: ninguno de código en este repo. Los 3 refactors + 2 bugs quedaron cerrados y validados en runtime.

### 2026-08-11 — Continuación de la limpieza: 4 refactors más de "riesgo moderado"

Continuación directa de la sesión anterior (mismo `/goal` de limpieza de código). Se completó la cola de funciones largas/complejas marcadas como riesgo moderado (quedaban fuera las 2-3 de dinero/concurrencia más críticas, deliberadamente diferidas). Misma metodología en los 5: extracción pura de métodos privados nombrados preservando el orden y texto exacto de cada query, validada con `tsc --noEmit` + ESLint + comparación de respuestas HTTP antes/después en Docker (`git stash` → restart → capturar → `git stash pop` → restart → capturar → `diff`).

- **`formulaciones.service.ts::getFormulacionConMateriasPrimas`** (103 líneas → `fetchItemConCostos`, `fetchFormulacionActiva`, `fetchMateriasPrimasDeFormula`). Read-only. Idéntico byte a byte en 5 items (incl. VIN461/462) + 404 preservado.
- **`formulaciones-costos.service.ts::calculateCostsByProveedor`** (116 líneas → `fetchProveedorPorId`, `fetchFormulacionIdActiva`, `fetchItemConCostosDefault`, `fetchIngredientesConCostoEstandar`, `fetchItemsDelProveedor`, `encontrarMejorItemProveedor`). Read-only. Idéntico en 5 combos item/proveedor + 2 guards de error (400) preservados.
- **`notificacion.service.ts::generarAutomaticas`** (113 líneas → `generarNotifsStockCritico`, `generarNotifsOcsRetrasadas`, `generarNotifsFacturasEnMora`, `generarNotifsFacturasPorVencer`, mismo orden secuencial). Es el lazy-cron que corre en cada `GET /notificaciones`. Validado disparándolo dos veces seguidas contra Docker: la 1ª generó 1 notificación real (OC-003 retrasada, ya existía la condición), la 2ª (con el código refactorizado) no duplicó gracias al dedup de 24h — filas idénticas.
- **`sincronizacion.service.ts::reemplazarEnFormulas`** (102 líneas → `validarItemsReemplazo`, `resolverScopeFormulaciones`, `fetchFormulasAgrupadasPorMp`, `fetchSnapshotReemplazo`, `aplicarReemplazoEnFormulas`, `evaluarEliminacionOrigen`, `registrarLogReemplazo`). Transaccional, la más delicada de las 5 (borra/actualiza/inserta filas de `item_general_formulaciones`, puede soft-eliminar la MP origen, registra snapshot para poder revertir). Validado de punta a punta con datos `__TEST__` reales: creé 2 materias primas + 1 producto + 1 fórmula de prueba, corrí el reemplazo (resultado: 1 repuntada, origen marcada eliminada por quedar sin uso/stock — correcto), corrí `revertirReemplazo` sobre el log generado y confirmé que el estado quedó **exactamente igual** al inicial (misma fila en `item_general_formulaciones`, MP origen sin `deleted_at`). Cero residuo tras limpiar los datos de prueba.
- **`formulaciones-costos.service.ts::calculateCosts`** (99 líneas → `fetchItemConCostosDetalle`, `fetchFormulacionIdActivaDeItem`, `fetchIngredientesConCostoTotal`, `calcularFactorVolumen`, `sumarTotalesMateriaPrima`). Read-only, pero es la función que alimenta tanto `GET /formulaciones/costos/:id` como `recalculateCostsWithNewVolume` (con `newVolume` no-null). Validado idéntico en 5 items sin volumen + 2 llamadas a `recalcular_costos/:id/:vol` (ejercitando el path del factor de volumen).

**Cola de refactors pendiente** (deliberadamente diferida, requieren máxima cautela por ser dinero/concurrencia): `ordenes-compra.service.ts::recibirLoteProrrateado` (125 líneas, prorrateo + `FOR UPDATE` + atomicidad), `cotizaciones.service.ts::convertir` (110 líneas, ya tiene un fix documentado de duplicado de factura vía `FOR UPDATE`). También queda `item.service.ts::update` (108 líneas, PUT parcial que protege `costo_unitario`) como menor prioridad. Ninguno tocado todavía.

**Cero cambios de comportamiento** — los 5 refactors de hoy son extracción pura, sin tocar lógica de negocio. Todos commiteados individualmente.
