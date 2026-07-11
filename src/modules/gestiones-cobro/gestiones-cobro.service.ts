import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import {
  CreateGestionCobroDto,
  UpdateGestionCobroDto,
} from './dto/gestion-cobro.dto';

const ALLOWED = ['facturas_id', 'clientes_id', 'tipo', 'resultado', 'proxima_gestion'];

/** Réplica fiel de GestionesCobroController (CI4). Tabla gestiones_cobro (PK id_gestion). */
@Injectable()
export class GestionesCobroService {
  constructor(private readonly dataSource: DataSource) {}

  private baseSelect(where: string, params: unknown[]): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT g.*, c.nombre_empresa, c.nombre_encargado, f.numero AS numero_factura
         FROM gestiones_cobro g
         LEFT JOIN clientes c ON c.id_clientes = g.clientes_id
         LEFT JOIN facturas f ON f.id_facturas = g.facturas_id
        ${where}
        ORDER BY g.creado_en DESC`,
      params,
    );
  }

  index(clienteId?: number, facturaId?: number): Promise<Record<string, unknown>[]> {
    const w: string[] = [];
    const p: unknown[] = [];
    if (clienteId) { w.push('g.clientes_id = ?'); p.push(clienteId); }
    if (facturaId) { w.push('g.facturas_id = ?'); p.push(facturaId); }
    return this.baseSelect(w.length ? 'WHERE ' + w.join(' AND ') : '', p);
  }

  async show(id: number): Promise<Record<string, unknown>> {
    const rows = await this.baseSelect('WHERE g.id_gestion = ?', [id]);
    if (!rows.length) {
      throw new NotFoundException(`Gestión de cobro con ID ${id} no encontrada.`);
    }
    return rows[0];
  }

  private async find(id: number): Promise<Record<string, unknown> | null> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM gestiones_cobro WHERE id_gestion = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  private buildSet(dto: Record<string, unknown>): { cols: string[]; vals: unknown[] } {
    const cols: string[] = [];
    const vals: unknown[] = [];
    for (const k of ALLOWED) {
      if (dto[k] !== undefined) {
        cols.push(`${k} = ?`);
        vals.push(dto[k]);
      }
    }
    return { cols, vals };
  }

  async create(dto: CreateGestionCobroDto): Promise<Record<string, unknown>> {
    const { cols, vals } = this.buildSet(dto as unknown as Record<string, unknown>);
    const res: { insertId: number } = await this.dataSource.query(
      `INSERT INTO gestiones_cobro SET ${cols.join(', ')}`,
      vals,
    );
    return {
      status: 201,
      message: 'Gestión de cobro registrada exitosamente',
      data: await this.find(res.insertId),
    };
  }

  async update(id: number, dto: UpdateGestionCobroDto): Promise<Record<string, unknown>> {
    const existing = await this.find(id);
    if (!existing) throw new NotFoundException(`Gestión de cobro con ID ${id} no encontrada.`);
    const { cols, vals } = this.buildSet(dto as unknown as Record<string, unknown>);
    if (cols.length) {
      await this.dataSource.query(
        `UPDATE gestiones_cobro SET ${cols.join(', ')} WHERE id_gestion = ?`,
        [...vals, id],
      );
    }
    return {
      status: 200,
      message: `Gestión ${id} actualizada correctamente`,
      data: await this.find(id),
    };
  }

  async remove(id: number): Promise<Record<string, unknown>> {
    const existing = await this.find(id);
    if (!existing) throw new NotFoundException(`Gestión de cobro con ID ${id} no encontrada.`);
    await this.dataSource.query(`DELETE FROM gestiones_cobro WHERE id_gestion = ?`, [id]);
    return { message: `Gestión ${id} eliminada` };
  }
}
