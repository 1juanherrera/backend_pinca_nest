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
