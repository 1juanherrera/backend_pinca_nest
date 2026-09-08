-- Agregar campo dias_pago a clientes (texto libre: "15 y 30", "Viernes", etc.)
ALTER TABLE clientes
  ADD COLUMN dias_pago VARCHAR(100) NULL DEFAULT NULL
  AFTER plazo_pago;
