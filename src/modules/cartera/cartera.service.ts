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
