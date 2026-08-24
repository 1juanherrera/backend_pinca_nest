# Plan por hitos — extensión tienda web Pinca (2026-08-24)

Traduce la arquitectura decidida en [arquitectura-core-api.md](./arquitectura-core-api.md)
(Core API separado + arranque frontend-mock-first) en fases ejecutables. Reemplaza, como
plan de ejecución, al enfoque de fases de [prompt-extension-erp.md](./prompt-extension-erp.md)
(superado — ver [revision-plan-extension.md](./revision-plan-extension.md)).

Convención: 🖥️ = `PINCA_WEB` (por crear) · 🏭 = `pinca_backend_nest` (ERP, existente).

**Decisión del usuario 2026-08-24**: arrancar el plan **sin tocar nada de pasarela de
pagos por ahora** — H0 (elección de pasarela) y H5 (checkout/pago real) quedan explícitamente
en pausa hasta que se decida.

## H0 — Cerrar decisiones bloqueantes (sin código)

No bloquea H1, pero sí bloquea H4/H5.

- ⏸️ Pasarela de pago (Wompi/PayU/ePayco) — **en pausa por decisión explícita del usuario**.
- Monorepo vs repos separados (Core API + Next.js).
- Timing del outbox/n8n: ¿desde el arranque o post-MVP?

## H1 — Demo visual con datos mock 🖥️

- Scaffold Next.js App Router + Tailwind + shadcn/ui.
- Contrato de datos mock idéntico al que devolverá `GET /api/store/catalogo` (id, nombre,
  categoría, imagen, presentaciones con precio/stock) — así solo cambia la URL base cuando
  el backend real esté listo.
- Poblar con datos reales extraídos del ERP (nombres/categorías/precios de los 59
  productos), placeholder genérico de cuñete/galón (no hay imágenes reales aún).
- Pantallas: catálogo + listado, ficha de producto, carrito (UI, sin pago), checkout (UI
  del flujo, sin pasarela conectada).
- **Hito de salida**: demo mostrable al cliente.

## H2 — Gaps de catálogo en el schema del ERP 🏭

Puede correr en paralelo a H1 — no dependen entre sí.

- Tabla de imágenes de producto (multi-imagen, orden, principal).
- Entidad variante/presentación (`item_presentaciones`: SKU, factor de conversión, precio
  propio) — **riesgo marcado explícitamente**: hoy `costos_item` es 1:1 con el ítem; pasar
  a 1:N por presentación impacta todo lo que asume "un ítem = un precio" (cotizaciones,
  facturas, formulaciones-costos). Requiere mapear esos usos antes de tocar la relación.
- Decisión pendiente de diseño: tintometría estructurada (tabla color código/nombre/hex)
  vs seguir texto libre — dar recomendación con trade-offs antes de implementar.
- Lista de precios por canal (público vs interno), sin romper que `cotizaciones`/`facturas`
  sigan leyendo `costos_item.precio_venta` como hoy.
- Todo vía migración TypeORM explícita (`synchronize:false`), validado en Docker (§5 de
  `CLAUDE.md` del ERP).

## H3 — Endpoints `/api/store/*` (read-only) 🏭

Depende de H2 para tener datos reales que exponer; el shape del endpoint puede diseñarse
antes.

- Namespace nuevo, **fuera** de `JwtAuthGuard`/`RolesGuard`/`VisorReadonlyGuard` (lectura
  pública sin login).
- Catálogo, ficha de producto, stock por bodega/punto de recogida.
- Headers `Cache-Control` explícitos por endpoint: catálogo/fichas cacheables 5–15 min,
  stock **nunca** cacheado (justificado en `decisiones-tecnicas.md` — la tienda comparte
  MySQL con el ERP transaccional).

## H4 — Core API real 🖥️

Arquitectura hexagonal/DDD (según `arquitectura-core-api.md`). Puede arrancar el scaffold
en paralelo a H2/H3, pero el adaptador ERP necesita H3 terminado para conectar de verdad.

- Scaffold NestJS + Prisma + MySQL propia, capas `domain/application/infrastructure`.
- `erp-catalogo.adapter.ts` con **circuit breaker (opossum) + timeout desde el día uno** —
  no es mejora posterior, es la protección contra que la tienda tumbe al ERP si este se
  cae o está lento.
- `ClienteWeb` (auth propia, B2C, sin NIT en el registro) + `Carrito`/`CarritoItem` reales
  (invitado por `session_token`, fusión al loguear).
- Conectar el frontend de H1 al Core API real en vez del mock (solo cambia la URL base).

## H5 — Checkout y pago real 🖥️ + 🏭

⏸️ **En pausa** — depende de H0 (pasarela elegida, hoy explícitamente diferida) y de H4.

- `PedidoWeb` en `pendiente_pago` (sin reservar folio DIAN) hasta que el webhook de la
  pasarela confirme el pago (firma verificada) — evita quemar numeración real en pagos
  fallidos/abandonados.
- 🏭 Nuevo endpoint `POST /api/store/pedidos` (autenticado service-to-service, no de
  usuario final) que reutiliza `cotizaciones.convertir`/`facturas.create` para generar la
  factura real — no duplica lógica de negocio de ventas.

## H6 — Outbox/n8n, hardening, observabilidad 🖥️ + 🏭

- `OutboxEvent` + worker de publicación con reintentos (si H0 decidió diferirlo, entra acá
  en vez de H4).
- Monitoreo del circuit breaker (alertar si pasa a OPEN).
- Rate limiting en los endpoints públicos de catálogo (mitigación adicional al caching de
  H3).

## Dependencias resumidas

H1 y H2 son paralelizables desde ya. H3 depende de H2. H4 puede arrancar el scaffold en
paralelo, pero su conexión real depende de H3. H5 depende de H0 + H4 (**en pausa**). H6
cierra al final (o antes, si H0 decide adelantar el outbox).
