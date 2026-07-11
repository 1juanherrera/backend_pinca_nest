import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Cotizacion } from './entities/cotizacion.entity';
import { NumeracionService } from '../numeracion/numeracion.service';
import {
  CreateCotizacionDto,
  UpdateCotizacionDto,
} from './dto/cotizacion.dto';

/**
 * Réplica fiel de CotizacionesController + CotizacionesModel (CI4).
 * `convertir` (cotización→factura) NO se migra en este lote — lo sirve CI4.
 */
@Injectable()
export class CotizacionesService {
  private static readonly ESTADOS_MANUALES = [
    'Borrador',
    'Enviada',
    'Aceptada',
    'Rechazada',
    'Vencida',
  ];

  constructor(
    @InjectRepository(Cotizacion)
    private readonly repo: Repository<Cotizacion>,
    private readonly dataSource: DataSource,
    private readonly numeracion: NumeracionService,
  ) {}

  /** GET /cotizaciones (?cliente_id) → array crudo con JOIN clientes + factura. */
  findAll(clienteId?: number): Promise<Record<string, unknown>[]> {
    const params: unknown[] = [];
    let where = 'WHERE co.deleted_at IS NULL';
    if (clienteId) {
      where += ' AND co.cliente_id = ?';
      params.push(clienteId);
    }
    return this.dataSource.query(
      `SELECT co.*, c.nombre_empresa, c.nombre_encargado, f.numero AS numero_factura
         FROM cotizaciones co
         LEFT JOIN clientes c ON c.id_clientes = co.cliente_id
         LEFT JOIN facturas f ON f.id_facturas = co.facturas_id
         ${where}
        ORDER BY co.id_cotizaciones DESC`,
      params,
    );
  }

  /** GET /cotizaciones/:id → objeto crudo (header + datos cliente). */
  async findOne(id: number): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT co.*, c.nombre_empresa, c.nombre_encargado, c.email, c.telefono
         FROM cotizaciones co
         LEFT JOIN clientes c ON c.id_clientes = co.cliente_id
        WHERE co.id_cotizaciones = ? AND co.deleted_at IS NULL`,
      [id],
    );
    if (!rows.length) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada.`);
    }
    return rows[0];
  }

  /** GET /cotizaciones/:id/detalle → array crudo de líneas. */
  detalle(id: number): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT * FROM cotizaciones_detalle WHERE cotizaciones_id = ?`,
      [id],
    );
  }

  private async findEntity(id: number): Promise<Cotizacion> {
    const cot = await this.repo.findOne({ where: { id_cotizaciones: id } });
    if (!cot) throw new NotFoundException(`Cotización con ID ${id} no encontrada.`);
    return cot;
  }

  /** Fila cruda (SELECT *, como model->find de CI4; datetime como string). */
  private async rawById(id: number): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM cotizaciones WHERE id_cotizaciones = ?`,
      [id],
    );
    return rows[0];
  }

  /** POST /cotizaciones → transacción: reservar + totales server-side + líneas. */
  async create(dto: CreateCotizacionDto): Promise<Record<string, unknown>> {
    const id = await this.dataSource.transaction(async (manager) => {
      // FK cliente: existe y no soft-deleted
      const cli: { n: number }[] = await manager.query(
        `SELECT COUNT(*) AS n FROM clientes WHERE id_clientes = ? AND deleted_at IS NULL`,
        [dto.cliente_id],
      );
      if (!Number(cli[0].n)) {
        throw new BadRequestException(
          'El cliente seleccionado no existe o fue eliminado.',
        );
      }

      const numero = dto.numero
        ? dto.numero
        : await this.numeracion.reservar('cotizacion', manager);

      // Totales en el servidor (pesos enteros COP), idéntico a CI4.
      let subtotal = 0;
      const lineas: [string, number, number, number, number][] = [];
      for (const it of dto.items) {
        const cantidad = Number(it.cantidad) || 0;
        const precio = Number(it.precio_unit) || 0;
        const descPct = Number(it.descuento_pct) || 0;
        const subLinea = Math.round(cantidad * precio * (1 - descPct / 100));
        subtotal += subLinea;
        lineas.push([it.descripcion ?? '', cantidad, precio, descPct, subLinea]);
      }
      const descuento = Number(dto.descuento) || 0;
      const impuestos = Number(dto.impuestos) || 0;
      const retencion = Number(dto.retencion) || 0;
      const total = Math.round(subtotal - descuento + impuestos + -retencion);

      const repo = manager.getRepository(Cotizacion);
      const cot = repo.create({
        numero,
        cliente_id: dto.cliente_id,
        fecha_cotizacion: dto.fecha_cotizacion,
        fecha_vencimiento: dto.fecha_vencimiento,
        subtotal: String(subtotal),
        descuento: String(descuento),
        impuestos: String(impuestos),
        retencion: String(retencion),
        total: String(total),
        estado: dto.estado || 'Borrador',
        observaciones: dto.observaciones ?? null,
        facturas_id: null,
      });
      const saved = await repo.save(cot);

      for (const l of lineas) {
        await manager.query(
          `INSERT INTO cotizaciones_detalle
             (cotizaciones_id, descripcion, cantidad, precio_unit, descuento_pct, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [saved.id_cotizaciones, l[0], l[1], l[2], l[3], l[4]],
        );
      }

      return saved.id_cotizaciones;
    });
    return this.rawById(id);
  }

  /** PUT /cotizaciones/:id → edita cabecera. Bloquea si Convertida. */
  async update(id: number, dto: UpdateCotizacionDto): Promise<Record<string, unknown>> {
    const cot = await this.findEntity(id);
    if (cot.estado === 'Convertida') {
      throw new BadRequestException(
        'No se puede editar una cotización ya convertida.',
      );
    }
    // Los montos son decimal (string en la entidad); convertir desde number.
    const patch: Record<string, unknown> = {};
    if (dto.cliente_id !== undefined) patch.cliente_id = dto.cliente_id;
    if (dto.fecha_cotizacion !== undefined) patch.fecha_cotizacion = dto.fecha_cotizacion;
    if (dto.fecha_vencimiento !== undefined) patch.fecha_vencimiento = dto.fecha_vencimiento;
    if (dto.descuento !== undefined) patch.descuento = String(dto.descuento);
    if (dto.impuestos !== undefined) patch.impuestos = String(dto.impuestos);
    if (dto.retencion !== undefined) patch.retencion = String(dto.retencion);
    if (dto.observaciones !== undefined) patch.observaciones = dto.observaciones;
    await this.repo.update(id, patch);
    return this.rawById(id);
  }

  /** PATCH /cotizaciones/:id/estado. Convertida no es asignable ni editable. */
  async cambiarEstado(id: number, estado: string): Promise<Record<string, unknown>> {
    if (!CotizacionesService.ESTADOS_MANUALES.includes(estado)) {
      throw new BadRequestException(`Estado inválido: ${estado}`);
    }
    const cot = await this.findEntity(id);
    if (cot.estado === 'Convertida') {
      throw new BadRequestException(
        'No se puede cambiar el estado de una cotización convertida.',
      );
    }
    await this.repo.update(id, { estado });
    return this.rawById(id);
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

  /** POST /cotizaciones/:id/convertir → crea factura desde la cotización. */
  async convertir(id: number): Promise<Record<string, unknown>> {
    const cot = await this.findEntity(id);
    return this.dataSource.transaction(async (m) => {
      if (cot.estado === 'Convertida') {
        throw new BadRequestException(
          'Esta cotización ya fue convertida a factura',
        );
      }
      if (!['Aceptada', 'Enviada'].includes(cot.estado)) {
        throw new BadRequestException(
          'Solo se pueden convertir cotizaciones en estado Aceptada o Enviada',
        );
      }
      const cli: { n: number }[] = await m.query(
        `SELECT COUNT(*) AS n FROM clientes WHERE id_clientes = ? AND deleted_at IS NULL`,
        [cot.cliente_id],
      );
      if (!Number(cli[0].n)) {
        throw new BadRequestException(
          'El cliente de la cotización fue eliminado. No se puede generar la factura.',
        );
      }

      const numeroFac = await this.numeracion.reservar('factura', m);
      const dias = await this.configNum(m, 'dias_vencimiento_factura', 30);
      const insFac: { insertId: number } = await m.query(
        `INSERT INTO facturas
           (numero, cliente_id, fecha_emision, fecha_vencimiento, subtotal, descuento,
            impuestos, retencion, total, saldo_pendiente, estado, observaciones)
         VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?, ?, ?, ?, ?, 'Pendiente', ?)`,
        [
          numeroFac,
          cot.cliente_id,
          dias,
          cot.subtotal,
          cot.descuento,
          cot.impuestos,
          cot.retencion,
          cot.total,
          cot.total,
          `Generada desde cotización ${cot.numero}`,
        ],
      );
      const facturaId = insFac.insertId;

      const items: Record<string, unknown>[] = await m.query(
        `SELECT * FROM cotizaciones_detalle WHERE cotizaciones_id = ?`,
        [id],
      );
      for (const it of items) {
        await m.query(
          `INSERT INTO facturas_detalle (facturas_id, descripcion, cantidad, precio_unit, descuento_pct, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            facturaId,
            it.descripcion,
            it.cantidad,
            it.precio_unit,
            it.descuento_pct ?? 0,
            it.subtotal,
          ],
        );
      }

      await m.query(
        `UPDATE cotizaciones SET estado = 'Convertida', facturas_id = ? WHERE id_cotizaciones = ?`,
        [facturaId, id],
      );

      const fac: Record<string, unknown>[] = await m.query(
        `SELECT * FROM facturas WHERE id_facturas = ?`,
        [facturaId],
      );
      return {
        status: 201,
        message: `Cotización convertida. Factura ${numeroFac} creada.`,
        data: fac[0],
      };
    });
  }

  /** DELETE /cotizaciones/:id → soft-delete. Bloquea si Convertida. */
  async remove(id: number): Promise<void> {
    const cot = await this.findEntity(id);
    if (cot.estado === 'Convertida') {
      throw new BadRequestException(
        'No se puede eliminar una cotización convertida.',
      );
    }
    await this.repo.softDelete(id);
  }
}
