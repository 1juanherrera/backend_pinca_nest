-- ============================================================================
--  Índices recomendados para escalabilidad — PINCA (Tanda 3, 2026-07-15)
-- ============================================================================
--  Motivación: los listados y agregaciones filtran/ordenan por columnas que
--  probablemente NO tienen índice (fechas, estados, FKs compuestas). Sin índice,
--  MySQL hace full-scan → se degrada a medida que crecen las tablas.
--
--  ⚠️ CÓMO USAR ESTE ARCHIVO (NO lo corras a ciegas):
--   1. Revisá los índices YA existentes por tabla:  SHOW INDEX FROM <tabla>;
--      (InnoDB ya indexa las FKs automáticamente, así que varias columnas *_id
--       pueden estar cubiertas. NO dupliques.)
--   2. Verificá que los NOMBRES DE COLUMNA coincidan con tu schema real.
--   3. Aplicá SOLO los que falten. Crear un índice bloquea escrituras un momento
--      en tablas grandes → hacelo en ventana de baja carga (o con pt-online-schema-change).
--   4. Crear un índice que ya existe (mismo nombre) da error, pero NO corrompe datos.
--
--  Nota: MySQL 8.0 NO soporta "CREATE INDEX IF NOT EXISTS". Por eso van con
--  nombres distintivos (idx_pinca_*) para que sea fácil detectar duplicados.
-- ============================================================================

-- ── Facturas: listados, cartera (aging/mora), dashboard, top-deudores ──
CREATE INDEX idx_pinca_fac_estado_del      ON facturas (estado, deleted_at);
CREATE INDEX idx_pinca_fac_cliente_del     ON facturas (cliente_id, deleted_at);
CREATE INDEX idx_pinca_fac_femision_del    ON facturas (fecha_emision, deleted_at);
CREATE INDEX idx_pinca_fac_fvenc_del       ON facturas (fecha_vencimiento, deleted_at);

-- ── Cotizaciones / Remisiones / Órdenes de compra: listados por estado ──
CREATE INDEX idx_pinca_cot_estado_del      ON cotizaciones (estado, deleted_at);
CREATE INDEX idx_pinca_rem_estado_del      ON remisiones (estado, deleted_at);
CREATE INDEX idx_pinca_oc_estado_del       ON ordenes_compra (estado, deleted_at);
CREATE INDEX idx_pinca_oc_fesperada        ON ordenes_compra (fecha_esperada);

-- ── Pagos / Notas crédito: recálculo de saldo por factura ──
CREATE INDEX idx_pinca_pago_factura        ON pagos_cliente (facturas_id);
CREATE INDEX idx_pinca_nc_factura_estado   ON notas_credito (facturas_id, estado);

-- ── Movimiento de inventario: kardex, movimientos-hoy, filtros por fecha ──
CREATE INDEX idx_pinca_mov_fecha           ON movimiento_inventario (fecha_movimiento);
CREATE INDEX idx_pinca_mov_item            ON movimiento_inventario (item_general_id, fecha_movimiento);
CREATE INDEX idx_pinca_mov_bodega          ON movimiento_inventario (bodega_id, fecha_movimiento);

-- ── Capas de inventario: stock/FIFO por ítem (estado=1 activas) ──
CREATE INDEX idx_pinca_capa_item_estado    ON inventario_capas (item_general_id, estado);

-- ── Inventario (stock por bodega) ──
CREATE INDEX idx_pinca_inv_item_bodega     ON inventario (item_general_id, bodegas_id);

-- ── Producción / consumo / costeo ──
CREATE INDEX idx_pinca_prep_estado_fecha   ON preparaciones (estado, fecha_creacion);
CREATE INDEX idx_pinca_pid_prep            ON produccion_insumos_detalle (preparacion_id);
CREATE INDEX idx_pinca_pid_item            ON produccion_insumos_detalle (item_general_id);

-- ── Formulaciones / costos por ítem ──
CREATE INDEX idx_pinca_form_item_estado    ON formulaciones (item_general_id, estado);
CREATE INDEX idx_pinca_igf_form            ON item_general_formulaciones (formulaciones_id);
CREATE INDEX idx_pinca_costositem_item     ON costos_item (item_general_id);

-- ── Auditoría / notificaciones (crecen sin límite) ──
CREATE INDEX idx_pinca_login_created_ip    ON login_attempts (created_at, ip_address);
CREATE INDEX idx_pinca_notif_user_leida    ON notificaciones (user_id, leida);

-- ============================================================================
--  PENDIENTE relacionado (requiere probar en runtime): reescribir los filtros
--  `DATE(columna) = / BETWEEN ...` como rangos SARGABLES para que estos índices
--  se usen de verdad. Ej. en dashboard/inventario:
--     DATE(fecha_emision) BETWEEN DATE_FORMAT(CURDATE(),'%Y-%m-01') AND LAST_DAY(CURDATE())
--   →  fecha_emision >= DATE_FORMAT(CURDATE(),'%Y-%m-01')
--      AND fecha_emision <  DATE_ADD(LAST_DAY(CURDATE()), INTERVAL 1 DAY)
--     DATE(fecha_movimiento) = CURDATE()
--   →  fecha_movimiento >= CURDATE() AND fecha_movimiento < CURDATE() + INTERVAL 1 DAY
--  Envolver la columna en DATE() ANULA el índice. Cuidado con el off-by-one del
--  límite superior (por eso es "< día siguiente", no "<= último día").
-- ============================================================================
