import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { Factura } from './entities/factura.entity';
import { NumeracionService } from '../numeracion/numeracion.service';
import { CreateFacturaDto, UpdateFacturaDto } from './dto/factura.dto';

/**
 * Réplica fiel de FacturasController + FacturasModel (CI4).
 * recalcularSaldo cruza pagos_cliente + notas_credito (SQL directo, no capas).
 * `inventario_capas` NO interviene en facturas (cobranza pura).
 */
@Injectable()
export class FacturasService {
  private readonly logger = new Logger('facturas');
  private static readonly ESTADOS = [
    'Pendiente',
    'Pagada',
    'Parcial',
    'Vencida',
    'Anulada',
  ];

  constructor(
    @InjectRepository(Factura)
    private readonly repo: Repository<Factura>,
    private readonly dataSource: DataSource,
    private readonly numeracion: NumeracionService,
  ) {}

  // ── Lecturas (raw SQL, shapes exactos de CI4; index/show NO filtran deleted_at) ──

  /**
   * Listado de facturas.
   * - SIN `page` (query vacío) → devuelve el ARRAY completo, igual que siempre
   *   (retrocompatible: Cartera y cualquier consumidor no migrado siguen andando).
   * - CON `page` → devuelve paginado server-side `{ data, meta, stats }`:
   *     · data  = página filtrada (estado/q/cliente_id) + LIMIT/OFFSET
   *     · meta  = { total (del filtro), page, limit, pages }
   *     · stats = KPIs GLOBALES (todas las facturas, sin filtro) para las FlowCards
   */
  async findAll(
    query: Record<string, string | undefined> = {},
  ): Promise<
    | Record<string, unknown>[]
    | {
        data: Record<string, unknown>[];
        meta: Record<string, number>;
        stats: Record<string, number>;
      }
  > {
    const baseSelect = `SELECT f.*, c.nombre_empresa, c.nombre_encargado,
              c.numero_documento AS nit_cliente, c.tipo AS cliente_tipo,
              c.ciudad, c.plazo_pago
         FROM facturas f
         LEFT JOIN clientes c ON c.id_clientes = f.cliente_id`;

    // Retrocompatibilidad: sin paginación → array completo (comportamiento histórico).
    if (query.page == null) {
      return this.dataSource.query(`${baseSelect} ORDER BY f.id_facturas DESC`);
    }

    // Filtros (whitelist; valores por ?)
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.estado) {
      where.push('f.estado = ?');
      params.push(query.estado);
    }
    if (query.cliente_id) {
      where.push('f.cliente_id = ?');
      params.push(Number(query.cliente_id));
    }
    if (query.q) {
      where.push(
        '(f.numero LIKE ? OR c.nombre_empresa LIKE ? OR c.nombre_encargado LIKE ? OR c.ciudad LIKE ?)',
      );
      const like = `%${query.q}%`;
      params.push(like, like, like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
    const page = Math.max(Number(query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const data: Record<string, unknown>[] = await this.dataSource.query(
      `${baseSelect} ${whereSql} ORDER BY f.id_facturas DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const total = Number(
      (
        await this.dataSource.query(
          `SELECT COUNT(*) AS n FROM facturas f LEFT JOIN clientes c ON c.id_clientes = f.cliente_id ${whereSql}`,
          params,
        )
      )[0].n,
    );
    // KPIs GLOBALES (sin filtros) — replican metrics de FacturacionTab por estado almacenado.
    const s = (
      await this.dataSource.query(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(estado='Pendiente'),0) AS pendiente,
                COALESCE(SUM(estado='Pagada'),0)    AS pagada,
                COALESCE(SUM(estado='Vencida'),0)   AS vencida,
                COALESCE(SUM(CASE WHEN estado='Pendiente' THEN saldo_pendiente ELSE 0 END),0) AS monto_pendiente
           FROM facturas`,
      )
    )[0];

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      stats: {
        total: Number(s.total),
        pendiente: Number(s.pendiente),
        pagada: Number(s.pagada),
        vencida: Number(s.vencida),
        monto_pendiente: Number(s.monto_pendiente),
      },
    };
  }

  async findOne(id: number): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT f.*, c.nombre_empresa, c.nombre_encargado, c.numero_documento,
              c.email, c.telefono, c.direccion
         FROM facturas f
         LEFT JOIN clientes c ON c.id_clientes = f.cliente_id
        WHERE f.id_facturas = ?`,
      [id],
    );
    if (!rows.length) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada.`);
    }
    return rows[0];
  }

  detalle(id: number): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT * FROM facturas_detalle WHERE facturas_id = ?`,
      [id],
    );
  }

  abonos(id: number): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT p.*, c.nombre_empresa, c.nombre_encargado
         FROM pagos_cliente p
         LEFT JOIN clientes c ON c.id_clientes = p.clientes_id
        WHERE p.facturas_id = ?
        ORDER BY p.fecha_pago DESC`,
      [id],
    );
  }

  /** Fila cruda SELECT * (como model->get de CI4; datetime como string). */
  private async rawById(id: number): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM facturas WHERE id_facturas = ?`,
      [id],
    );
    return rows[0];
  }

  async remision(id: number): Promise<Record<string, unknown> | null> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM remisiones WHERE facturas_id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  // ── recalcularSaldo (idéntico a FacturasModel::recalcularSaldo) ──

  /** Recalcula saldo/estado de una factura. Reusado por pagos_cliente y notas_credito. */
  async recalcularSaldo(id: number, m: EntityManager): Promise<void> {
    // FOR UPDATE como PRIMER statement: bloquea la fila de la factura durante
    // toda la transacción del caller. Así, aunque un caller de reversa (anular
    // pago/NC) no la haya lockeado antes, este recálculo serializa contra un
    // pago concurrente y no puede sobrescribir el saldo con un valor stale
    // (lost update). Los callers que ya la lockearon simplemente re-usan el lock.
    const fRows: { estado: string; total: string }[] = await m.query(
      `SELECT estado, total FROM facturas WHERE id_facturas = ? AND deleted_at IS NULL FOR UPDATE`,
      [id],
    );
    if (!fRows.length) return;
    const factura = fRows[0];
    if (factura.estado === 'Anulada') return;

    const total = Number(factura.total ?? 0);
    const pRows: { t: string | null }[] = await m.query(
      `SELECT SUM(monto) AS t FROM pagos_cliente WHERE facturas_id = ?`,
      [id],
    );
    const pagos = Number(pRows[0].t ?? 0);
    const ncRows: { t: string | null }[] = await m.query(
      `SELECT SUM(monto) AS t FROM notas_credito WHERE facturas_id = ? AND estado = 'Activa'`,
      [id],
    );
    const nc = Number(ncRows[0].t ?? 0);

    const saldo = Math.max(0, total - pagos - nc);
    const estado = factura.estado;
    let nuevoEstado: string;
    if (saldo <= 0.01) {
      nuevoEstado = 'Pagada';
    } else if (pagos + nc > 0) {
      nuevoEstado = estado === 'Vencida' ? 'Vencida' : 'Parcial';
    } else {
      nuevoEstado = ['Pagada', 'Parcial'].includes(estado) ? 'Pendiente' : estado;
    }

    await m.query(
      `UPDATE facturas SET saldo_pendiente = ?, estado = ? WHERE id_facturas = ?`,
      [Math.round(saldo * 100) / 100, nuevoEstado, id],
    );
  }

  // ── create ──

  async create(dto: CreateFacturaDto): Promise<Record<string, unknown>> {
    const id = await this.dataSource.transaction(async (manager) => {
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
        : await this.numeracion.reservar('factura', manager);

      const repo = manager.getRepository(Factura);
      const factura = repo.create({
        numero,
        cliente_id: dto.cliente_id,
        fecha_emision: dto.fecha_emision ?? null,
        fecha_vencimiento: dto.fecha_vencimiento ?? null,
        subtotal: dto.subtotal != null ? String(dto.subtotal) : null,
        descuento: String(dto.descuento ?? 0),
        impuestos: dto.impuestos != null ? String(dto.impuestos) : null,
        retencion: dto.retencion != null ? String(dto.retencion) : null,
        total: String(dto.total),
        saldo_pendiente: String(dto.total),
        observaciones: dto.observaciones ?? null,
      });
      const saved = await repo.save(factura);

      for (const it of dto.items) {
        await manager.query(
          `INSERT INTO facturas_detalle (facturas_id, descripcion, cantidad, precio_unit)
           VALUES (?, ?, ?, ?)`,
          [saved.id_facturas, it.descripcion, it.cantidad, it.precio_unit],
        );
      }

      return saved.id_facturas;
    });
    return this.rawById(id);
  }

  // ── update ──

  async update(id: number, dto: UpdateFacturaDto): Promise<Record<string, unknown>> {
    const exists = await this.repo.findOne({ where: { id_facturas: id } });
    if (!exists) throw new NotFoundException(`Factura con ID ${id} no encontrada.`);

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Factura);
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(dto)) {
        if (v !== undefined) patch[k] = v;
      }
      await repo.update(id, patch);
      if (Object.prototype.hasOwnProperty.call(dto, 'total')) {
        await this.recalcularSaldo(id, manager);
      }
    });
    return this.rawById(id);
  }

  // ── cambiarEstado (con lock + reverso de pagos/NC al anular) ──

  private async aplicarCambioEstado(
    m: EntityManager,
    id: number,
    estado: string,
    username: string,
  ): Promise<void> {
    const rows: { id_facturas: number; estado: string; total: string }[] =
      await m.query(
        `SELECT id_facturas, estado, total FROM facturas
          WHERE id_facturas = ? AND deleted_at IS NULL FOR UPDATE`,
        [id],
      );
    if (!rows.length) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada.`);
    }
    const factura = rows[0];
    const estadoActual = factura.estado;

    if (estadoActual === 'Anulada' && estado !== 'Anulada') {
      throw new ConflictException(
        'La factura ya está anulada. No se puede cambiar a otro estado.',
      );
    }

    if (estado === 'Anulada') {
      const pagosCnt: { n: number }[] = await m.query(
        `SELECT COUNT(*) AS n FROM pagos_cliente WHERE facturas_id = ?`,
        [id],
      );
      await m.query(`DELETE FROM pagos_cliente WHERE facturas_id = ?`, [id]);
      const ncCnt: { n: number }[] = await m.query(
        `SELECT COUNT(*) AS n FROM notas_credito WHERE facturas_id = ? AND estado = 'Activa'`,
        [id],
      );
      await m.query(
        `UPDATE notas_credito SET estado = 'Anulada' WHERE facturas_id = ? AND estado = 'Activa'`,
        [id],
      );
      await m.query(
        `UPDATE facturas SET estado = 'Anulada', saldo_pendiente = ? WHERE id_facturas = ?`,
        [factura.total, id],
      );
      this.logger.log(
        `[FACTURA_ANULADA] id=${id} por ${username} — pagos revertidos=${pagosCnt[0].n}, NC anuladas=${ncCnt[0].n}`,
      );
    } else if (estado === 'Pagada') {
      await this.recalcularSaldo(id, m);
      await m.query(
        `UPDATE facturas SET estado = 'Pagada', saldo_pendiente = 0 WHERE id_facturas = ?`,
        [id],
      );
    } else {
      await m.query(`UPDATE facturas SET estado = ? WHERE id_facturas = ?`, [
        estado,
        id,
      ]);
    }
  }

  async cambiarEstado(
    id: number,
    estado: string,
    username: string,
  ): Promise<Record<string, unknown>> {
    if (!FacturasService.ESTADOS.includes(estado)) {
      throw new BadRequestException(`Estado no permitido: ${estado}`);
    }
    await this.dataSource.transaction((m) =>
      this.aplicarCambioEstado(m, id, estado, username),
    );
    return this.findOne(id);
  }

  async bulkCambiarEstado(
    ids: number[],
    estado: string,
    username: string,
  ): Promise<{ actualizadas: number; fallidas: { id: number; motivo: string }[] }> {
    if (!FacturasService.ESTADOS.includes(estado)) {
      throw new BadRequestException(`Estado no permitido: ${estado}`);
    }
    const unicos = [...new Set(ids.map((n) => Number(n)).filter((n) => n > 0))];
    if (!unicos.length) {
      throw new BadRequestException('Se requiere al menos un id válido.');
    }

    const fallidas: { id: number; motivo: string }[] = [];
    let actualizadas = 0;
    await this.dataSource.transaction(async (m) => {
      for (const id of unicos) {
        try {
          await this.aplicarCambioEstado(m, id, estado, username);
          actualizadas++;
        } catch (e) {
          const motivo =
            e instanceof HttpException ? (e.message ?? 'error') : 'error';
          fallidas.push({ id, motivo });
        }
      }
    });
    return { actualizadas, fallidas };
  }

  async remove(id: number, username: string): Promise<void> {
    const exists = await this.repo.findOne({ where: { id_facturas: id } });
    if (!exists) throw new NotFoundException(`Factura con ID ${id} no encontrada.`);
    await this.repo.softDelete(id);
    this.logger.log(`[FACTURA_DELETE] id=${id} por ${username}`);
  }
}
