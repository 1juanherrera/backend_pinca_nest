# Prompt entregado a la sesión de Claude Code sobre PROYECTO_PINCA

Prompt usado para pedirle a la sesión de Claude Code que trabaja directamente sobre el
repo del ERP (`PROYECTO_PINCA`) un plan por fases para extender `pinca_backend_nest` y
soportar la tienda pública. Ver [contexto-proyecto.md](./contexto-proyecto.md) para el
contexto completo detrás de este prompt.

Estado: entregado, plan aún pendiente de revisar.

---

```
Contexto del proyecto:

Este es el backend NestJS del ERP de Pinca (fábrica de pinturas), en pinca_backend_nest
(NestJS 11 + TypeORM 0.3 + MySQL 8, DB "gestorpincadb", prefijo global /api, puerto :3009,
auth JWT vía passport-jwt con guards globales JwtAuthGuard + VisorReadonlyGuard + RolesGuard
en app.module.ts). El ERP está a punto de salir a producción.

Vamos a construir una tienda web pública headless (frontend Next.js, en otro repo aparte)
que consumirá este mismo backend NestJS como su API — decidimos EXTENDER este backend con
módulos nuevos en vez de crear un servicio separado, para reutilizar entidades y DB
existentes.

Antes de escribir código, quiero que EXPLORES el código actual tú mismo (no asumas nada de
este prompt como verdad absoluta, verifícalo) para confirmar el estado real de:
- catalogo/ (entidad item, categorías, unidades) — especialmente catalogo/entities/item-general.entity.ts
  y catalogo.service.ts
- costos_item (precio_venta, precio_venta_manual/precio_manual_activo)
- inventario_capas / bodegas (stock por bodega, sistema FIFO)
- clientes (campos existentes: NIT, plazo_pago, dias_credito, limite_credito)
- cotizaciones/facturas (para entender cómo se genera hoy una venta, ya que un "pedido web"
  debería integrarse a ese flujo, no crear uno paralelo)
- auth/strategies/jwt.strategy.ts y los guards globales

GAPS CONFIRMADOS que hay que resolver (verificados en un análisis previo, pero re-confirma
al explorar):
1. No existe NINGÚN campo/tabla de imágenes de producto.
2. No existe modelo de variantes/presentación (galón, cuarto, litro) como entidad — "unidad"
   es solo catálogo de unidad de medida, no un SKU por presentación con precio propio.
3. "color" es un campo de texto libre en el ítem, no una tintometría estructurada
   (código, nombre, hex, familia).
4. Solo existe UN precio por ítem (costos_item.precio_venta + override manual) — no hay
   listas de precio por canal/tipo de cliente (público vs distribuidor/mayorista).
5. No hay ningún mecanismo de API pública: los guards actuales asumen usuario interno del
   ERP (empleado con rol). Un cliente final de la tienda necesita su propio esquema de
   autenticación (JWT de cliente, separado de los roles internos), y probablemente
   endpoints bajo un namespace distinto (ej. /api/store/*) con reglas de autorización
   propias (lectura pública de catálogo sin login, escritura de carrito/pedido con login
   de cliente).
6. No existe módulo de carrito ni de pedido web.

OBJETIVO DE ESTA TAREA:

Quiero que, en modo plan (usa EnterPlanMode si tu herramienta lo soporta), propongas un
diseño concreto — con entidades TypeORM, migraciones, y estructura de módulos/controladores
NestJS nuevos bajo src/modules — para cubrir los 6 gaps de arriba, organizado en fases:

FASE 1 — Modelo de datos de catálogo público:
  - Entidad de imágenes de producto (multi-imagen, orden, imagen principal, storage:
    decide si URL a S3/Cloudinary o filesystem local — pregúntame si no es obvio por el
    resto del proyecto).
  - Entidad de variante/presentación por ítem (ej. item_presentaciones: presentación,
    factor de conversión respecto a unidad base, precio propio, código SKU), enlazada a
    costos_item o reemplazando su relación 1:1 actual por 1:N.
  - Decidir si estructurar tintometría (tabla de colores con código/nombre/hex) como
    catálogo aparte enlazado a variante, o mantener texto libre por ahora (dar
    recomendación con trade-offs, no decidas solo).

FASE 2 — Precios por canal:
  - Modelo de lista de precios (ej. lista_precios + lista_precios_item) con al menos dos
    canales: público (tienda web) y el precio interno actual del ERP, sin romper el
    flujo existente de cotizaciones/facturas que ya lee costos_item.precio_venta.

FASE 3 — Auth pública / API storefront:
  - Nueva estrategia de autenticación para "cliente final" (distinto del JWT de empleado
    ERP), y un guard/namespace separado para que las rutas de catálogo público NO pasen
    por VisorReadonlyGuard/RolesGuard pensados para empleados.
  - Definir cómo un cliente de tienda se relaciona (o no) con la entidad clientes actual
    (¿un cliente web es siempre un registro en clientes, o hay un nuevo concepto de
    "usuario web" que luego se vincula a un cliente/NIT al facturar?).

FASE 4 — Carrito y pedido web:
  - Entidades carrito/carrito_items.
  - Flujo de checkout que termine generando una cotización o factura real en los módulos
    existentes (reutilizar cotizaciones/facturas, no duplicar lógica de negocio).

Para cada fase, señala explícitamente los riesgos de tocar tablas que ya usa el ERP en
producción (ej. cambiar la relación 1:1 de costos_item a 1:N por presentación es un cambio
de schema con impacto en todo lo que hoy asume "un ítem = un precio" — busca esos usos
antes de tocarlo). Recuerda: synchronize está en false, todo cambio de schema va por
migración TypeORM explícita.

No implementes nada todavía — quiero primero el plan detallado por fase, con archivos a
crear/modificar y las preguntas abiertas que necesites que te resuelva antes de escribir
código.
```
