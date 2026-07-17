import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { FacturasService } from '../facturas/facturas.service';
import { CreatePagoDto, UpdatePagoDto } from './dto/pago.dto';

const ALLOWED = [
  'fecha_pago',
  'monto',
  'metodo_pago',
  'tipo',
  'numero_referencia',
  'observaciones',
  'clientes_id',
  'facturas_id',
];

/** Réplica fiel de PagosClienteController (CI4). Reusa FacturasService.recalcularSaldo. */
@Injectable()
export class PagosClienteService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly facturas: FacturasService,
  ) {}

  private baseSelect(where: string, params: unknown[]): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT p.*, c.nombre_empresa, c.nombre_encargado, f.numero AS numero_factura
         FROM pagos_cliente p
         LEFT JOIN clientes c ON c.id_clientes = p.clientes_id
         LEFT JOIN facturas f ON f.id_facturas = p.facturas_id
        ${where}
        ORDER BY p.fecha_pago DESC`,
      params,
    );
  }

  /**
   * GET /pagos_cliente
   * Retrocompatible: sin `page` → array crudo (comportamiento histórico; usado por
   * los drawers scoped por cliente/factura). Con `page` → { data, meta, stats }.
   *   Scope: cliente_id, factura_id. Filtros: tipo, metodo_pago, q, desde/hasta.
   *   stats = KPIs (count, Σ monto, counts por tipo) sobre el SCOPE (no los filtros),
   *   igual que las FlowCards de PagosPage.
   */
  async index(
    query: Record<string, string> = {},
  ): Promise<
    | Record<string, unknown>[]
    | {
        data: Record<string, unknown>[];
        meta: { total: number; page: number; limit: number; pages: number };
        stats: Record<string, number>;
      }
  > {
    // Scope (define el universo de KPIs).
    const scope: string[] = [];
    const scopeParams: unknown[] = [];
    if (query.cliente_id) { scope.push('p.clientes_id = ?'); scopeParams.push(query.cliente_id); }
    if (query.factura_id) { scope.push('p.facturas_id = ?'); scopeParams.push(query.factura_id); }

    // Filtros de UI (acotan la tabla, no los KPIs).
    const where = [...scope];
    const params = [...scopeParams];
    if (query.tipo) { where.push('p.tipo = ?'); params.push(query.tipo); }
    if (query.metodo_pago) { where.push('p.metodo_pago = ?'); params.push(query.metodo_pago); }
    if (query.q) {
      where.push('(p.numero_referencia LIKE ? OR c.nombre_empresa LIKE ? OR c.nombre_encargado LIKE ?)');
      const t = `%${query.q}%`;
      params.push(t, t, t);
    }
    if (query.desde) { where.push('DATE(p.fecha_pago) >= ?'); params.push(query.desde); }
    if (query.hasta) { where.push('DATE(p.fecha_pago) <= ?'); params.push(query.hasta); }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    // Modo legacy.
    if (!query.page) {
      return this.baseSelect(whereSql, params);
    }

    // Modo paginado.
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const joinFrom = `FROM pagos_cliente p
         LEFT JOIN clientes c ON c.id_clientes = p.clientes_id
         LEFT JOIN facturas f ON f.id_facturas = p.facturas_id`;

    const [countRow] = (await this.dataSource.query(
      `SELECT COUNT(*) AS total ${joinFrom} ${whereSql}`,
      params,
    )) as Array<{ total: number }>;
    const total = Number(countRow?.total ?? 0);

    const data: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT p.*, c.nombre_empresa, c.nombre_encargado, f.numero AS numero_factura
         ${joinFrom} ${whereSql}
        ORDER BY p.fecha_pago DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    // KPIs sobre el SCOPE (cliente/factura), independientes de los filtros de UI.
    const scopeSql = scope.length ? 'WHERE ' + scope.join(' AND ') : '';
    const [st] = (await this.dataSource.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(p.monto), 0) AS monto_total,
              SUM(p.tipo = 'abono')      AS abonos,
              SUM(p.tipo = 'anticipo')   AS anticipos,
              SUM(p.tipo = 'pago_total') AS pagos_total
         FROM pagos_cliente p ${scopeSql}`,
      scopeParams,
    )) as Array<Record<string, unknown>>;

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      stats: {
        total: Number(st?.total ?? 0),
        monto_total: Number(st?.monto_total ?? 0),
        abonos: Number(st?.abonos ?? 0),
        anticipos: Number(st?.anticipos ?? 0),
        pagos_total: Number(st?.pagos_total ?? 0),
      },
    };
  }

  async show(id: number): Promise<Record<string, unknown>> {
    const rows = await this.baseSelect('WHERE p.id_pagos_cliente = ?', [id]);
    if (!rows.length) throw new NotFoundException(`Pago con ID ${id} no encontrado.`);
    return rows[0];
  }

  private async find(id: number): Promise<Record<string, unknown> | null> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM pagos_cliente WHERE id_pagos_cliente = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  private async insertPago(
    m: EntityManager,
    data: Record<string, unknown>,
  ): Promise<number> {
    const cols = ALLOWED.filter((k) => data[k] !== undefined);
    const res: { insertId: number } = await m.query(
      `INSERT INTO pagos_cliente (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map((k) => data[k]),
    );
    return res.insertId;
  }

  async create(dto: CreatePagoDto): Promise<Record<string, unknown>> {
    const id = await this.dataSource.transaction(async (m) => {
      const monto = Number(dto.monto);
      const facturaId =
        dto.facturas_id && Number(dto.facturas_id) > 0 ? Number(dto.facturas_id) : null;

      if (facturaId) {
        const fRows: Record<string, unknown>[] = await m.query(
          `SELECT * FROM facturas WHERE id_facturas = ? AND deleted_at IS NULL FOR UPDATE`,
          [facturaId],
        );
        const factura = fRows[0];
        if (!factura) throw new BadRequestException('La factura indicada no existe');
        if (Number(factura.cliente_id) !== Number(dto.clientes_id)) {
          throw new BadRequestException('La factura no pertenece al cliente indicado');
        }
        if (factura.estado === 'Pagada') {
          throw new BadRequestException('La factura ya está completamente pagada');
        }
        if (factura.estado === 'Anulada') {
          throw new BadRequestException('No se puede registrar un pago sobre una factura anulada');
        }
        const saldo = Number(factura.saldo_pendiente);
        if (monto > saldo) {
          throw new BadRequestException(
            `El monto (${monto}) supera el saldo pendiente de la factura (${saldo})`,
          );
        }
      }

      const newId = await this.insertPago(m, { ...dto });
      if (facturaId) await this.facturas.recalcularSaldo(facturaId, m);
      return newId;
    });
    return {
      status: 201,
      message: 'Pago registrado exitosamente',
      data: await this.find(id),
    };
  }

  async update(id: number, dto: UpdatePagoDto): Promise<Record<string, unknown>> {
    const existing = await this.find(id);
    if (!existing) throw new NotFoundException(`Pago con ID ${id} no encontrado.`);

    await this.dataSource.transaction(async (m) => {
      const facturaId =
        dto.facturas_id !== undefined
          ? Number(dto.facturas_id) || null
          : existing.facturas_id
            ? Number(existing.facturas_id)
            : null;
      const facturaOriginal = existing.facturas_id ? Number(existing.facturas_id) : null;
      const monto = dto.monto !== undefined ? Number(dto.monto) : Number(existing.monto);

      if (facturaId) {
        const fRows: Record<string, unknown>[] = await m.query(
          `SELECT * FROM facturas WHERE id_facturas = ? AND deleted_at IS NULL FOR UPDATE`,
          [facturaId],
        );
        const factura = fRows[0];
        if (!factura) throw new BadRequestException('La factura indicada no existe');
        const clienteId =
          dto.clientes_id !== undefined ? Number(dto.clientes_id) : Number(existing.clientes_id);
        if (Number(factura.cliente_id) !== clienteId) {
          throw new BadRequestException('La factura no pertenece al cliente indicado');
        }
        const saldoDisponible = Number(factura.saldo_pendiente) + Number(existing.monto);
        if (monto > saldoDisponible) {
          throw new BadRequestException(
            `El monto (${monto}) supera el saldo disponible (${saldoDisponible})`,
          );
        }
      }

      const cols = ALLOWED.filter(
        (k) => (dto as Record<string, unknown>)[k] !== undefined,
      );
      if (cols.length) {
        await m.query(
          `UPDATE pagos_cliente SET ${cols.map((k) => `${k} = ?`).join(', ')} WHERE id_pagos_cliente = ?`,
          [...cols.map((k) => (dto as Record<string, unknown>)[k]), id],
        );
      }

      if (facturaId) await this.facturas.recalcularSaldo(facturaId, m);
      if (facturaOriginal && facturaOriginal !== facturaId) {
        await this.facturas.recalcularSaldo(facturaOriginal, m);
      }
    });

    return {
      status: 200,
      message: `Pago ${id} actualizado correctamente`,
      data: await this.find(id),
    };
  }

  async remove(id: number): Promise<Record<string, unknown>> {
    const existing = await this.find(id);
    if (!existing) throw new NotFoundException(`Pago con ID ${id} no encontrado.`);
    await this.dataSource.transaction(async (m) => {
      const facturaId = existing.facturas_id ? Number(existing.facturas_id) : null;
      await m.query(`DELETE FROM pagos_cliente WHERE id_pagos_cliente = ?`, [id]);
      if (facturaId) await this.facturas.recalcularSaldo(facturaId, m);
    });
    return { message: `Pago ${id} eliminado` };
  }
}
