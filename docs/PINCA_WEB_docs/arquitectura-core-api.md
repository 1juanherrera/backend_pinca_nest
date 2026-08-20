# Arquitectura del Core API — decisión final (2026-08-19)

Este documento reemplaza, en la práctica, el resultado que se esperaba de
[prompt-extension-erp.md](./prompt-extension-erp.md). Ese prompt pedía un plan para
**extender** `pinca_backend_nest` directamente con carrito/checkout/auth de cliente
(la "Opción 1" descrita en [contexto-proyecto.md](./contexto-proyecto.md)). Tras diseñar
ese plan por completo (ver el repo del ERP para el detalle técnico — no se documenta acá
porque vive en su propio código), se decidió **descartarlo a favor de un Core API propio y
separado**. Este doc es la arquitectura vigente.

## Decisión: Core API propio, no extensión del ERP

`PINCA_WEB` tiene su **propio backend** — repo propio, deploy propio, base de datos propia
(Prisma). No es una extensión de `pinca_backend_nest`. Stack: **NestJS + TypeScript +
Prisma + MySQL propia**, siguiendo **Arquitectura Hexagonal (Puertos y Adaptadores) +
DDD** — capas `domain/application/infrastructure` por módulo, sin la estructura plana que
usa el ERP (el ERP no es hexagonal, es NestJS pragmático con SQL crudo — son dos
filosofías distintas y está bien que convivan, se comunican por HTTP, no comparten código).

## Sincronización con el ERP — la decisión central

El Core API **no duplica catálogo/stock/precio** en su propio Prisma. Los consume **en
vivo vía HTTP** contra `pinca_backend_nest` (namespace `/api/store/*` de ese backend —
documentado del lado del ERP, en el repo `PROYECTO_PINCA`, porque el código vive ahí).

**Por qué no duplicar con sincronización por eventos**: el stock real nace en el ERP
(producción/compras/ventas internas del ERP) — cualquier copia local en el Core API
depende del ERP tarde o temprano, sin importar si la sincronización es en vivo o por
eventos. Duplicar solo cambia *cuándo* te enteras de un cambio, no si dependes de él, y
construir la infraestructura de eventos (que hoy no existe del lado ERP) no compraba
ningún beneficio real frente al riesgo que ya cubre el punto siguiente.

**Protección obligatoria**: el adaptador de infraestructura que le pega al ERP
(`erp-catalogo.adapter.ts` en la capa `infrastructure/erp-client/` del módulo de
catálogo) debe llevar **circuit breaker (librería `opossum`) + timeout** desde el primer
día, no como mejora posterior — sin esto, si el ERP se cae o está lento, cada visitante de
la tienda dispara una petición que tarda segundos en fallar, saturando la capacidad del
propio Core API (cascading failure / retry storm).

```
CLOSED (normal) → >50% de fallos en N peticiones → OPEN (falla instantáneo, sin red)
OPEN → pasa resetTimeout (10s) → HALF-OPEN (deja pasar 1 petición de prueba)
HALF-OPEN → éxito → CLOSED  |  HALF-OPEN → falla → vuelve a OPEN
```

## Qué modela Prisma en el Core API (y qué NO)

Solo lo que el Core API posee de verdad — el catálogo/imágenes vive en el ERP y se
consulta, no se duplica:

- `ClienteWeb` — cuenta de acceso web (email/password), **separada** de `clientes` del
  ERP. Se vincula a un cliente real del ERP (por NIT) recién en el checkout, no en el
  registro — la tienda es B2C (registro sin NIT).
- `Carrito` / `CarritoItem` — soporta invitado (`session_token`) antes de login, se fusiona
  al loguear. Los ítems referencian el SKU de presentación del ERP por valor (`String`),
  no por FK real — no puede haber integridad referencial entre dos bases de datos
  distintas.
- `PedidoWeb` / `PedidoWebItem` — estados `pendiente_pago → pagado → facturado → fallido`.
  Al confirmarse el pago (webhook de la pasarela, con firma verificada), dispara
  `POST /api/store/pedidos` contra el ERP para crear la factura real.
- `OutboxEvent` — patrón outbox para publicar eventos hacia n8n sin bloquear el request
  (escribir el evento en la misma transacción de negocio, un worker aparte lo publica con
  reintentos).

## Checkout — por qué es un estado intermedio, no una factura directa

Una pasarela de pago es asíncrona (confirma después, vía webhook, no en el mismo request
del checkout). Por eso `PedidoWeb` nace en `pendiente_pago` — **sin reservar folio DIAN
todavía** — y solo al confirmarse el pago se llama al ERP para generar la factura real.
Esto evita quemar numeración real en pagos que fallan o se abandonan, sin necesitar
revisión humana en el medio (el "revisor" es el webhook de la pasarela, verificado por
firma).

**Pendiente sin decidir**: qué pasarela de pago concreta (Wompi/PayU/ePayco/otra).

## Stack de frontend (Next.js, en el mismo repo o aparte — sin decidir monorepo)

- **Next.js App Router**: catálogo/ficha de producto como Server Components (SEO — Google
  indexa el HTML completo, no una SPA vacía); dashboard de cliente logueado ("Mis
  Pedidos", perfil, favoritos) como Client Components (sin SEO que ganar, necesita
  interactividad real).
- **React Query (TanStack Query)** es la **única fuente de verdad del carrito** — `useQuery`
  contra `GET /api/store/carrito`, `useMutation` con optimistic updates para
  agregar/quitar. **Zustand NO guarda líneas de carrito** (evita dos fuentes de verdad
  desincronizadas) — se reserva para estado de UI puramente efímero: drawer abierto/
  cerrado, filtros sin aplicar, menú mobile.
- **Tailwind CSS + shadcn/ui** — componentes copiados al repo (no dependencia cerrada),
  control total sobre el look corporativo.

## Plan de arranque — frontend primero, con datos simulados (demo de cliente)

Antes de construir el Core API real, se arranca por el **frontend con datos mock**, porque
el objetivo inmediato es mostrarle avance visual al cliente:

1. Scaffold Next.js App Router + Tailwind + shadcn/ui.
2. Definir el contrato de datos igual al que devolverá `GET /api/store/catalogo`/`/:id`
   del ERP (id, nombre, categoría, imagen, presentaciones con precio/stock) — mockeado con
   un route handler de Next.js o JSON estático, **no** con el backend real todavía. Así,
   cuando el ERP y el Core API estén listos, solo cambia la URL base del fetch.
3. Poblar el mock con **datos reales del ERP** (nombres/categorías/precios de los 59
   productos existentes, extraídos directo de la base de datos) — más creíble frente al
   cliente que placeholders genéricos. Sin imágenes reales todavía (no se han cargado en
   el ERP) — usar placeholder genérico de cuñete/galón mientras tanto.
4. Alcance visual para el primer demo: catálogo + listado, ficha de producto, carrito (UI,
   sin pago real), checkout (UI del flujo completo, sin pasarela real conectada todavía).
5. Después del demo: construir el Core API real (puertos/adaptadores, auth de cliente,
   carrito real, checkout con pasarela) y conectar el frontend ya construido al backend
   real en vez del mock.

## Pendientes sin decidir

- Pasarela de pago concreta (Wompi/PayU/ePayco/otra).
- Timing de la implementación del outbox/n8n (¿desde el arranque o post-MVP?).
- ¿Monorepo (Core API + Next.js en el mismo repo) o repos separados?

## Referencia cruzada

Los endpoints nuevos que expone `pinca_backend_nest` bajo `/api/store/*` (lectura de
catálogo/precio/stock/puntos de recogida + creación de pedido con validación de stock
real) están documentados **del lado del ERP**, en el repo `PROYECTO_PINCA` — viven ahí
porque el código se modifica ahí, aunque el propósito sea servirle a esta tienda.
