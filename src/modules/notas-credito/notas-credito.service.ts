import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { FacturasService } from '../facturas/facturas.service';
import { NumeracionService } from '../numeracion/numeracion.service';
import { CreateNotaCreditoDto } from './dto/nota-credito.dto';

/** Réplica fiel de NotasCreditoController (CI4). Las NC solo se crean y se anulan. */
@Injectable()
export class NotasCreditoService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly facturas: FacturasService,
    private readonly numeracion: NumeracionService,
  ) {}

  private baseSelect(where: string, params: unknown[]): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT nc.*, c.nombre_empresa, c.nombre_encargado, f.numero AS numero_factura
         FROM notas_credito nc
         LEFT JOIN clientes c ON c.id_clientes = nc.clientes_id
         LEFT JOIN facturas f ON f.id_facturas = nc.facturas_id
        ${where}
        ORDER BY nc.creado_en DESC`,
      params,
    );
  }

  index(clienteId?: number, facturaId?: number): Promise<Record<string, unknown>[]> {
    const w: string[] = [];
    const p: unknown[] = [];
    if (clienteId) { w.push('nc.clientes_id = ?'); p.push(clienteId); }
    if (facturaId) { w.push('nc.facturas_id = ?'); p.push(facturaId); }
    return this.baseSelect(w.length ? 'WHERE ' + w.join(' AND ') : '', p);
  }

  async show(id: number): Promise<Record<string, unknown>> {
    const rows = await this.baseSelect('WHERE nc.id_nota_credito = ?', [id]);
    if (!rows.length) {
      throw new NotFoundException(`Nota crédito con ID ${id} no encontrada.`);
    }
    return rows[0];
  }

  private async find(id: number): Promise<Record<string, unknown> | null> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM notas_credito WHERE id_nota_credito = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create(dto: CreateNotaCreditoDto): Promise<Record<string, unknown>> {
    const id = await this.dataSource.transaction(async (m) => {
      const monto = Number(dto.monto);
      const facturaId = Number(dto.facturas_id);
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
        throw new BadRequestException('No se puede crear una nota crédito sobre una factura ya pagada');
      }
      if (factura.estado === 'Anulada') {
        throw new BadRequestException('No se puede crear una nota crédito sobre una factura anulada');
      }
      if (monto > Number(factura.saldo_pendiente)) {
        throw new BadRequestException(
          `El monto (${monto}) supera el saldo pendiente (${factura.saldo_pendiente})`,
        );
      }

      const numero = await this.numeracion.reservar('nota_credito', m);
      const res: { insertId: number } = await m.query(
        `INSERT INTO notas_credito (numero, facturas_id, clientes_id, fecha, monto, motivo, estado)
         VALUES (?, ?, ?, ?, ?, ?, 'Activa')`,
        [numero, facturaId, dto.clientes_id, dto.fecha, monto, dto.motivo],
      );
      await this.facturas.recalcularSaldo(facturaId, m);
      return res.insertId;
    });
    return {
      status: 201,
      message: 'Nota crédito creada exitosamente',
      data: await this.find(id),
    };
  }

  async anular(id: number): Promise<Record<string, unknown>> {
    const nota = await this.find(id);
    if (!nota) throw new NotFoundException(`Nota crédito con ID ${id} no encontrada.`);
    if (nota.estado === 'Anulada') {
      throw new BadRequestException('La nota crédito ya está anulada');
    }
    await this.dataSource.transaction(async (m) => {
      await m.query(`UPDATE notas_credito SET estado = 'Anulada' WHERE id_nota_credito = ?`, [id]);
      await this.facturas.recalcularSaldo(Number(nota.facturas_id), m);
    });
    return {
      status: 200,
      message: `Nota crédito ${nota.numero} anulada correctamente`,
      data: await this.find(id),
    };
  }
}
