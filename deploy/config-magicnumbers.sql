-- Seed idempotente de las claves de configuración que reemplazan "magic numbers"
-- del código (antes hardcodeadas). El backend igual tiene fallback por
-- ConfiguracionService.obtener(clave, default), pero sembrarlas hace que
-- aparezcan editables en Configuración → Umbrales / Seguridad.
--
-- Aplicar en un deploy nuevo:  mysql ... gestorpincadb < config-magicnumbers.sql
-- Es seguro re-ejecutarlo (INSERT ... WHERE NOT EXISTS).

INSERT INTO configuracion_sistema (grupo, clave, valor, tipo, descripcion, updated_at, updated_by)
SELECT 'umbrales', 'ventana_consumo_dias', '30', 'number',
       'Días hacia atrás para medir el consumo de MP y proyectar los días de stock restante (debe alinear con los umbrales de stock).',
       NOW(), 'seed'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_sistema WHERE clave = 'ventana_consumo_dias');

INSERT INTO configuracion_sistema (grupo, clave, valor, tipo, descripcion, updated_at, updated_by)
SELECT 'umbrales', 'oc_demora_dias', '14', 'number',
       'Días que una OC Enviada puede estar sin recibir antes de marcarse como demorada (alerta de seguimiento a proveedor).',
       NOW(), 'seed'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_sistema WHERE clave = 'oc_demora_dias');

INSERT INTO configuracion_sistema (grupo, clave, valor, tipo, descripcion, updated_at, updated_by)
SELECT 'seguridad', 'refresh_token_dias', '7', 'number',
       'Duración del refresh token (sesión recordada). Al vencer, el usuario debe re-loguearse.',
       NOW(), 'seed'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_sistema WHERE clave = 'refresh_token_dias');
