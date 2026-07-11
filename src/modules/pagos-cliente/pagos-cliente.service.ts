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

  index(clienteId?: number, facturaId?: number): Promise<Record<string, unknown>[]> {
    const w: string[] = [];
    const p: unknown[] = [];
    if (clienteId) { w.push('p.clientes_id = ?'); p.push(clienteId); }
    if (facturaId) { w.push('p.facturas_id = ?'); p.push(facturaId); }
    return this.baseSelect(w.length ? 'WHERE ' + w.join(' AND ') : '', p);
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
