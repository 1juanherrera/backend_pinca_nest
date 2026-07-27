-- ─────────────────────────────────────────────────────────────────────────
-- Módulo NÓMINA (básico) — esquema + parámetros de configuración.
-- Aplicar en deploy nuevo:  mysql ... gestorpincadb < nomina-schema.sql
-- Idempotente: CREATE TABLE IF NOT EXISTS + INSERT ... WHERE NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────

-- Empleados
CREATE TABLE IF NOT EXISTS nomina_empleados (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120)   NOT NULL,
  documento     VARCHAR(30)    NOT NULL,
  cargo         VARCHAR(80)    NULL,
  salario_base  DECIMAL(15,2)  NOT NULL DEFAULT 0,
  fecha_ingreso DATE           NULL,
  activo        TINYINT        NOT NULL DEFAULT 1,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at    DATETIME       NULL,
  UNIQUE KEY uq_nomina_emp_doc (documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Períodos de liquidación (una corrida de nómina)
CREATE TABLE IF NOT EXISTS nomina_periodos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  etiqueta          VARCHAR(60)  NOT NULL,
  tipo              ENUM('mensual','quincenal') NOT NULL DEFAULT 'mensual',
  fecha_inicio      DATE         NOT NULL,
  fecha_fin         DATE         NOT NULL,
  estado            ENUM('borrador','cerrada') NOT NULL DEFAULT 'borrador',
  total_devengado   DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_deducciones DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_neto        DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by        VARCHAR(60)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Detalle por empleado dentro de un período. Snapshotea nombre/documento/salario
-- para que los períodos históricos no cambien si el empleado se edita después.
CREATE TABLE IF NOT EXISTS nomina_detalle (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  periodo_id         INT           NOT NULL,
  empleado_id        INT           NOT NULL,
  empleado_nombre    VARCHAR(120)  NOT NULL,
  empleado_documento VARCHAR(30)   NOT NULL,
  cargo              VARCHAR(80)   NULL,
  salario_base       DECIMAL(15,2) NOT NULL DEFAULT 0,
  dias_trabajados    DECIMAL(5,2)  NOT NULL DEFAULT 30,
  salario_devengado  DECIMAL(15,2) NOT NULL DEFAULT 0,
  auxilio_transporte DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_devengado    DECIMAL(15,2) NOT NULL DEFAULT 0,
  deduccion_salud    DECIMAL(15,2) NOT NULL DEFAULT 0,
  deduccion_pension  DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_deducciones  DECIMAL(15,2) NOT NULL DEFAULT 0,
  neto_pagar         DECIMAL(15,2) NOT NULL DEFAULT 0,
  KEY idx_nomina_det_periodo (periodo_id),
  KEY idx_nomina_det_empleado (empleado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Parámetros de nómina (editables en Configuración → Nómina).
-- ⚠️ VALORES POR DEFECTO — el usuario DEBE actualizar SMMLV y auxilio de transporte
-- al valor legal vigente del año en curso.
INSERT INTO configuracion_sistema (grupo, clave, valor, tipo, descripcion, updated_at, updated_by)
SELECT 'nomina', 'nomina_smmlv', '1300000', 'number',
       'Salario mínimo mensual legal vigente (SMMLV). Usado para decidir si aplica auxilio de transporte (salario <= 2 SMMLV).',
       NOW(), 'seed'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_sistema WHERE clave = 'nomina_smmlv');

INSERT INTO configuracion_sistema (grupo, clave, valor, tipo, descripcion, updated_at, updated_by)
SELECT 'nomina', 'nomina_auxilio_transporte', '162000', 'number',
       'Auxilio de transporte mensual. Se paga proporcional a los días trabajados a quien gane <= 2 SMMLV.',
       NOW(), 'seed'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_sistema WHERE clave = 'nomina_auxilio_transporte');

INSERT INTO configuracion_sistema (grupo, clave, valor, tipo, descripcion, updated_at, updated_by)
SELECT 'nomina', 'nomina_pct_salud', '4', 'number',
       'Porcentaje de deducción de salud a cargo del empleado (sobre el salario devengado, sin auxilio de transporte).',
       NOW(), 'seed'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_sistema WHERE clave = 'nomina_pct_salud');

INSERT INTO configuracion_sistema (grupo, clave, valor, tipo, descripcion, updated_at, updated_by)
SELECT 'nomina', 'nomina_pct_pension', '4', 'number',
       'Porcentaje de deducción de pensión a cargo del empleado (sobre el salario devengado, sin auxilio de transporte).',
       NOW(), 'seed'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_sistema WHERE clave = 'nomina_pct_pension');

-- Registrar el módulo para admin en la matriz de permisos (los admin lo ven igual
-- por bypass, pero así aparece en la gestión de roles).
INSERT INTO permisos_rol_modulo (rol, modulo, activo)
SELECT 'admin', 'nomina', 1
WHERE NOT EXISTS (SELECT 1 FROM permisos_rol_modulo WHERE rol='admin' AND modulo='nomina');

-- ─────────────────────────────────────────────────────────────────────────
-- Pago de nómina (2026-07-24) — marcar período como pagado + desprendible.
-- estado gana 'pagada' (flujo: borrador → cerrada → pagada). MODIFY es
-- idempotente (seguro de re-ejecutar). Las 3 columnas NO llevan guarda
-- porque este MySQL 8.0.46 rechaza `ADD COLUMN IF NOT EXISTS` (error de
-- sintaxis) — si vas a re-ejecutar en un deploy que ya las tiene, comentalas.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE nomina_periodos
  MODIFY estado ENUM('borrador','cerrada','pagada') NOT NULL DEFAULT 'borrador';

ALTER TABLE nomina_periodos
  ADD COLUMN fecha_pago DATE NULL AFTER estado,
  ADD COLUMN medio_pago VARCHAR(30) NULL AFTER fecha_pago,
  ADD COLUMN pagado_por VARCHAR(60) NULL AFTER medio_pago;

-- ─────────────────────────────────────────────────────────────────────────
-- Abonos parciales + descuentos por empleado (2026-07-24, tanda 2).
-- El pago deja de ser "todo el período de una" y pasa a ser POR EMPLEADO:
-- cada renglón (nomina_detalle) tiene su propio `saldo`, que se reduce con
-- abonos (nomina_abonos) y con descuentos comerciales (nomina_descuentos,
-- ej. mercancía sacada para vender). Un descuento se aplica de inmediato si
-- el empleado tiene saldo pendiente en algún período YA CERRADO; si no, se
-- queda 'pendiente' y se aplica automáticamente al generar su PRÓXIMA
-- liquidación (crearPeriodo). Si un descuento es mayor al saldo disponible,
-- se aplica lo que alcanza y el remanente queda como un nuevo 'pendiente'
-- (arrastre FIFO — ver NominaService.aplicarDescuentosPendientes).
-- periodo.estado='pagada' ahora se AUTO-DERIVA cuando el último renglón
-- pendiente de un período cerrado llega a saldo 0 (por abono individual o
-- por el pago masivo de /periodos/:id/pagar).
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE nomina_detalle
  ADD COLUMN total_descuentos DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER neto_pagar,
  ADD COLUMN saldo DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER total_descuentos;

-- Backfill: lo ya marcado 'pagada' bajo el modelo anterior queda en saldo 0;
-- el resto arranca con saldo = neto_pagar (nada abonado todavía).
UPDATE nomina_detalle d
  JOIN nomina_periodos p ON p.id = d.periodo_id
  SET d.saldo = IF(p.estado = 'pagada', 0, d.neto_pagar);

CREATE TABLE IF NOT EXISTS nomina_abonos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  detalle_id    INT           NOT NULL,
  monto         DECIMAL(15,2) NOT NULL,
  fecha         DATE          NOT NULL,
  medio_pago    VARCHAR(30)   NOT NULL,
  observaciones VARCHAR(255)  NULL,
  created_by    VARCHAR(60)   NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_nomina_abono_detalle (detalle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS nomina_descuentos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id         INT           NOT NULL,
  concepto            VARCHAR(160)  NOT NULL,
  monto               DECIMAL(15,2) NOT NULL,
  fecha               DATE          NOT NULL,
  estado              ENUM('pendiente','aplicado') NOT NULL DEFAULT 'pendiente',
  aplicado_detalle_id INT           NULL,
  created_by          VARCHAR(60)   NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_nomina_desc_empleado (empleado_id),
  KEY idx_nomina_desc_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
