import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfiguracionService } from '../configuracion/configuracion.service';

const ESTADOS = "('Pendiente','Parcial','Vencida')";

/** Réplica fiel de CarteraController + CarteraModel (CI4). Solo lectura (aging/mora). */
@Injectable()
export class CarteraService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cfg: ConfiguracionService,
  ) {}

  private async scalar(sql: string, params: unknown[] = []): Promise<number> {
    const rows: { v: string | null }[] = await this.dataSource.query(sql, params);
    return Number(rows[0]?.v ?? 0);
  }

  async resumen(): Promise<Record<string, unknown>> {
    const total_cartera = await this.scalar(
      `SELECT COALESCE(SUM(saldo_pendiente),0) AS v FROM facturas
        WHERE estado IN ${ESTADOS} AND deleted_at IS NULL`,
    );
    const cartera_vencida = await this.scalar(
      `SELECT COALESCE(SUM(saldo_pendiente),0) AS v FROM facturas
        WHERE fecha_vencimiento < CURDATE() AND estado IN ${ESTADOS} AND deleted_at IS NULL`,
    );
    const recaudo_mes = await this.scalar(
      `SELECT COALESCE(SUM(monto),0) AS v FROM pagos_cliente
        WHERE fecha_pago >= DATE_FORMAT(CURDATE(),'%Y-%m-01') AND fecha_pago <= LAST_DAY(CURDATE())`,
    );
    const clientes_en_mora = await this.scalar(
      `SELECT COUNT(DISTINCT cliente_id) AS v FROM facturas
        WHERE fecha_vencimiento < CURDATE() AND estado IN ${ESTADOS} AND deleted_at IS NULL`,
    );
    const viejaRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT f.numero, f.fecha_vencimiento, DATEDIFF(CURDATE(), f.fecha_vencimiento) AS dias_mora
         FROM facturas f
        WHERE f.estado IN ${ESTADOS} AND f.fecha_vencimiento < CURDATE() AND f.deleted_at IS NULL
        ORDER BY f.fecha_vencimiento ASC LIMIT 1`,
    );
    return {
      total_cartera,
      cartera_vencida,
      recaudo_mes,
      clientes_en_mora,
      factura_mas_vieja: viejaRows[0] ?? null,
    };
  }

  async aging(): Promise<Record<string, unknown>> {
    // Umbrales de aging desde Configuración → Umbrales (antes hardcodeados 30/60).
    // Las KEYS (dias_1_30/dias_31_60/dias_60_mas) NO cambian (el frontend/dashboard
    // las consume); solo se ajustan los cortes y los labels.
    const warning = Number(await this.cfg.obtener('mora_warning_dias', 30));
    const critica = Number(await this.cfg.obtener('mora_critica_dias', 60));

    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT f.id_facturas, f.numero, f.cliente_id, f.saldo_pendiente,
              f.fecha_vencimiento, f.estado,
              c.nombre_empresa, c.nombre_encargado, c.ciudad,
              c.plazo_pago, c.tipo AS cliente_tipo,
              DATEDIFF(CURDATE(), f.fecha_vencimiento) AS dias_mora
         FROM facturas f
         LEFT JOIN clientes c ON c.id_clientes = f.cliente_id
        WHERE f.estado IN ${ESTADOS} AND f.saldo_pendiente > 0 AND f.deleted_at IS NULL
        ORDER BY dias_mora DESC`,
    );
    const grupos: Record<string, { label: string; monto: number; facturas: Record<string, unknown>[] }> = {
      corriente:   { label: 'Corriente', monto: 0, facturas: [] },
      dias_1_30:   { label: `1 – ${warning} días`, monto: 0, facturas: [] },
      dias_31_60:  { label: `${warning + 1} – ${critica} días`, monto: 0, facturas: [] },
      dias_60_mas: { label: `Más de ${critica}`, monto: 0, facturas: [] },
    };
    for (const f of rows) {
      const dias = Number(f.dias_mora);
      const key =
        dias <= 0 ? 'corriente' : dias <= warning ? 'dias_1_30' : dias <= critica ? 'dias_31_60' : 'dias_60_mas';
      grupos[key].monto += Number(f.saldo_pendiente);
      grupos[key].facturas.push(f);
    }
    const total_mora =
      grupos.dias_1_30.monto + grupos.dias_31_60.monto + grupos.dias_60_mas.monto;
    return { grupos, total_mora };
  }

  async clientesPorCiudad(): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT c.id_clientes, c.nombre_empresa, c.nombre_encargado,
              COALESCE(NULLIF(TRIM(c.ciudad),''), 'Sin ciudad') AS ciudad,
              c.tipo, c.telefono, c.email, c.plazo_pago,
              COUNT(DISTINCT f.id_facturas) AS total_facturas,
              COALESCE(SUM(f.saldo_pendiente), 0) AS saldo_total,
              COUNT(DISTINCT CASE
                WHEN f.fecha_vencimiento < CURDATE()
                 AND f.estado IN ${ESTADOS}
                THEN f.id_facturas END) AS facturas_vencidas,
              COALESCE(SUM(CASE
                WHEN f.fecha_vencimiento < CURDATE()
                 AND f.estado IN ${ESTADOS}
                THEN f.saldo_pendiente ELSE 0 END), 0) AS saldo_vencido
         FROM clientes c
         LEFT JOIN facturas f
           ON f.cliente_id = c.id_clientes
          AND f.deleted_at IS NULL
          AND f.estado IN ${ESTADOS}
        WHERE c.deleted_at IS NULL
        GROUP BY c.id_clientes
       HAVING total_facturas > 0
        ORDER BY ciudad, c.nombre_empresa`,
    );
    return rows;
  }

  async crearSaldoInicial(dto: {
    cliente_id: number;
    total: number;
    observaciones?: string;
    fecha_emision?: string;
    fecha_vencimiento?: string;
  }): Promise<Record<string, unknown>> {
    if (!dto.cliente_id) throw new BadRequestException('Cliente requerido');
    if (!dto.total || dto.total <= 0) throw new BadRequestException('El monto debe ser mayor a 0');

    const cliRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id_clientes FROM clientes WHERE id_clientes = ? AND deleted_at IS NULL`,
      [dto.cliente_id],
    );
    if (!cliRows.length) throw new NotFoundException('Cliente no encontrado');

    const [{ seq }]: [{ seq: number }] = await this.dataSource.query(
      `SELECT COUNT(*) + 1 AS seq FROM facturas WHERE numero LIKE 'SI-%'`,
    );
    const numero = `SI-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

    const fechaEmision = dto.fecha_emision || new Date().toISOString().slice(0, 10);
    const fechaVencimiento = dto.fecha_vencimiento || null;

    const result = await this.dataSource.query(
      `INSERT INTO facturas
         (numero, cliente_id, fecha_emision, fecha_vencimiento, subtotal, descuento, impuestos, retencion, total, saldo_pendiente, observaciones, estado)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, 'Pendiente')`,
      [numero, dto.cliente_id, fechaEmision, fechaVencimiento, dto.total, dto.total, dto.total, dto.observaciones || null],
    );

    return {
      id_facturas: result.insertId,
      numero,
      cliente_id: dto.cliente_id,
      total: dto.total,
      saldo_pendiente: dto.total,
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento,
      estado: 'Pendiente',
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //  CUENTAS POR PAGAR (proveedores / órdenes de compra)
  // ═══════════════════════════════════════════════════════════════

  private static readonly OC_PENDIENTES = "('Enviada','Recibida')";

  async resumenPagar(): Promise<Record<string, unknown>> {
    const total_por_pagar = await this.scalar(
      `SELECT COALESCE(SUM(total),0) AS v FROM ordenes_compra
        WHERE estado IN ${CarteraService.OC_PENDIENTES} AND deleted_at IS NULL`,
    );
    const ocs_pendientes = await this.scalar(
      `SELECT COUNT(*) AS v FROM ordenes_compra
        WHERE estado IN ${CarteraService.OC_PENDIENTES} AND deleted_at IS NULL`,
    );
    const ocs_recibidas_sin_pagar = await this.scalar(
      `SELECT COALESCE(SUM(total),0) AS v FROM ordenes_compra
        WHERE estado = 'Recibida' AND deleted_at IS NULL`,
    );
    const proveedores_con_deuda = await this.scalar(
      `SELECT COUNT(DISTINCT proveedor_id) AS v FROM ordenes_compra
        WHERE estado IN ${CarteraService.OC_PENDIENTES} AND deleted_at IS NULL`,
    );
    const oc_mas_antigua: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT oc.numero, oc.fecha, DATEDIFF(CURDATE(), oc.fecha) AS dias
         FROM ordenes_compra oc
        WHERE oc.estado IN ${CarteraService.OC_PENDIENTES} AND oc.deleted_at IS NULL
        ORDER BY oc.fecha ASC LIMIT 1`,
    );
    return {
      total_por_pagar,
      ocs_pendientes,
      ocs_recibidas_sin_pagar,
      proveedores_con_deuda,
      oc_mas_antigua: oc_mas_antigua[0] ?? null,
    };
  }

  async agingPagar(): Promise<Record<string, unknown>> {
    const warning = Number(await this.cfg.obtener('mora_warning_dias', 30));
    const critica = Number(await this.cfg.obtener('mora_critica_dias', 60));

    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT oc.id_orden AS id_ordenes_compra, oc.numero, oc.proveedor_id, oc.total,
              oc.fecha, oc.estado,
              p.nombre_empresa, p.nombre_encargado, p.numero_documento,
              DATEDIFF(CURDATE(), oc.fecha) AS dias_antiguedad
         FROM ordenes_compra oc
         LEFT JOIN proveedor p ON p.id_proveedor = oc.proveedor_id
        WHERE oc.estado IN ${CarteraService.OC_PENDIENTES}
          AND oc.deleted_at IS NULL
        ORDER BY dias_antiguedad DESC`,
    );

    const grupos: Record<string, { label: string; monto: number; ordenes: Record<string, unknown>[] }> = {
      reciente:    { label: 'Reciente', monto: 0, ordenes: [] },
      dias_1_30:   { label: `1 – ${warning} días`, monto: 0, ordenes: [] },
      dias_31_60:  { label: `${warning + 1} – ${critica} días`, monto: 0, ordenes: [] },
      dias_60_mas: { label: `Más de ${critica}`, monto: 0, ordenes: [] },
    };

    for (const oc of rows) {
      const dias = Number(oc.dias_antiguedad);
      const key =
        dias <= 0 ? 'reciente' : dias <= warning ? 'dias_1_30' : dias <= critica ? 'dias_31_60' : 'dias_60_mas';
      grupos[key].monto += Number(oc.total);
      grupos[key].ordenes.push(oc);
    }

    const total_antiguo =
      grupos.dias_1_30.monto + grupos.dias_31_60.monto + grupos.dias_60_mas.monto;
    return { grupos, total_antiguo };
  }

  async proveedoresPorPagar(): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT p.id_proveedor AS id_proveedores, p.nombre_empresa, p.nombre_encargado,
              p.numero_documento, p.telefono, p.email,
              COUNT(DISTINCT oc.id_orden) AS total_ocs,
              COALESCE(SUM(oc.total), 0) AS saldo_total,
              COUNT(DISTINCT CASE WHEN oc.estado = 'Recibida' THEN oc.id_orden END) AS ocs_recibidas,
              COALESCE(SUM(CASE WHEN oc.estado = 'Recibida' THEN oc.total ELSE 0 END), 0) AS saldo_recibido,
              MIN(oc.fecha) AS oc_mas_antigua
         FROM proveedor p
         INNER JOIN ordenes_compra oc
           ON oc.proveedor_id = p.id_proveedor
          AND oc.deleted_at IS NULL
          AND oc.estado IN ${CarteraService.OC_PENDIENTES}
        WHERE p.deleted_at IS NULL
        GROUP BY p.id_proveedor
        ORDER BY saldo_total DESC`,
    );
    return rows;
  }

  async estadoCuentaProveedor(proveedorId: number): Promise<Record<string, unknown>> {
    if (!proveedorId) throw new BadRequestException('ID de proveedor no proporcionado');
    const provRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM proveedor WHERE id_proveedor = ? AND deleted_at IS NULL`,
      [proveedorId],
    );
    if (!provRows.length) {
      throw new NotFoundException(`Proveedor con ID ${proveedorId} no encontrado.`);
    }
    const ordenes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT oc.*,
              p.nombre_empresa AS proveedor_nombre,
              COALESCE(pag.total_pagado, 0) AS total_pagado_oc,
              oc.total - COALESCE(pag.total_pagado, 0) AS saldo_pendiente_oc
         FROM ordenes_compra oc
         LEFT JOIN proveedor p ON p.id_proveedor = oc.proveedor_id
         LEFT JOIN (
           SELECT orden_id, SUM(monto) AS total_pagado
             FROM pagos_proveedor
            GROUP BY orden_id
         ) pag ON pag.orden_id = oc.id_orden
        WHERE oc.proveedor_id = ? AND oc.deleted_at IS NULL
        ORDER BY oc.fecha DESC`,
      [proveedorId],
    );
    const pagos: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pp.*
         FROM pagos_proveedor pp
         INNER JOIN ordenes_compra oc ON oc.id_orden = pp.orden_id
        WHERE oc.proveedor_id = ? AND oc.deleted_at IS NULL
        ORDER BY pp.fecha_pago DESC`,
      [proveedorId],
    );
    const total_deuda = ordenes
      .filter((oc) => oc.estado === 'Enviada' || oc.estado === 'Recibida')
      .reduce((a, oc) => a + Number(oc.saldo_pendiente_oc ?? oc.total), 0);
    const total_pagado = pagos.reduce((a, p) => a + Number(p.monto), 0);
    return {
      proveedor: provRows[0],
      ordenes,
      pagos,
      total_deuda,
      total_pagado,
    };
  }

  async registrarPagoProveedor(dto: {
    orden_id: number;
    proveedor_id: number;
    monto: number;
    tipo: string;
    metodo_pago: string;
    fecha_pago: string;
    numero_referencia?: string;
    observaciones?: string;
  }): Promise<Record<string, unknown>> {
    if (!dto.orden_id) throw new BadRequestException('Orden de compra requerida');
    if (!dto.monto || dto.monto <= 0) throw new BadRequestException('El monto debe ser mayor a 0');
    if (!dto.metodo_pago) throw new BadRequestException('Método de pago requerido');

    return this.dataSource.transaction(async (manager) => {
      const [oc]: Record<string, unknown>[] = await manager.query(
        `SELECT oc.id_orden, oc.total, oc.estado, oc.proveedor_id
           FROM ordenes_compra oc
          WHERE oc.id_orden = ? AND oc.deleted_at IS NULL
          FOR UPDATE`,
        [dto.orden_id],
      );
      if (!oc) throw new NotFoundException('Orden de compra no encontrada');
      if (oc.estado === 'Pagada') throw new BadRequestException('Esta orden ya está pagada');
      if (oc.estado === 'Borrador' || oc.estado === 'Cancelada') {
        throw new BadRequestException(`No se puede pagar una orden en estado ${oc.estado}`);
      }

      const [{ pagado }]: [{ pagado: string }] = await manager.query(
        `SELECT COALESCE(SUM(monto), 0) AS pagado FROM pagos_proveedor WHERE orden_id = ?`,
        [dto.orden_id],
      );
      const saldo = Number(oc.total) - Number(pagado);
      if (dto.monto > saldo + 0.01) {
        throw new BadRequestException(`El monto ($${dto.monto}) supera el saldo pendiente ($${saldo.toFixed(2)})`);
      }

      const result = await manager.query(
        `INSERT INTO pagos_proveedor
           (orden_id, proveedor_id, fecha_pago, monto, metodo_pago, tipo, numero_referencia, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.orden_id,
          dto.proveedor_id || oc.proveedor_id,
          dto.fecha_pago || new Date().toISOString().slice(0, 10),
          dto.monto,
          dto.metodo_pago,
          dto.tipo || 'pago_total',
          dto.numero_referencia || null,
          dto.observaciones || null,
        ],
      );

      const nuevoSaldo = saldo - dto.monto;
      if (nuevoSaldo <= 0.01) {
        await manager.query(
          `UPDATE ordenes_compra SET estado = 'Pagada' WHERE id_orden = ?`,
          [dto.orden_id],
        );
      }

      return {
        id_pago_proveedor: result.insertId,
        orden_id: dto.orden_id,
        proveedor_id: dto.proveedor_id || oc.proveedor_id,
        monto: dto.monto,
        tipo: dto.tipo || 'pago_total',
        metodo_pago: dto.metodo_pago,
        fecha_pago: dto.fecha_pago,
        saldo_restante: Math.max(nuevoSaldo, 0),
        estado_oc: nuevoSaldo <= 0.01 ? 'Pagada' : oc.estado,
      };
    });
  }

  async estadoCuenta(clienteId: number): Promise<Record<string, unknown>> {
    if (!clienteId) throw new BadRequestException('ID de cliente no proporcionado');
    const cliRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM clientes WHERE id_clientes = ? AND deleted_at IS NULL`,
      [clienteId],
    );
    if (!cliRows.length) {
      throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado.`);
    }
    const facturas: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM facturas WHERE cliente_id = ? AND deleted_at IS NULL ORDER BY fecha_emision DESC`,
      [clienteId],
    );
    for (const f of facturas) {
      f.pagos = await this.dataSource.query(
        `SELECT * FROM pagos_cliente WHERE facturas_id = ? ORDER BY fecha_pago DESC`,
        [f.id_facturas],
      );
    }
    const total_deuda = facturas
      .filter((f) => f.estado !== 'Pagada')
      .reduce((a, f) => a + Number(f.saldo_pendiente), 0);
    const total_pagado = await this.scalar(
      `SELECT COALESCE(SUM(monto),0) AS v FROM pagos_cliente WHERE clientes_id = ?`,
      [clienteId],
    );
    return {
      cliente: cliRows[0],
      facturas,
      total_deuda,
      total_pagado,
      saldo_total: total_deuda,
    };
  }
}
