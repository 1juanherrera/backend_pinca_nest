# PENDIENTE — Migraciones faltantes de Cuentas por pagar

**Estado:** pendiente · **Creado:** 2026-11-12

## Contexto

El 2026-11-12 se hizo pull de ambos repos (backend: 7 commits, frontend: 2) y se comparó la BD local
con el backup `gestorpincadb_backup_20261112_133834.sql`.

Hallazgos:

- El backup era más reciente que la BD local: tenía todo lo de la local y además 26 items, 29 relaciones
  item-proveedor, 4 facturas, 1 pago de cliente y la ciudad de los clientes llena.
- La BD local **no tenía** `pagos_proveedor` ni el estado `'Pagada'` en `ordenes_compra.estado`.
  El módulo de Cuentas por pagar (commit `147b073`, `src/modules/cartera/cartera.service.ts`) los necesita.
- **Ninguna** de las dos BD tenía `clientes.dias_pago` (migración `deploy/2026-09-07-dias-pago.sql`).

Qué se hizo en la BD local del trabajo:

1. Respaldo previo de la local (en un scratchpad temporal, no está en el repo).
2. Se restauró la BD local desde el backup del 12-nov.
3. Se aplicó `deploy/2026-09-07-dias-pago.sql`.
4. Se verificó que la API levanta (las rutas de `/api/cartera/*` responden 401 sin token).

## El problema

Los cambios de esquema de `pagos_proveedor` y del estado `'Pagada'` **se hicieron directo en la BD**:
no hay ningún `.sql` en `deploy/`. Una instalación nueva desde el repo (o el despliegue a producción)
va a quedar sin ellos y Cuentas por pagar va a fallar.

## Tareas

- [ ] Crear `deploy/2026-10-15-pagos-proveedor.sql` con el DDL de abajo (idempotente: `CREATE TABLE IF NOT EXISTS`).
- [ ] En el mismo archivo (o en uno aparte), agregar el `ALTER` del enum de `ordenes_compra.estado` para incluir `'Pagada'`.
- [ ] Revisar las otras diferencias de esquema que tenía el backup frente a la local y decidir si llevan migración:
  - `item_general.descripcion` → `varchar(255)` (en la local no aparecía igual)
  - `item_general_formulaciones.nota` → `varchar(255)` (la local tenía `varchar(150)`)
  - `item_general_formulaciones.orden` → `int` (la local tenía `smallint`)
  - `item_general_formulaciones.tipo` → `varchar(20)` (la local tenía `enum('ingrediente','instruccion','fase')`). Ojo: así se pierde la validación del enum, revisar si fue intencional.
  - Índice `idx_pinca_igf_form` en `item_general_formulaciones`
- [ ] Verificar si `deploy/init-db.sql` debe incluir todo lo anterior (instalaciones desde cero).
- [ ] Aplicar `deploy/2026-09-07-dias-pago.sql` en la BD de donde salió el backup (¿producción o la de otra persona?): allá tampoco existe `dias_pago`.
- [ ] Probar con sesión iniciada: `GET /api/cartera/resumen-pagar`, `proveedores-pagar`, `aging-pagar`, registrar un pago a proveedor y guardar un cliente con `dias_pago`.
- [ ] Probar los formularios del frontend contra los DTOs nuevos (commit `dd470db`): si se envía un campo no declarado, el backend responde 400.

## DDL de referencia (tomado del backup del 12-nov)

```sql
CREATE TABLE IF NOT EXISTS `pagos_proveedor` (
  `id_pago_proveedor` int unsigned NOT NULL AUTO_INCREMENT,
  `orden_id` int unsigned NOT NULL,
  `proveedor_id` int NOT NULL,
  `fecha_pago` date NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `metodo_pago` varchar(50) NOT NULL,
  `tipo` enum('pago_total','abono') NOT NULL DEFAULT 'pago_total',
  `numero_referencia` varchar(80) DEFAULT NULL,
  `observaciones` text,
  `usuario_id` int DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pago_proveedor`),
  KEY `idx_pago_prov_orden` (`orden_id`),
  KEY `idx_pago_prov_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_pago_prov_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_compra` (`id_orden`),
  CONSTRAINT `fk_pago_prov_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedor` (`id_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `ordenes_compra`
  MODIFY `estado` enum('Borrador','Enviada','Recibida','Cancelada','Pagada') DEFAULT 'Borrador';
```

## Cómo comparar dos BD (receta usada)

1. Cargar el dump en una BD temporal. Las líneas `mysqldump:` del inicio son advertencias del volcado y hay que quitarlas antes de importar:
   `grep -v '^mysqldump:' dump.sql | docker exec -i pinca-erp-db mysql -uroot -p<pass> cmp_backup`
2. Comparar esquema con `information_schema.columns` / `statistics`, cruzando por nombre de tabla y columna.
3. Comparar datos por llave primaria con `MD5(CONCAT_WS('|', IFNULL(CAST(col AS CHAR),'<N>'), ...))`.
   No usar `NOT IN` con tuplas: si alguna columna es NULL, la fila no se reporta.
