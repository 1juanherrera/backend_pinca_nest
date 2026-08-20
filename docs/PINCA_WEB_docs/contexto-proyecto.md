# Contexto del proyecto — Tienda headless Pinca

## Objetivo

Construir una tienda web headless para Pinca (fábrica de pinturas) usando **Next.js**
(frontend) que consuma como API el backend **NestJS** del ERP propio de Pinca, el cual
está a punto de salir a producción.

Repos involucrados:

- **ERP** (fuente de datos y lógica de negocio): `C:\Users\PDESARROLLO\Documents\PROYECTO_PINCA`
  - `pinca_backend_nest/` — NestJS 11 + TypeORM 0.3 + MySQL 8, prefijo global `/api`, puerto `:3009`.
  - `pinca_frontend/` — React 19 + Vite 7 (frontend interno del ERP, no la tienda).
- **Tienda** (este repo): `PINCA_WEB` — por construir, Next.js + (extensión del) NestJS del ERP.

## Decisión de arquitectura

Se evaluaron dos opciones para exponer la API de la tienda:

1. **Extender el backend NestJS del ERP** con módulos nuevos (catálogo público, carrito,
   checkout), reutilizando entidades y base de datos existentes.
2. Crear un servicio NestJS "Storefront API" separado que lea del ERP vía su API interna.

**Se eligió la opción 1** (extender el backend del ERP). Implicación clave: el tráfico
público de la tienda golpeará la misma base de datos MySQL que usa el ERP transaccional
(facturación, cotizaciones, etc.), por lo que caching/CDN en el borde deja de ser opcional
a mediano plazo (ver [decisiones-tecnicas.md](./decisiones-tecnicas.md)).

## Estado actual del ERP (análisis, verificar vigencia antes de asumir)

**Stack**: NestJS 11 + TypeORM 0.3 + MySQL 8 (`gestorpincadb`), `synchronize: false`
(todo cambio de schema va por migración explícita — el schema fue heredado de un legacy
PHP/CodeIgniter 4 ya retirado). Auth JWT vía `passport-jwt`, con guards globales
`JwtAuthGuard` + `VisorReadonlyGuard` + `RolesGuard` pensados para usuarios internos
(empleados con rol), no para clientes finales.

**Módulos relevantes**: `catalogo`/`item`/`categorias` (ítems con campos técnicos de
pintura: viscosidad, color, brillo, secado, ph, poder tintóreo), `inventario` (sistema de
capas FIFO por bodega), `clientes` (NIT, plazo de pago, cupo de crédito — sin campos de
e-commerce), `cotizaciones`/`facturas`/`remisiones` (ciclo de ventas completo).

**Brechas confirmadas para soportar una tienda pública**:

| Necesario para e-commerce | Estado actual |
|---|---|
| Imágenes de producto | No existe ningún campo/tabla |
| Variantes/presentación (galón, cuarto, litro) | No existe como entidad; `unidad` es solo catálogo de medida |
| Color / tintometría | Campo de texto libre, no estructurado |
| Precio por canal/cliente (público vs distribuidor) | Un solo `precio_venta` por ítem (+ override manual) |
| Promociones/descuentos | Solo `descuento_pct` manual en líneas de cotización/factura |
| Auth para clientes externos (no empleados) | No existe |
| Mecanismo de sync (webhooks, colas, flags) | No existe nada |

No existe hoy ningún endpoint público, API key, ni carrito/pedido web — hay que
construirlo desde cero sobre la base del backend actual.

## Referencia de mercado: tienda.pintuco.com

Pintuco (competidor directo, mismo rubro) corre sobre **VTEX IO**: React + GraphQL con
SSR + hidratación, detrás de CDN CloudFront. Esto valida el enfoque headless
(Next.js + NestJS) como arquitectura razonable para el sector.

Funcionalidades explícitas observadas que sirven de referencia de producto:

- **Navegación**: Pintura Interior / Exterior / Herramientas / Ofertas / "Encuentra tu color".
- **Filtros de catálogo**: departamento, categoría, acabado (mate/satinado/semibrillante/
  brillante), beneficios (lavabilidad, antimanchas, antihongos, impermeabilización), marca,
  **rendimiento** (m²/galón), superficie, tamaño/presentación (300ml a cuñetes de 5 galones),
  rango de precio.
- **Tarjeta de producto**: imagen, nombre, precio, badges ("Retira hoy", promociones,
  envío gratis), botón comprar.
- **Cuenta de cliente**: login, "Mis Pedidos", favoritos, suscripción a ofertas.
- **Entrega**: al menos envío a domicilio y recogida en tienda (no se pudo confirmar el
  detalle del checkout — contenido cargado vía JS/GraphQL, no accesible por fetch estático).

No se pudo confirmar el detalle interno de la ficha de producto (selector de color,
selector de presentación) por ser contenido renderizado client-side, pero es razonable
asumir que existe dado que el filtro de catálogo ya expone esos atributos a nivel de dato.

## Siguiente paso en curso — ACTUALIZADO 2026-08-19

El prompt de [prompt-extension-erp.md](./prompt-extension-erp.md) sí se llegó a ejecutar
(tarde, el 2026-08-19, no en el momento en que se redactó) y produjo el plan por fases
pedido — pero el resultado de ese ejercicio fue que **la Opción 1 (extender el ERP
directo) se descartó**. Se decidió en su lugar un Core API propio y separado para la
tienda. Ver el detalle completo, incluyendo por qué se descartó Opción 1 después de todo,
en [arquitectura-core-api.md](./arquitectura-core-api.md) — ese documento es ahora la
referencia vigente de arquitectura, incluye el plan de arranque (frontend con datos
simulados primero, para demo de cliente) y los pendientes sin decidir.
