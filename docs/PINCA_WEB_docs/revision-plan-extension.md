# Revisión del plan de extensión del ERP — 2026-08-20

Revisión del prompt de [prompt-extension-erp.md](./prompt-extension-erp.md) contra el
estado actual del código y la documentación vigente.

## Veredicto: el prompt está superado

El prompt se ejecutó el 2026-08-19 y produjo el plan por fases pedido, pero tras diseñarlo
completo **se descartó la Opción 1** (extender el ERP directo con carrito/checkout/auth de
cliente). La decisión final fue crear un **Core API propio y separado** (`PINCA_WEB`),
documentado en [arquitectura-core-api.md](./arquitectura-core-api.md).

El prompt no debe borrarse — tiene valor como registro de la decisión y como inventario de
gaps — pero **no es la referencia de arquitectura vigente**. Esa es `arquitectura-core-api.md`.

## Los 6 gaps: siguen siendo reales (verificado 2026-08-20)

Se verificaron contra el código actual de `pinca_backend_nest` (rama `main`, commit
`3227041`). Ninguno ha sido resuelto todavía.

| # | Gap | Estado verificado |
|---|---|---|
| 1 | No existe tabla/campo de imágenes de producto | Confirmado — no hay nada en `src/modules/` ni en el schema |
| 2 | No existe modelo de variantes/presentación | Confirmado — `unidad` sigue siendo solo catálogo de medida |
| 3 | Color es texto libre en el ítem | Confirmado en `item-general.entity.ts` |
| 4 | Solo existe un precio por ítem (`costos_item.precio_venta` + override manual) | Confirmado — relación 1:1, sin listas de precio por canal |
| 5 | No existe API pública (`/api/store/*`) | Confirmado — 0 endpoints store, 0 módulos nuevos para esto |
| 6 | No existe carrito ni pedido web | Confirmado — no existen esos módulos |

## Qué cambió entre el prompt y la arquitectura final

| Lo que proponía el prompt | Lo que se decidió (arquitectura-core-api.md) |
|---|---|
| Extender `pinca_backend_nest` con todo (auth de cliente, carrito, checkout) | Core API separado (NestJS + Prisma + BD propia) |
| Todo en la misma BD MySQL del ERP | Core API con BD propia; consume catálogo/stock/precio del ERP vía HTTP |
| Auth de cliente como nueva estrategia JWT en el ERP | `ClienteWeb` vive en el Core API, se vincula al ERP por NIT al facturar |
| Carrito/pedido como módulos NestJS dentro del ERP | `Carrito`/`PedidoWeb` modelados en Prisma del Core API |

## Lo que sí le toca al ERP (pendiente)

Aunque el carrito/checkout/auth de cliente se movieron al Core API separado, el ERP
**todavía necesita cambios** para soportar la tienda:

1. **Resolver gaps 1–4 en el schema** — imágenes, variantes/presentaciones, color
   estructurado (si se decide), precios por canal. Sin esto, no hay datos de catálogo
   e-commerce que exponer.

2. **Exponer endpoints read-only bajo `/api/store/*`** — catálogo público con imágenes,
   precios por canal, stock por bodega/punto de recogida. Estos endpoints deben:
   - Estar **fuera** de `JwtAuthGuard` / `RolesGuard` (lectura pública sin login).
   - Llevar headers `Cache-Control` adecuados (catálogo cacheable 5–15 min; stock/carrito
     nunca cachear).

3. **Endpoint de creación de pedido** (`POST /api/store/pedidos`) — recibe un pedido
   confirmado del Core API y genera la factura real en el ERP (reutilizando el flujo de
   `cotizaciones.convertir` o `facturas.create`). Este sí requiere autenticación
   (service-to-service, no de usuario final).

## Estado del repo PINCA_WEB

El repo `PINCA_WEB` **no existe todavía**. El plan de arranque (documentado en
`arquitectura-core-api.md`) dice empezar por el frontend Next.js con datos mock para demo
de cliente, antes de construir el Core API real.

## Pendientes sin decidir

- Pasarela de pago concreta (Wompi / PayU / ePayco / otra).
- Monorepo (Core API + Next.js juntos) vs repos separados.
- Timing del outbox/n8n (¿desde el arranque o post-MVP?).

## Siguiente paso concreto

Dos caminos posibles (no mutuamente excluyentes, pero hay que priorizar uno):

- **Opción A — Frontend first**: scaffold Next.js + Tailwind + shadcn/ui con datos mock
  extraídos del ERP (nombres, categorías, precios reales; imágenes placeholder). Objetivo:
  demo visual para el cliente.
- **Opción B — Gaps del ERP first**: resolver imágenes + variantes + `/api/store/*` para
  tener datos reales que consumir desde el primer día.
