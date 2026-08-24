# Continuación H2+H3 — diseño listo para ejecutar (2026-08-24)

Sesión interrumpida porque **Docker Desktop no estaba corriendo** (no hay `pinca-erp-db`/
`pinca-erp-api` levantados). Este doc deja el diseño técnico completo, ya explorado contra
el código real, para que la próxima sesión ejecute directo sin tener que re-derivar nada.

Contexto: ver [plan-fases-extension.md](./plan-fases-extension.md) — este trabajo es H2
(gaps de schema) + H3 (`/api/store/*`), elegido explícitamente por el usuario para arrancar
**antes** que el Core API (H4) en `PINCA_WEB/backend`, para que el adaptador del Core API
tenga algo real a lo que pegarle desde el día uno (en vez de un stub). Pasarela de pago
(H0/H5) sigue **en pausa**, no tocar.

## Hallazgos clave de la exploración (ya verificados en código)

- **No existe sistema de migraciones TypeORM en este repo** (`synchronize:false`, no hay
  carpeta `migrations/`). Los cambios de schema se hacen por **SQL crudo directo** contra
  Docker (mismo patrón ya usado para `costos_item.volumen` de VIN461/462, ver `CLAUDE.md`
  §historial 2026-08-10). Las entidades TypeORM se agregan/ajustan después, mínimas
  (ver `item-general.entity.ts`: solo 3 columnas, el resto se lee por raw SQL en el service).
- **Patrón de endpoint público ya existe**: módulo `asistente` (`src/modules/asistente/`) —
  `@Controller('asistente') @Public() @UseGuards(ApiKeyGuard)`. `@Public()` (en
  `src/common/decorators/public.decorator.ts`) saltea el `JwtAuthGuard` global.
  `ApiKeyGuard` (`src/common/guards/api-key.guard.ts`) valida header `x-api-key` contra
  `process.env.ASISTENTE_API_KEY`, hardcodeado a esa variable — **no es genérico**, hay que
  crear un guard nuevo para `/api/store/*` (no reutilizar el mismo, ver abajo).
- **Patrón de servicio de catálogo** (`catalogo.service.ts`): raw SQL con joins manuales
  (`item_general` + `categoria` + `unidad` + `costos_item` + subquery de `inventario_capas`
  para stock), nada de query builder. `store.service.ts` debe seguir el mismo estilo.
- Contrato exacto que el frontend de `PINCA_WEB` ya espera (`frontend/src/types/catalogo.ts`,
  `carrito.ts`) — **ya construido y funcionando contra mock**, no inventar shape nuevo:
  `ProductoCatalogo { id, slug, nombre, categoria{id,nombre,slug}, acabado?, colorNombre?,
  colorHex?, imagenUrl, rendimientoM2PorGalon?, descripcionCorta?, presentaciones[] }`,
  `PresentacionProducto { sku, nombre, volumenMl, precio, stock, disponible }`. **Ojo**: el
  frontend tipa `id`/`sku` como `string`; el ERP usa autoincrement numérico — castear a
  string en la respuesta, no tocar el tipo del frontend.

## Diseño de schema (H2)

### 1. `item_imagenes` (tabla nueva)

```sql
CREATE TABLE item_imagenes (
  id_imagen INT AUTO_INCREMENT PRIMARY KEY,
  item_general_id INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  es_principal TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_item_imagenes_item FOREIGN KEY (item_general_id)
    REFERENCES item_general(id_item_general)
);
```

Storage: filesystem local bajo `public/uploads/productos/`, servido por la ruta estática
`/uploads` que ya expone `pinca-erp-api` (mismo mecanismo que `logo_default.png` de
`empresa`). `url` guarda el path relativo. No se decidió S3/Cloudinary — se sigue la
convención ya existente en el repo, más simple y sin dependencia nueva.

### 2. `item_presentaciones` (tabla nueva)

```sql
CREATE TABLE item_presentaciones (
  id_presentacion INT AUTO_INCREMENT PRIMARY KEY,
  item_general_id INT NOT NULL,
  sku VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(50) NOT NULL,
  volumen_ml INT NOT NULL,
  factor_conversion DECIMAL(10,4) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_item_presentaciones_item FOREIGN KEY (item_general_id)
    REFERENCES item_general(id_item_general)
);
```

- `factor_conversion`: relativo a la unidad base de inventario del ítem (la que ya usa
  `inventario_capas`/`unidad_almacenaje_id`). Ej. si la unidad base es galón: Galón=1.0000,
  Cuarto=0.2500, Cuñete 5gal=5.0000. **Antes de cargar datos reales, verificar la unidad
  base real de cada producto** (`ig.unidad_almacenaje_id` en `catalogo.service.ts`), no
  asumir galón para todos.
- Stock de una presentación en H3 = `FLOOR(stock_base_disponible / factor_conversion)`
  (mismo subquery de `inventario_capas` que ya usa `catalogo.service.ts::listar`).
- `precio`: **decisión de simplificación (YAGNI) frente al prompt original** — en vez de un
  modelo genérico `lista_precios`/`lista_precios_item` (gap 4), el precio público de canal
  tienda vive directo en `item_presentaciones.precio`. El precio interno del ERP sigue
  siendo `costos_item.precio_venta`, **intacto, sin tocar**. Si en el futuro se necesitan
  más de 2 canales (ej. distribuidor mayorista con su propio precio), se generaliza
  entonces — no antes.
- Esta tabla es **nueva y separada** de `costos_item` — no se toca la relación 1:1 existente
  entre `item_general` y `costos_item`, evitando el riesgo que marcaba explícitamente el
  prompt original (todo lo que asume "un ítem = un precio" en cotizaciones/facturas/
  formulaciones-costos sigue funcionando exactamente igual).

### 3. Color — recomendación pendiente de confirmar con el usuario

El prompt original pedía explícitamente **no decidir esto solo**. Recomendación: mantener
`item_general.color` como texto libre (no construir catálogo de tintometría todavía — sería
sobre-ingeniería para el estado actual del catálogo), y agregar una columna nueva
**nullable**, aditiva, sin romper nada:

```sql
ALTER TABLE item_general ADD COLUMN color_hex VARCHAR(7) NULL AFTER color;
```

Esto ya calza con el campo opcional `colorHex` que el tipo `ProductoCatalogo` del frontend
ya tiene previsto. **Confirmar con el usuario antes de ejecutar este ALTER** (a diferencia
de las dos tablas nuevas, que no tienen ambigüedad de diseño pendiente).

## Diseño de `/api/store/*` (H3)

Módulo nuevo `src/modules/store/` (no reutilizar `catalogo` para esto — `catalogo` sigue
siendo el CRUD interno para empleados; `store` es la superficie pública de solo lectura):

- `store.module.ts`, `store.controller.ts`, `store.service.ts`.
- Guard nuevo `src/common/guards/store-api-key.guard.ts` — **mismo patrón que
  `ApiKeyGuard` de `asistente`, pero como clase separada** leyendo
  `process.env.STORE_API_KEY` (no generalizar el guard existente, que está hardcodeado a
  `ASISTENTE_API_KEY` — más simple mantener un guard por módulo que parametrizar uno
  compartido, siguiendo el estilo ya usado en el repo). El consumidor real de este API key
  es el Core API (`PINCA_WEB/backend`) llamando server-to-server, no el navegador — por
  eso "lectura pública sin login" (sin JWT de usuario) igual conserva una key de servicio.
- `@Controller('store') @Public() @UseGuards(StoreApiKeyGuard)` a nivel de clase.
- `GET /api/store/catalogo` → `CatalogoListadoResponse` (`{ productos: ProductoCatalogo[] }`)
  — solo `tipo=0` (PRODUCTO TERMINADO), `deleted_at IS NULL`, con categoría + imágenes +
  presentaciones (stock calculado vía el subquery de `inventario_capas`).
- `GET /api/store/catalogo/:id` → un `ProductoCatalogo`.
- Headers `Cache-Control: public, max-age=300` (5 min) en ambos. **Nota de diseño
  importante**: el stock mostrado queda con hasta 5 min de desfase — aceptable porque la
  verificación real de disponibilidad ocurre en `POST /api/store/pedidos` (H5, todavía en
  pausa) dentro de una transacción contra el ERP real, igual que hoy en cotizaciones/
  facturas. El caching no compromete integridad de inventario, solo la UX de "disponible"
  mostrado en el catálogo.
- `store.service.ts`: raw SQL con joins, estilo idéntico a `catalogo.service.ts::listar`/
  `detalle` (ver ese archivo como plantilla exacta).
- Registrar `StoreModule` en `app.module.ts` (import + comentario de sección, siguiendo la
  convención de comentarios por fase que ya tiene ese archivo).

## Administración de imágenes/presentaciones (necesario para poblar las tablas)

Sin esto, `item_imagenes`/`item_presentaciones` quedan huérfanas — no hay forma de cargar
datos salvo SQL directo. Extender el módulo `catalogo` existente (no crear módulo nuevo,
es CRUD interno para empleados igual que el resto de `catalogo.controller.ts`):

- Entidades TypeORM nuevas, mínimas (mismo estilo que `ItemGeneral`):
  `src/modules/catalogo/entities/item-imagen.entity.ts`,
  `src/modules/catalogo/entities/item-presentacion.entity.ts`.
- Registrar en `catalogo.module.ts` (`TypeOrmModule.forFeature([...])`).
- Rutas nuevas en `catalogo.controller.ts` (heredan los guards globales normales del ERP —
  JWT + roles de empleado, **no** las de `/api/store/*`):
  - `POST /catalogo/:id/imagenes` (multipart, multer → `public/uploads/productos/`).
  - `DELETE /catalogo/:id/imagenes/:imgId`.
  - `PATCH /catalogo/:id/imagenes/:imgId/principal`.
  - `POST /catalogo/:id/presentaciones`, `PUT .../presentaciones/:pId`,
    `DELETE .../presentaciones/:pId`.
- Multer: reutilizar el patrón ya existente en el repo para subida de logo
  (`empresa`/`facturacion-electronica`), no reinventar configuración.

## Checklist para ejecutar cuando Docker esté arriba

1. `docker compose up -d` en `pinca_backend_nest`, esperar `GET /api/health`.
2. **Confirmar con el usuario** la recomendación de `color_hex` antes de correr ese ALTER
   (las dos tablas nuevas no tienen ambigüedad, se pueden crear directo).
3. Verificar `unidad_almacenaje_id` real de al menos los productos que se vayan a poblar
   primero, para no asumir galón a ciegas en `factor_conversion`.
4. Ejecutar los 2 `CREATE TABLE` (+ el `ALTER` si se confirma) contra `pinca-erp-db` vía
   `docker exec pinca-erp-db mysql ...` (receta §5 del `CLAUDE.md` del ERP).
5. Crear las 2 entidades + extender `catalogo.module.ts`/`service`/`controller` (admin CRUD).
6. Crear `StoreModule` completo (`store-api-key.guard.ts`, `store.service.ts`,
   `store.controller.ts`, `store.module.ts`) + registrar en `app.module.ts`.
7. Definir `STORE_API_KEY` en `.env` + `docker-compose.yml` (mismo patrón que
   `ASISTENTE_API_KEY`).
8. Cargar datos reales de imágenes/presentaciones para un subconjunto de productos (no
   hace falta completar los 59 para probar de punta a punta).
9. `docker restart pinca-erp-api`, validar en runtime: `tsc --noEmit` limpio, `curl` a
   `/api/store/catalogo` con y sin `x-api-key` (401 sin key), comparar shape de respuesta
   contra `frontend/src/types/catalogo.ts` de `PINCA_WEB` campo por campo.
10. Actualizar `CLAUDE.md` del ERP (sección de historial de sesión, convención ya
    establecida) y marcar H2/H3 como completos en `plan-fases-extension.md`.
11. Recién ahí retomar `PINCA_WEB/backend` (H4, Core API) — el adaptador ya tiene un
    endpoint real (`/api/store/catalogo`) al que apuntar en vez de un stub.

## Sin tocar en esta reanudación

- Pasarela de pago (H0/H5) — sigue en pausa, decisión explícita del usuario.
- `PINCA_WEB/backend` (H4) — se retoma después de H2+H3, no antes (decisión de esta sesión:
  "Primero construyo H2+H3 en el ERP").
