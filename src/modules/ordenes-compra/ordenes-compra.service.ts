import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { OrdenCompra } from './entities/orden-compra.entity';
import { NumeracionService } from '../numeracion/numeracion.service';
import { CapasService, MOV } from '../inventario/capas.service';
import {
  CreateOrdenCompraDto,
  OrdenCompraLineaDto,
  RecibirLineaDto,
  UpdateOrdenCompraDto,
} from './dto/orden-compra.dto';

/**
 * Réplica fiel de OrdenesCompraController + OrdenesCompraModel (CI4).
 * DIFERIDO a Fase 3 (capas): recibirLinea, recibir-prorrateado, lote-sugerido.
 * Esas rutas las sigue sirviendo CI4.
 */
@Injectable()
export class OrdenesCompraService {
  private readonly logger = new Logger('ordenes_compra');
  // Transiciones permitidas (idénticas a CI4).
  private static readonly TRANS: Record<string, string[]> = {
    Borrador: ['Enviada', 'Cancelada'],
    Enviada: ['Cancelada'],
    Recibida: [],
    Cancelada: [],
  };

  constructor(
    @InjectRepository(OrdenCompra)
    private readonly repo: Repository<OrdenCompra>,
    private readonly dataSource: DataSource,
    private readonly numeracion: NumeracionService,
    private readonly capas: CapasService,
  ) {}

  private enrichWithIva(row: Record<string, unknown>): Record<string, unknown> {
    const total = Number(row.total ?? 0);
    const ivaPct = Number(row.iva_pct ?? 0);
    row.total = Math.round(total * 100) / 100;
    row.iva_pct = ivaPct;
    row.iva_monto = Math.round(((total * ivaPct) / 100) * 100) / 100;
    row.total_con_iva =
      Math.round((total + (row.iva_monto as number)) * 100) / 100;
    return row;
  }

  /**
   * GET /ordenes_compra
   * Retrocompatible: sin `page` → array crudo + enrichWithIva (comportamiento
   * histórico). Con `page` → { data, meta, stats } paginado server-side, mismo
   * patrón que facturas/cotizaciones/remisiones.
   *   Filtros: estado, q (numero | proveedor).
   *   stats = KPIs globales (total/enviadas/recibidas/canceladas) sobre todo el
   *   universo no borrado, independientes de los filtros (igual que los FlowCards).
   */
  async listar(
    query: Record<string, string> = {},
  ): Promise<
    | Record<string, unknown>[]
    | {
        data: Record<string, unknown>[];
        meta: { total: number; page: number; limit: number; pages: number };
        stats: Record<string, number>;
      }
  > {
    const where: string[] = ['oc.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (query.estado) {
      where.push('oc.estado = ?');
      params.push(query.estado);
    }
    if (query.q) {
      where.push('(oc.numero LIKE ? OR p.nombre_empresa LIKE ?)');
      params.push(`%${query.q}%`, `%${query.q}%`);
    }
    const whereSql = where.join(' AND ');

    const base = `FROM ordenes_compra oc
         LEFT JOIN proveedor p ON p.id_proveedor = oc.proveedor_id
         LEFT JOIN bodegas   b ON b.id_bodegas   = oc.bodegas_id
        WHERE ${whereSql}`;

    // Modo legacy: sin paginación devuelve el array completo (enriquecido).
    if (!query.page) {
      const rows: Record<string, unknown>[] = await this.dataSource.query(
        `SELECT oc.*, p.nombre_empresa, p.nombre_encargado, b.nombre AS bodega_nombre
         ${base}
        ORDER BY oc.id_orden DESC`,
        params,
      );
      return rows.map((r) => this.enrichWithIva(r));
    }

    // Modo paginado.
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const [countRow] = (await this.dataSource.query(
      `SELECT COUNT(*) AS total ${base}`,
      params,
    )) as Array<{ total: number }>;
    const total = Number(countRow?.total ?? 0);

    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT oc.*, p.nombre_empresa, p.nombre_encargado, b.nombre AS bodega_nombre
       ${base}
      ORDER BY oc.id_orden DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    // KPIs globales (todo el universo no borrado), independientes de filtros.
    const [statsRow] = (await this.dataSource.query(
      `SELECT
          COUNT(*) AS total,
          SUM(estado = 'Enviada')   AS enviadas,
          SUM(estado = 'Recibida')  AS recibidas,
          SUM(estado = 'Cancelada') AS canceladas
         FROM ordenes_compra
        WHERE deleted_at IS NULL`,
    )) as Array<Record<string, unknown>>;

    return {
      data: rows.map((r) => this.enrichWithIva(r)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      stats: {
        total: Number(statsRow?.total ?? 0),
        enviadas: Number(statsRow?.enviadas ?? 0),
        recibidas: Number(statsRow?.recibidas ?? 0),
        canceladas: Number(statsRow?.canceladas ?? 0),
      },
    };
  }

  /** GET /ordenes_compra/:id/detalle → objeto con lineas[] + enrichWithIva. */
  async detalle(id: number): Promise<Record<string, unknown>> {
    const headers: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT oc.*, p.nombre_empresa, p.nombre_encargado, p.telefono, p.email,
              b.nombre AS bodega_nombre
         FROM ordenes_compra oc
         LEFT JOIN proveedor p ON p.id_proveedor = oc.proveedor_id
         LEFT JOIN bodegas b   ON b.id_bodegas   = oc.bodegas_id
        WHERE oc.id_orden = ? AND oc.deleted_at IS NULL`,
      [id],
    );
    if (!headers.length) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
    }
    const orden = headers[0];

    const lineasRaw: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ocd.*, ip.nombre AS item_nombre, ip.codigo AS item_codigo,
              ip.factor_conversion AS factor_conversion,
              ip.unidad_compra_id AS unidad_compra_id,
              uc.nombre AS unidad_empaque, uc.nombre AS unidad_compra_nombre,
              ig.nombre AS item_general_nombre,
              ig.unidad_almacenaje_id AS unidad_base_id,
              ub.nombre AS unidad_base_nombre
         FROM ordenes_compra_detalle ocd
         LEFT JOIN item_proveedor ip ON ip.id_item_proveedor = ocd.item_proveedor_id
         LEFT JOIN item_general ig   ON ig.id_item_general   = ocd.item_general_id
         LEFT JOIN unidad uc         ON uc.id_unidad         = ip.unidad_compra_id
         LEFT JOIN unidad ub         ON ub.id_unidad         = ig.unidad_almacenaje_id
        WHERE ocd.ordenes_compra_id = ?`,
      [id],
    );
    orden.lineas = lineasRaw.map((l) => ({
      ...l,
      cantidad: Number(l.cantidad),
      precio_unit: Number(l.precio_unit),
      subtotal: Number(l.subtotal),
      cantidad_recibida: Number(l.cantidad_recibida ?? 0),
    }));

    return this.enrichWithIva(orden);
  }

  /** GET /ordenes_compra/:id → fila cruda (find nativo, sin enrich ni lineas). */
  async show(id: number): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM ordenes_compra WHERE id_orden = ? AND deleted_at IS NULL`,
      [id],
    );
    if (!rows.length) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
    }
    return rows[0];
  }

  private async ivaDefault(manager: EntityManager): Promise<number> {
    try {
      const rows: { valor: unknown }[] = await manager.query(
        `SELECT valor FROM configuracion_sistema WHERE clave = 'iva_default' LIMIT 1`,
      );
      if (rows.length) return Number(rows[0].valor) || 19;
    } catch {
      /* si no existe la tabla config, cae al default */
    }
    return 19;
  }

  private async insertarLineas(
    manager: EntityManager,
    idOrden: number,
    lineas: OrdenCompraLineaDto[],
  ): Promise<number> {
    let total = 0;
    for (const l of lineas) {
      const subtotal = Number(l.cantidad) * Number(l.precio_unit);
      total += subtotal;
      await manager.query(
        `INSERT INTO ordenes_compra_detalle
           (ordenes_compra_id, item_proveedor_id, item_general_id, descripcion, cantidad, precio_unit, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          idOrden,
          l.item_proveedor_id,
          l.item_general_id ?? null,
          l.descripcion ?? null,
          l.cantidad,
          l.precio_unit,
          subtotal,
        ],
      );
    }
    return Math.round(total * 100) / 100;
  }

  /** POST /ordenes_compra → { mensaje, id, numero }. */
  async create(
    dto: CreateOrdenCompraDto,
  ): Promise<{ id: number; numero: string }> {
    return this.dataSource.transaction(async (manager) => {
      const prov: { n: number }[] = await manager.query(
        `SELECT COUNT(*) AS n FROM proveedor WHERE id_proveedor = ? AND deleted_at IS NULL`,
        [dto.proveedor_id],
      );
      if (!Number(prov[0].n)) {
        throw new BadRequestException(
          'El proveedor no existe o está archivado.',
        );
      }

      const numero = await this.numeracion.reservar('orden_compra', manager);
      const ivaPct = dto.iva_pct ?? (await this.ivaDefault(manager));

      const repo = manager.getRepository(OrdenCompra);
      const oc = repo.create({
        numero,
        proveedor_id: dto.proveedor_id,
        bodegas_id: dto.bodegas_id as number,
        fecha: dto.fecha ?? new Date().toISOString().slice(0, 10),
        fecha_esperada: dto.fecha_esperada ?? null,
        estado: 'Borrador',
        total: '0',
        iva_pct: String(ivaPct),
        observaciones: dto.observaciones ?? null,
      });
      const saved = await repo.save(oc);

      const total = await this.insertarLineas(
        manager,
        saved.id_orden,
        dto.lineas,
      );
      await repo.update(saved.id_orden, { total: String(total) });

      return { id: saved.id_orden, numero };
    });
  }

  /** PUT /ordenes_compra/:id → solo estado Borrador; reemplaza lineas si vienen. */
  async update(id: number, dto: UpdateOrdenCompraDto): Promise<void> {
    const oc = await this.repo.findOne({ where: { id_orden: id } });
    if (!oc) throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
    if (oc.estado !== 'Borrador') {
      throw new BadRequestException(
        'Solo se pueden editar órdenes en estado Borrador.',
      );
    }
    await this.dataSource.transaction(async (manager) => {
      const patch: Record<string, unknown> = {};
      for (const k of [
        'proveedor_id',
        'bodegas_id',
        'fecha',
        'fecha_esperada',
        'observaciones',
        'iva_pct',
      ] as const) {
        if (dto[k] !== undefined)
          patch[k] = k === 'iva_pct' ? String(dto[k]) : dto[k];
      }
      if (Object.keys(patch).length) {
        await manager.getRepository(OrdenCompra).update(id, patch);
      }
      if (dto.lineas) {
        await manager.query(
          `DELETE FROM ordenes_compra_detalle WHERE ordenes_compra_id = ?`,
          [id],
        );
        const total = await this.insertarLineas(manager, id, dto.lineas);
        await manager.query(
          `UPDATE ordenes_compra SET total = ? WHERE id_orden = ?`,
          [total, id],
        );
      }
    });
  }

  /** PATCH /ordenes_compra/:id/estado → máquina de estados con lock. */
  async cambiarEstado(id: number, estado: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const rows: { estado: string }[] = await manager.query(
        `SELECT estado FROM ordenes_compra WHERE id_orden = ? AND deleted_at IS NULL FOR UPDATE`,
        [id],
      );
      if (!rows.length) {
        throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
      }
      const actual = rows[0].estado;
      const permitidas = OrdenesCompraService.TRANS[actual] ?? [];
      if (!permitidas.includes(estado)) {
        throw new BadRequestException(
          `No se puede cambiar de ${actual} a ${estado}.`,
        );
      }
      await manager.query(
        `UPDATE ordenes_compra SET estado = ? WHERE id_orden = ?`,
        [estado, id],
      );
    });
  }

  /** DELETE /ordenes_compra/:id → hard-delete (solo Borrador). */
  async remove(id: number, username: string): Promise<void> {
    const oc = await this.repo.findOne({ where: { id_orden: id } });
    if (!oc) throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
    if (oc.estado !== 'Borrador') {
      throw new BadRequestException(
        'Solo se pueden eliminar órdenes en estado Borrador.',
      );
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM ordenes_compra_detalle WHERE ordenes_compra_id = ?`,
        [id],
      );
      await manager.query(`DELETE FROM ordenes_compra WHERE id_orden = ?`, [id]);
    });
    this.logger.log(`[OC_DELETE] id=${id} por ${username}`);
  }

  /**
   * POST /ordenes_compra/:idOrden/recibir/:idDetalle — recepción de una línea.
   * Réplica byte-por-byte de OrdenesCompraController::recibirLinea (Fase 3, capas).
   * Crea la capa de costo, actualiza inventario legacy, recalcula el promedio
   * ponderado, registra el movimiento y marca la OC Recibida si se completó.
   */
  async recibirLinea(
    idOrden: number,
    idDetalle: number,
    dto: RecibirLineaDto,
    username: string,
  ): Promise<{ mensaje: string }> {
    const orden = await this.detalle(idOrden); // 404 si no existe
    if (orden.estado !== 'Enviada') {
      throw new BadRequestException(
        'Solo se pueden recibir líneas de órdenes Enviadas.',
      );
    }
    const lineas = orden.lineas as Record<string, unknown>[];
    const linea = lineas.find((l) => Number(l.id_detalle) === idDetalle);
    if (!linea) {
      throw new NotFoundException(`Línea con ID ${idDetalle} no encontrada.`);
    }
    if (linea.recibido_en) {
      throw new BadRequestException('Esta línea ya fue recibida completamente.');
    }

    const cantidadPedida = Number(linea.cantidad);
    const recibidoPrev = Number(linea.cantidad_recibida ?? 0);
    const pendiente = Math.max(0, cantidadPedida - recibidoPrev);
    const cantidadRecibida =
      dto.cantidad_recibida != null ? Number(dto.cantidad_recibida) : pendiente;
    const bodegaId = Number(orden.bodegas_id);

    if (cantidadRecibida <= 0) {
      throw new UnprocessableEntityException({
        msg: 'Datos inválidos',
        errors: { cantidad_recibida: 'La cantidad recibida debe ser mayor a 0.' },
      });
    }
    if (cantidadRecibida > pendiente + 0.0001) {
      throw new UnprocessableEntityException({
        msg: 'Datos inválidos',
        errors: {
          cantidad_recibida: `La cantidad recibida (${cantidadRecibida}) supera el pendiente de la línea (${pendiente}).`,
        },
      });
    }

    await this.dataSource.transaction(async (m) => {
      // Re-lock + re-valida la cabecera OC dentro de la tx: si otra request la
      // canceló entre el check inicial y acá, no ingresamos stock ni pisamos su
      // estado 'Cancelada' con 'Recibida'.
      const cab = (await m.query(
        `SELECT estado FROM ordenes_compra WHERE id_orden = ? AND deleted_at IS NULL FOR UPDATE`,
        [idOrden],
      )) as Array<{ estado: string }>;
      if (!cab[0] || cab[0].estado !== 'Enviada') {
        throw new BadRequestException(
          `La orden ya no está 'Enviada' (estado: ${cab[0]?.estado ?? 'inexistente'}) — recargá la orden.`,
        );
      }

      const lockRows: {
        recibido_en: string | null;
        cantidad: string;
        cantidad_recibida: string | null;
      }[] = await m.query(
        `SELECT recibido_en, cantidad, cantidad_recibida FROM ordenes_compra_detalle WHERE id_detalle = ? FOR UPDATE`,
        [idDetalle],
      );
      if (!lockRows.length) {
        throw new BadRequestException(
          'Línea no encontrada al iniciar la transacción.',
        );
      }
      const lock = lockRows[0];
      if (lock.recibido_en) {
        throw new BadRequestException(
          'Esta línea ya fue recibida completamente.',
        );
      }
      const recibidoActual = Number(lock.cantidad_recibida ?? 0);
      const pedidoActual = Number(lock.cantidad);
      const cantidadAcumulada = recibidoActual + cantidadRecibida;
      const completa = cantidadAcumulada >= pedidoActual - 0.0001;
      if (cantidadAcumulada > pedidoActual + 0.0001) {
        throw new BadRequestException(
          `Otro usuario adelantó la recepción de esta línea. Pendiente actual: ${Math.max(0, pedidoActual - recibidoActual)} — recargá la orden.`,
        );
      }

      await m.query(
        `UPDATE ordenes_compra_detalle SET cantidad_recibida = ?, recibido_en = ${completa ? 'NOW()' : 'NULL'} WHERE id_detalle = ?`,
        [cantidadAcumulada, idDetalle],
      );

      const itemGeneralId = linea.item_general_id
        ? Number(linea.item_general_id)
        : null;
      if (itemGeneralId) {
        const itemProvRows: Record<string, unknown>[] = linea.item_proveedor_id
          ? await m.query(
              `SELECT * FROM item_proveedor WHERE id_item_proveedor = ?`,
              [Number(linea.item_proveedor_id)],
            )
          : [];
        const itemProv = itemProvRows[0] ?? null;

        const factorConversion = Math.max(
          Number(itemProv?.factor_conversion) || 1,
          0.001,
        );
        const cantidadBase = cantidadRecibida * factorConversion;
        const costoUnitarioKg = Number(linea.precio_unit) / factorConversion;

        const lote = await this.capas.resolverLoteProveedor(
          m,
          idOrden,
          dto.lote_proveedor,
        );

        await this.capas.crearCapa(m, {
          item_general_id: itemGeneralId,
          bodegas_id: bodegaId,
          proveedor_id: orden.proveedor_id ? Number(orden.proveedor_id) : null,
          item_proveedor_id: linea.item_proveedor_id
            ? Number(linea.item_proveedor_id)
            : null,
          orden_compra_id: idOrden,
          cantidad_original: cantidadBase,
          cantidad_disponible: cantidadBase,
          costo_unitario: costoUnitarioKg,
          unidad_compra_id:
            itemProv?.unidad_compra_id != null
              ? Number(itemProv.unidad_compra_id)
              : null,
          factor_conversion: factorConversion,
          precio_compra: Number(linea.precio_unit),
          lote_proveedor: lote,
        });

        await this.capas.ingresarABodega(m, itemGeneralId, bodegaId, cantidadBase);

        const promedio = await this.capas.recalcularPromedioPonderado(
          m,
          itemGeneralId,
        );
        await m.query(
          `UPDATE item_general SET costo_produccion = ? WHERE id_item_general = ?`,
          [promedio, itemGeneralId],
        );

        await this.capas.registrarMovimiento(m, {
          tipo: MOV.TIPO_ENTRADA,
          item_general_id: itemGeneralId,
          bodega_id: bodegaId,
          cantidad: cantidadBase,
          referencia_tipo: MOV.REF_OC,
          referencia_id: idOrden,
          descripcion: `Recepción OC #${orden.numero} línea ${idDetalle}`,
          costo_unitario: costoUnitarioKg,
          responsable: username,
          metadata: {
            numero_oc: orden.numero ?? null,
            proveedor_id: orden.proveedor_id ?? null,
            item_proveedor_id: linea.item_proveedor_id ?? null,
            item_proveedor_nombre: itemProv?.nombre ?? null,
            cantidad_recibida_unidad_compra: cantidadRecibida,
            unidad_compra: itemProv?.unidad_compra_id ?? null,
            factor_conversion: factorConversion,
            precio_unit_compra: Number(linea.precio_unit),
            lote_proveedor: lote,
          },
        });
      }

      const pendRows: { n: number }[] = await m.query(
        `SELECT COUNT(*) AS n FROM ordenes_compra_detalle WHERE ordenes_compra_id = ? AND recibido_en IS NULL`,
        [idOrden],
      );
      if (Number(pendRows[0].n) === 0) {
        await m.query(
          `UPDATE ordenes_compra SET estado = 'Recibida' WHERE id_orden = ?`,
          [idOrden],
        );
      }
    });

    return { mensaje: 'Línea recibida correctamente' };
  }

  // ── GET /ordenes_compra/:id/lote-sugerido ──
  async loteSugerido(idOrden: number): Promise<Record<string, unknown>> {
    if (!idOrden) throw new BadRequestException('ID no proporcionado');
    const lote = await this.capas.resolverLoteProveedor(this.dataSource.manager, idOrden, null);
    return { lote };
  }

  // ── POST /ordenes_compra/:id/recibir-prorrateado ──
  async recibirLoteProrrateado(
    idOrden: number,
    body: Record<string, unknown>,
    username: string,
  ): Promise<Record<string, unknown>> {
    const orden = await this.detalle(idOrden); // 404 si no existe
    if (orden.estado !== 'Enviada') {
      throw new BadRequestException('Solo se pueden recibir líneas de órdenes Enviadas.');
    }
    const vErr = (errors: Record<string, string>) =>
      new UnprocessableEntityException({ msg: 'Datos inválidos', errors });

    const precioPagado = Number(body?.precio_total_pagado ?? 0);
    const loteProvBody = (body?.lote_proveedor as string) ?? null;
    const lineasPayload = (body?.lineas as Record<string, unknown>[]) ?? [];
    if (precioPagado <= 0) throw vErr({ precio_total_pagado: 'El precio total pagado debe ser mayor a 0.' });
    if (!Array.isArray(lineasPayload) || lineasPayload.length < 2) {
      throw vErr({ lineas: 'El prorrateo necesita al menos 2 líneas.' });
    }

    const lineasPorId = new Map<number, Record<string, unknown>>();
    for (const l of orden.lineas as Record<string, unknown>[]) lineasPorId.set(Number(l.id_detalle), l);

    let valorListaTotal = 0;
    const preparadas: { idDetalle: number; linea: Record<string, unknown>; cantRec: number }[] = [];
    for (const lp of lineasPayload) {
      const idDetalle = Number(lp.id_detalle ?? 0);
      const cantRec = Number(lp.cantidad_recibida ?? 0);
      const linea = lineasPorId.get(idDetalle);
      if (!linea) throw vErr({ lineas: `Línea ${idDetalle} no pertenece a la OC.` });
      if (linea.recibido_en) throw vErr({ lineas: `La línea ${idDetalle} ya fue recibida.` });
      if (cantRec <= 0) throw vErr({ lineas: `La cantidad recibida de la línea ${idDetalle} debe ser mayor a 0.` });
      const pendiente = Math.max(0, Number(linea.cantidad) - Number(linea.cantidad_recibida ?? 0));
      if (cantRec > pendiente + 0.0001) {
        throw vErr({ lineas: `La cantidad recibida de la línea ${idDetalle} (${cantRec}) supera el pendiente (${pendiente}).` });
      }
      valorListaTotal += cantRec * Number(linea.precio_unit);
      preparadas.push({ idDetalle, linea, cantRec });
    }
    if (valorListaTotal <= 0) throw vErr({ lineas: 'La suma del valor de lista debe ser mayor a 0.' });

    const factor = precioPagado / valorListaTotal;
    const bodegaId = Number(orden.bodegas_id);
    const round = (x: number, d: number) => { const f = 10 ** d; return Math.round(x * f) / f; };

    await this.dataSource.transaction(async (m) => {
      // Re-lock + re-valida la cabecera OC (igual que recibirLinea).
      const cab = (await m.query(
        `SELECT estado FROM ordenes_compra WHERE id_orden = ? AND deleted_at IS NULL FOR UPDATE`,
        [idOrden],
      )) as Array<{ estado: string }>;
      if (!cab[0] || cab[0].estado !== 'Enviada') {
        throw new BadRequestException(
          `La orden ya no está 'Enviada' (estado: ${cab[0]?.estado ?? 'inexistente'}) — recargá la orden.`,
        );
      }

      const loteProveedor = await this.capas.resolverLoteProveedor(m, idOrden, loteProvBody);
      for (const { idDetalle, linea, cantRec } of preparadas) {
        const lock = (await m.query(
          `SELECT recibido_en, cantidad, cantidad_recibida FROM ordenes_compra_detalle WHERE id_detalle = ? FOR UPDATE`,
          [idDetalle],
        ))[0];
        if (!lock) throw new BadRequestException(`Línea ${idDetalle} desapareció durante la transacción.`);
        if (lock.recibido_en) throw new BadRequestException(`Otro usuario recibió la línea ${idDetalle} antes — recargá la orden.`);
        const cantidadAcumulada = Number(lock.cantidad_recibida ?? 0) + cantRec;
        const pedidoActual = Number(lock.cantidad);
        if (cantidadAcumulada > pedidoActual + 0.0001) {
          throw new BadRequestException(`Línea ${idDetalle}: la cantidad acumulada supera el pedido tras lock.`);
        }
        const completa = cantidadAcumulada >= pedidoActual - 0.0001;
        await m.query(
          `UPDATE ordenes_compra_detalle SET cantidad_recibida = ?, recibido_en = ${completa ? 'NOW()' : 'NULL'} WHERE id_detalle = ?`,
          [cantidadAcumulada, idDetalle],
        );

        if (!linea.item_general_id) continue;
        const itemGeneralId = Number(linea.item_general_id);
        const itemProv = linea.item_proveedor_id
          ? (await m.query(`SELECT * FROM item_proveedor WHERE id_item_proveedor = ?`, [Number(linea.item_proveedor_id)]))[0]
          : null;
        const factorConversion = Math.max(Number(itemProv?.factor_conversion) || 1, 0.001);
        const cantidadBase = cantRec * factorConversion;
        const precioUnitProrrateado = Number(linea.precio_unit) * factor;
        const costoUnitarioKg = precioUnitProrrateado / factorConversion;

        await this.capas.crearCapa(m, {
          item_general_id: itemGeneralId, bodegas_id: bodegaId,
          proveedor_id: orden.proveedor_id ? Number(orden.proveedor_id) : null,
          item_proveedor_id: linea.item_proveedor_id ? Number(linea.item_proveedor_id) : null,
          orden_compra_id: idOrden, cantidad_original: cantidadBase, cantidad_disponible: cantidadBase,
          costo_unitario: costoUnitarioKg,
          unidad_compra_id: itemProv?.unidad_compra_id != null ? Number(itemProv.unidad_compra_id) : null,
          factor_conversion: factorConversion, precio_compra: precioUnitProrrateado, lote_proveedor: loteProveedor,
        });
        await this.capas.ingresarABodega(m, itemGeneralId, bodegaId, cantidadBase);
        const promedio = await this.capas.recalcularPromedioPonderado(m, itemGeneralId);
        await m.query(`UPDATE item_general SET costo_produccion = ? WHERE id_item_general = ?`, [promedio, itemGeneralId]);
        await this.capas.registrarMovimiento(m, {
          tipo: MOV.TIPO_ENTRADA, item_general_id: itemGeneralId, bodega_id: bodegaId, cantidad: cantidadBase,
          referencia_tipo: MOV.REF_OC, referencia_id: idOrden,
          descripcion: `Recepción lote prorrateado OC #${orden.numero} línea ${idDetalle}`,
          costo_unitario: costoUnitarioKg, responsable: username,
          metadata: {
            numero_oc: orden.numero ?? null, proveedor_id: orden.proveedor_id ?? null,
            item_proveedor_id: linea.item_proveedor_id ?? null, cantidad_recibida: cantRec,
            unidad_compra: itemProv?.unidad_compra_id ?? null, factor_conversion: factorConversion,
            precio_unit_original: Number(linea.precio_unit), precio_unit_prorrateado: precioUnitProrrateado,
            factor_prorrateo: factor, valor_lista_total_lote: valorListaTotal,
            precio_pagado_lote: precioPagado, lote_proveedor: loteProveedor,
          },
        });
      }
      const pend = Number(
        (await m.query(`SELECT COUNT(*) AS n FROM ordenes_compra_detalle WHERE ordenes_compra_id = ? AND recibido_en IS NULL`, [idOrden]))[0].n,
      );
      if (pend === 0) await m.query(`UPDATE ordenes_compra SET estado = 'Recibida' WHERE id_orden = ?`, [idOrden]);
    });

    return {
      ok: true, msg: '',
      mensaje: 'Lote prorrateado y recibido correctamente.',
      factor: round(factor, 6), lineas: preparadas.length,
    };
  }
}
