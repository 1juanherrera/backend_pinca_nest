import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Remision } from './entities/remision.entity';
import { NumeracionService } from '../numeracion/numeracion.service';
import { CreateRemisionDto, UpdateRemisionDto } from './dto/remision.dto';

/**
 * Réplica fiel de RemisionesController + RemisionesModel (CI4) — parte SAFE-NOW.
 * DIFERIDO a CI4: cambiarEstado (despacho→capas FIFO) y convertir (→factura).
 * `create` NO descuenta stock (eso ocurría al pasar a Despachada, estado que el
 * enum vivo no incluye).
 */
@Injectable()
export class RemisionesService {
  constructor(
    @InjectRepository(Remision)
    private readonly repo: Repository<Remision>,
    private readonly dataSource: DataSource,
    private readonly numeracion: NumeracionService,
  ) {}

  /** Mapea una fila cruda al shape _format de CI4 (14 claves, orden exacto). */
  private format(r: Record<string, unknown>): Record<string, unknown> {
    return {
      id_remisiones: r.id_remisiones,
      numero: r.numero,
      cliente_id: r.cliente_id,
      nombre_empresa: r.nombre_empresa ?? null,
      nombre_encargado: r.nombre_encargado ?? null,
      nit_cliente: r.nit_cliente ?? null,
      fecha_remision: r.fecha_remision,
      estado: r.estado,
      direccion_entrega: r.direccion_entrega ?? null,
      observaciones: r.observaciones ?? null,
      facturas_id: r.facturas_id ?? null,
      numero_factura: r.numero_factura ?? null,
      movimiento_inventario_id: r.movimiento_inventario_id ?? null,
      creado_en: r.creado_en,
    };
  }

  private readonly SELECT_HEADER = `
    SELECT r.*, c.nombre_empresa, c.nombre_encargado,
           c.numero_documento AS nit_cliente, f.numero AS numero_factura
      FROM remisiones r
      LEFT JOIN clientes c ON c.id_clientes = r.cliente_id
      LEFT JOIN facturas f ON f.id_facturas = r.facturas_id`;

  /** GET /remisiones (?cliente_id&factura_id) → array crudo (_format). */
  async index(
    clienteId?: number,
    facturaId?: number,
  ): Promise<Record<string, unknown>[]> {
    let where = 'WHERE r.deleted_at IS NULL';
    const params: unknown[] = [];
    if (clienteId) {
      where += ' AND r.cliente_id = ?';
      params.push(clienteId);
    }
    if (facturaId) {
      where += ' AND r.facturas_id = ?';
      params.push(facturaId);
    }
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `${this.SELECT_HEADER} ${where} ORDER BY r.id_remisiones DESC`,
      params,
    );
    return rows.map((r) => this.format(r));
  }

  /** GET /remisiones/:id/detalle → array crudo de líneas (6 claves, cast float). */
  async getDetalle(id: number): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id_detalle, remisiones_id, descripcion, cantidad, precio_unit, subtotal
         FROM remisiones_detalle WHERE remisiones_id = ? ORDER BY id_detalle ASC`,
      [id],
    );
    return rows.map((d) => ({
      id_detalle: d.id_detalle,
      remisiones_id: d.remisiones_id,
      descripcion: d.descripcion,
      cantidad: Number(d.cantidad),
      precio_unit: Number(d.precio_unit),
      subtotal: Number(d.subtotal),
    }));
  }

  /** GET /remisiones/:id → _format + items + subtotal (suma). 404 si no existe. */
  async getById(id: number): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `${this.SELECT_HEADER} WHERE r.id_remisiones = ? AND r.deleted_at IS NULL`,
      [id],
    );
    if (!rows.length) {
      throw new NotFoundException(`Remisión #${id} no encontrada.`);
    }
    const items = await this.getDetalle(id);
    const subtotal = items.reduce((a, i) => a + Number(i.subtotal), 0);
    return { ...this.format(rows[0]), items, subtotal };
  }

  /** POST /remisiones → transacción: reservar + header + líneas (sin capas). */
  async create(dto: CreateRemisionDto): Promise<Record<string, unknown>> {
    const id = await this.dataSource.transaction(async (manager) => {
      const cli: { n: number }[] = await manager.query(
        `SELECT COUNT(*) AS n FROM clientes WHERE id_clientes = ? AND deleted_at IS NULL`,
        [dto.cliente_id],
      );
      if (!Number(cli[0].n)) {
        throw new BadRequestException(
          `El cliente #${dto.cliente_id} no existe o está archivado.`,
        );
      }

      const numero = dto.numero
        ? dto.numero
        : await this.numeracion.reservar('remision', manager);

      const repo = manager.getRepository(Remision);
      const rem = repo.create({
        numero,
        cliente_id: dto.cliente_id,
        fecha_remision: dto.fecha_remision ?? new Date().toISOString().slice(0, 10),
        estado: 'Pendiente',
        direccion_entrega: dto.direccion_entrega ?? null,
        observaciones: dto.observaciones ?? null,
      });
      const saved = await repo.save(rem);

      for (const it of dto.items) {
        await manager.query(
          `INSERT INTO remisiones_detalle
             (remisiones_id, item_general_id, bodega_id, descripcion, cantidad, precio_unit, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            saved.id_remisiones,
            it.item_general_id ?? null,
            it.bodega_id ?? null,
            it.descripcion,
            it.cantidad,
            it.precio_unit,
            it.subtotal ?? 0,
          ],
        );
      }
      return saved.id_remisiones;
    });
    return this.getById(id);
  }

  /** PUT /remisiones/:id → whitelist de 4 campos. Bloquea si Anulada. */
  async update(id: number, dto: UpdateRemisionDto): Promise<Record<string, unknown>> {
    const rem = await this.repo.findOne({ where: { id_remisiones: id } });
    if (!rem) throw new NotFoundException(`Remisión con ID ${id} no encontrada.`);
    if (rem.estado === 'Anulada') {
      throw new BadRequestException(
        'No se puede editar una remisión anulada.',
      );
    }
    const patch: Record<string, unknown> = {};
    if (dto.cliente_id !== undefined) patch.cliente_id = dto.cliente_id;
    if (dto.fecha_remision !== undefined) patch.fecha_remision = dto.fecha_remision;
    if (dto.direccion_entrega !== undefined) patch.direccion_entrega = dto.direccion_entrega;
    if (dto.observaciones !== undefined) patch.observaciones = dto.observaciones;
    if (Object.keys(patch).length) await this.repo.update(id, patch);
    return this.getById(id);
  }

  private async configNum(
    m: import('typeorm').EntityManager,
    clave: string,
    fb: number,
  ): Promise<number> {
    try {
      const r: { valor: unknown }[] = await m.query(
        `SELECT valor FROM configuracion_sistema WHERE clave = ? LIMIT 1`,
        [clave],
      );
      return r.length ? Number(r[0].valor) || fb : fb;
    } catch {
      return fb;
    }
  }

  /** POST /remisiones/:id/convertir → crea factura desde la remisión (con IVA). */
  async convertir(id: number): Promise<Record<string, unknown>> {
    const rem = await this.repo.findOne({ where: { id_remisiones: id } });
    if (!rem) throw new NotFoundException(`Remisión con ID ${id} no encontrada.`);
    return this.dataSource.transaction(async (m) => {
      if (rem.estado === 'Facturada') {
        throw new BadRequestException('Esta remisión ya fue convertida a factura');
      }
      if (rem.estado === 'Anulada') {
        throw new BadRequestException('No se puede convertir una remisión anulada');
      }

      const items: Record<string, unknown>[] = await m.query(
        `SELECT descripcion, cantidad, precio_unit, subtotal FROM remisiones_detalle WHERE remisiones_id = ? ORDER BY id_detalle ASC`,
        [id],
      );
      const subtotal = items.reduce((a, i) => a + Number(i.subtotal), 0);
      const ivaPct = await this.configNum(m, 'iva_default', 19);
      const iva = Math.round(((subtotal * ivaPct) / 100) * 100) / 100;
      const total = subtotal + iva;

      const numeroFac = await this.numeracion.reservar('factura', m);
      const insFac: { insertId: number } = await m.query(
        `INSERT INTO facturas
           (numero, cliente_id, fecha_emision, fecha_vencimiento, subtotal, descuento,
            impuestos, retencion, total, saldo_pendiente, estado, observaciones)
         VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), ?, 0, ?, 0, ?, ?, 'Pendiente', ?)`,
        [
          numeroFac,
          rem.cliente_id,
          subtotal,
          iva,
          total,
          total,
          `Generada desde remisión ${rem.numero}`,
        ],
      );
      const facturaId = insFac.insertId;

      for (const it of items) {
        await m.query(
          `INSERT INTO facturas_detalle (facturas_id, descripcion, cantidad, precio_unit, descuento_pct, subtotal)
           VALUES (?, ?, ?, ?, 0, ?)`,
          [facturaId, it.descripcion, it.cantidad, it.precio_unit, it.subtotal],
        );
      }

      await m.query(
        `UPDATE remisiones SET estado = 'Facturada', facturas_id = ? WHERE id_remisiones = ?`,
        [facturaId, id],
      );

      const fac: Record<string, unknown>[] = await m.query(
        `SELECT * FROM facturas WHERE id_facturas = ?`,
        [facturaId],
      );
      return {
        status: 201,
        message: `Remisión convertida. Factura ${numeroFac} creada.`,
        data: fac[0],
      };
    });
  }

  /** DELETE /remisiones/:id → soft-delete. Bloquea si Facturada. */
  async remove(id: number): Promise<void> {
    const rem = await this.repo.findOne({ where: { id_remisiones: id } });
    if (!rem) throw new NotFoundException(`Remisión con ID ${id} no encontrada.`);
    if (rem.estado === 'Facturada') {
      throw new BadRequestException(
        'No se puede eliminar una remisión que ya tiene factura.',
      );
    }
    await this.repo.softDelete(id);
  }

  /**
   * PATCH /remisiones/:id/estado — cambia el estado con lock pesimista.
   *
   * ⚠️ La maquinaria de STOCK de CI4 (descontarStockDespacho/restaurarStockAnulacion) está
   * MUERTA: 'Despachada' NO está en el enum `remisiones.estado` y la tabla
   * `remision_consumo_capas` NO existe → cualquier flujo que la toque tira error en CI4.
   * Se replica SOLO la transición de estado viva (la que efectivamente funciona en CI4).
   */
  async cambiarEstado(id: number, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const estado = (body?.estado as string) ?? null;
    const permitidos = ['Pendiente', 'Despachada', 'Facturada', 'Anulada'];
    if (!estado || !permitidos.includes(estado)) {
      throw new BadRequestException(`Estado no válido. Permitidos: ${permitidos.join(', ')}`);
    }
    await this.dataSource.transaction(async (m) => {
      const existing = (await m.query(
        `SELECT estado FROM remisiones WHERE id_remisiones = ? AND deleted_at IS NULL FOR UPDATE`,
        [id],
      ))[0];
      if (!existing) throw new NotFoundException(`Remisión con ID ${id} no encontrada.`);
      if (existing.estado === 'Anulada') {
        throw new BadRequestException('No se puede cambiar el estado de una remisión anulada');
      }
      await m.query(`UPDATE remisiones SET estado = ? WHERE id_remisiones = ?`, [estado, id]);
    });
    return { status: 200, message: `Remisión marcada como ${estado}`, data: await this.getById(id) };
  }
}
