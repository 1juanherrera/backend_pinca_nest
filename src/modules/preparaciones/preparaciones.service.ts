import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { CapasService, Consumo, MOV } from '../inventario/capas.service';
import {
  CreatePreparacionDto,
  PrepDetalleDto,
  UpdatePreparacionDto,
} from './dto/preparacion.dto';

const ESTADO_MAP: Record<number, string> = {
  0: 'PENDIENTE',
  1: 'EN_PROCESO',
  2: 'COMPLETADA',
  3: 'CANCELADA',
};
const ESTADO_REV: Record<string, number> = {
  PENDIENTE: 0,
  EN_PROCESO: 1,
  COMPLETADA: 2,
  CANCELADA: 3,
};

interface CapaSel {
  modo: string;
  capas: { capa_id: number; cantidad: number }[];
  bodega_id: number | null;
  proveedor_id: number | null;
}

/**
 * Réplica fiel de PreparacionesController + PreparacionesModel (CI4) — producción.
 * El stock se descuenta AL CREAR (estado=0). Costo congelado en
 * produccion_insumos_detalle = promedio ponderado real de capas consumidas.
 * ⚠️ CÓDIGO DE COSTEO — verificado con golden harness de producción.
 */
@Injectable()
export class PreparacionesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly capas: CapasService,
  ) {}

  private r4(n: number): number {
    return Math.round(n * 10000) / 10000;
  }

  // ── GET /preparaciones/costos_resumen ── (read agregado: MP + indirectos por preparación)
  async costosResumen(
    desde?: string,
    hasta?: string,
    estado?: string,
  ): Promise<Record<string, unknown>> {
    const d = (desde ?? '').trim();
    const h = (hasta ?? '').trim();
    const params: unknown[] = [];
    const desdeSql = d !== '' ? '?' : `DATE_FORMAT(CURDATE(),'%Y-%m-01')`;
    if (d !== '') params.push(d);
    const hastaSql = h !== '' ? '?' : `CURDATE()`;
    if (h !== '') params.push(h);

    let sql = `
      SELECT p.id_preparaciones, p.fecha_creacion,
             CASE p.estado WHEN 0 THEN 'PENDIENTE' WHEN 1 THEN 'EN_PROCESO'
                           WHEN 2 THEN 'COMPLETADA' WHEN 3 THEN 'CANCELADA' END AS estado,
             ig.nombre AS item_nombre, ig.codigo AS item_codigo, p.cantidad, u.nombre AS unidad,
             COALESCE(mp.costo_mp, 0) AS costo_mp_total,
             COALESCE(ci_agg.costo_indirectos, 0) AS costo_indirectos_total,
             (COALESCE(mp.costo_mp,0) + COALESCE(ci_agg.costo_indirectos,0)) AS costo_total
        FROM preparaciones p
        JOIN item_general ig ON ig.id_item_general = p.item_general_id
        JOIN unidad u        ON u.id_unidad        = p.unidad_id
        LEFT JOIN (
          SELECT phig.preparaciones_id_preparaciones,
                 SUM(phig.cantidad * COALESCE(ci_latest.costo_unitario,0)) AS costo_mp
            FROM preparaciones_has_item_general phig
            LEFT JOIN (
              SELECT ci1.item_general_id, ci1.costo_unitario FROM costos_item ci1
              INNER JOIN (SELECT item_general_id, MAX(id_costos_item) AS max_id FROM costos_item GROUP BY item_general_id) ci_max
                ON ci_max.item_general_id = ci1.item_general_id AND ci_max.max_id = ci1.id_costos_item
            ) ci_latest ON ci_latest.item_general_id = phig.item_general_id
           GROUP BY phig.preparaciones_id_preparaciones
        ) mp ON mp.preparaciones_id_preparaciones = p.id_preparaciones
        LEFT JOIN (
          SELECT preparaciones_id, SUM(valor_aplicado) AS costo_indirectos
            FROM preparaciones_costos_indirectos GROUP BY preparaciones_id
        ) ci_agg ON ci_agg.preparaciones_id = p.id_preparaciones
       WHERE DATE(p.fecha_creacion) BETWEEN ${desdeSql} AND ${hastaSql}`;

    if (estado !== undefined && estado !== null && estado !== '') {
      sql += ' AND p.estado = ?';
      params.push(Math.trunc(Number(estado)));
    }
    sql += ' ORDER BY p.fecha_creacion DESC';

    const rows: Record<string, unknown>[] = await this.dataSource.query(sql, params);
    const totalMp = rows.reduce((a, r) => a + Number(r.costo_mp_total ?? 0), 0);
    const totalIndirectos = rows.reduce((a, r) => a + Number(r.costo_indirectos_total ?? 0), 0);
    return {
      success: true,
      resumen: {
        total_mp: totalMp,
        total_indirectos: totalIndirectos,
        gran_total: totalMp + totalIndirectos,
        cantidad_ordenes: rows.length,
      },
      data: rows,
    };
  }

  // ── CREATE ──
  async create(
    dto: CreatePreparacionDto,
    responsable: string,
  ): Promise<Record<string, unknown>> {
    const itemId = dto.item_general_id;
    const unidadId = dto.unidad_id;
    const volumenGalones = Number(dto.cantidad);
    if (volumenGalones <= 0) {
      throw new BadRequestException('El volumen debe ser mayor a 0.');
    }

    const prepId = await this.dataSource.transaction(async (m) => {
      const unidadRows: { escala: string }[] = await m.query(
        `SELECT escala FROM unidad WHERE id_unidad = ? AND estados = 1`,
        [unidadId],
      );
      if (!unidadRows.length) {
        throw new BadRequestException(
          `Unidad con ID ${unidadId} no encontrada o inactiva.`,
        );
      }
      const escala = Number(unidadRows[0].escala);
      const cantidadEnvases = escala > 0 ? volumenGalones / escala : 0;

      const itemActivo: unknown[] = await m.query(
        `SELECT id_item_general FROM item_general WHERE id_item_general = ? AND deleted_at IS NULL LIMIT 1`,
        [itemId],
      );
      if (!itemActivo.length) {
        throw new BadRequestException(
          'El item a producir no existe o fue archivado.',
        );
      }

      const formRows: { id_formulaciones: number; version_actual: number }[] =
        await m.query(
          `SELECT f.id_formulaciones, f.version_actual FROM formulaciones f
             INNER JOIN item_general ig ON ig.id_item_general = f.item_general_id
            WHERE f.item_general_id = ? AND f.estado = 1 AND ig.deleted_at IS NULL LIMIT 1`,
          [itemId],
        );
      if (!formRows.length) {
        throw new BadRequestException('El item no tiene una formulación activa.');
      }
      const formulacion = formRows[0];

      let formulacionVersionId: number | null = null;
      if (formulacion.version_actual) {
        const verRows: { id: number }[] = await m.query(
          `SELECT id FROM formulaciones_versiones WHERE formulacion_id = ? AND version_num = ?`,
          [formulacion.id_formulaciones, formulacion.version_actual],
        );
        formulacionVersionId = verRows.length ? Number(verRows[0].id) : null;
      }

      const ingredientes: { item_general_id: number; cantidad: string }[] =
        await m.query(
          `SELECT igf.item_general_id, igf.cantidad
             FROM item_general_formulaciones igf
             INNER JOIN item_general ig ON ig.id_item_general = igf.item_general_id
            WHERE igf.formulaciones_id = ? AND ig.deleted_at IS NULL`,
          [formulacion.id_formulaciones],
        );
      if (!ingredientes.length) {
        throw new BadRequestException(
          'La formulación no tiene ingredientes asignados (o fueron archivados).',
        );
      }

      // detalleMap + capasSeleccion desde el body
      const detalleMap = new Map<number, number>();
      const capasSeleccion = new Map<number, CapaSel>();
      for (const d of dto.detalle ?? []) {
        const dId = Number(d.item_general_id);
        if (dId) {
          detalleMap.set(dId, Number(d.cantidad));
          if (
            d.modo_consumo !== undefined ||
            d.capas !== undefined ||
            d.bodega_id !== undefined ||
            d.proveedor_id !== undefined
          ) {
            capasSeleccion.set(dId, {
              modo: d.modo_consumo ?? 'FIFO',
              capas: d.capas ?? [],
              bodega_id: d.bodega_id != null ? Number(d.bodega_id) : null,
              proveedor_id: d.proveedor_id != null ? Number(d.proveedor_id) : null,
            });
          }
        }
      }

      // factorVolumen solo si NO hay detalle precalculado
      let factorVolumen = 1;
      if (detalleMap.size === 0) {
        const ci: { volumen_base: string }[] = await m.query(
          `SELECT COALESCE(NULLIF(volumen,0),1) AS volumen_base FROM costos_item WHERE item_general_id = ? LIMIT 1`,
          [itemId],
        );
        const volumenBase = Number(ci[0]?.volumen_base ?? 1);
        factorVolumen = volumenBase > 0 ? volumenGalones / volumenBase : 1;
      }

      const totalCantidadBase = ingredientes.reduce(
        (a, i) => a + Number(i.cantidad),
        0,
      );

      const insPrep: { insertId: number } = await m.query(
        `INSERT INTO preparaciones
           (fecha_creacion, fecha_inicio, fecha_fin, cantidad, observaciones, estado, item_general_id, formulacion_version_id, unidad_id)
         VALUES (NOW(), ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          dto.fecha_inicio ?? null,
          dto.fecha_fin ?? null,
          cantidadEnvases,
          dto.observaciones ?? null,
          itemId,
          formulacionVersionId,
          unidadId,
        ],
      );
      const preparacionId = insPrep.insertId;

      for (const ing of ingredientes) {
        const ingId = Number(ing.item_general_id);
        const cantidadEscalada = detalleMap.has(ingId)
          ? this.r4(detalleMap.get(ingId) as number)
          : this.r4(Number(ing.cantidad) * factorVolumen);
        const porcentaje =
          totalCantidadBase > 0
            ? this.r4((Number(ing.cantidad) / totalCantidadBase) * 100)
            : 0;
        await m.query(
          `INSERT INTO preparaciones_has_item_general
             (preparaciones_id_preparaciones, item_general_id, cantidad, porcentajes)
           VALUES (?, ?, ?, ?)`,
          [preparacionId, ingId, cantidadEscalada, porcentaje],
        );
      }

      for (const ci of dto.costos_indirectos ?? []) {
        const nombre = (ci.nombre ?? '').trim();
        const categoria = (ci.categoria ?? 'otros').trim();
        const valor = Number(ci.valor_aplicado ?? 0);
        if (nombre && valor > 0) {
          await m.query(
            `INSERT INTO preparaciones_costos_indirectos
               (preparaciones_id, costos_indirectos_id, valor_aplicado, nombre, categoria)
             VALUES (?, NULL, ?, ?, ?)`,
            [preparacionId, valor, nombre, categoria],
          );
        }
      }

      await this.ajustarInventario(m, preparacionId, -1, responsable, capasSeleccion);
      return preparacionId;
    });

    return this.getById(prepId);
  }

  // ── _ajustarInventarioPorPreparacion ──
  private async ajustarInventario(
    m: EntityManager,
    prepId: number,
    multiplicador: number,
    responsable: string | null,
    capasSeleccion: Map<number, CapaSel>,
  ): Promise<void> {
    const ingredientes: {
      item_general_id: number;
      cantidad: string;
      costo_unitario: string;
    }[] = await m.query(
      // LEFT JOIN a la ÚLTIMA fila de costos_item (MAX id) por ítem: si un
      // ingrediente tuviera >1 fila en costos_item, un JOIN directo lo devolvería
      // duplicado y el loop de consumo descontaría el stock 2×. Mismo patrón
      // defensivo que usan getById/costosResumen en este mismo service.
      `SELECT phig.item_general_id, phig.cantidad, COALESCE(ci.costo_unitario, 0) AS costo_unitario
         FROM preparaciones_has_item_general phig
         LEFT JOIN costos_item ci
           ON ci.id_costos_item = (
             SELECT MAX(c2.id_costos_item) FROM costos_item c2
              WHERE c2.item_general_id = phig.item_general_id
           )
        WHERE phig.preparaciones_id_preparaciones = ?`,
      [prepId],
    );

    if (multiplicador > 0) {
      await this.capas.restaurarCapas(m, prepId);
      await m.query(
        `DELETE FROM produccion_insumos_detalle WHERE preparacion_id = ?`,
        [prepId],
      );
    }

    for (const ing of ingredientes) {
      const itemId = Number(ing.item_general_id);
      const cantidadAbs = Number(ing.cantidad);
      const diff = cantidadAbs * multiplicador;
      let costoUnitario = Number(ing.costo_unitario);
      if (diff === 0) continue;

      const seleccion = capasSeleccion.get(itemId) ?? null;
      const seleccionProveedorId = seleccion?.proveedor_id ?? null;

      let consumosCapas: Consumo[] = [];
      if (multiplicador < 0 && (await this.capas.tieneCapas(m, itemId))) {
        if (
          seleccion &&
          seleccion.modo === 'MANUAL' &&
          seleccion.capas.length
        ) {
          consumosCapas = await this.capas.consumirCapasManual(
            m,
            seleccion.capas,
            itemId,
          );
          const consumido = consumosCapas.reduce(
            (a, c) => a + c.cantidad_consumida,
            0,
          );
          if (Math.abs(consumido - cantidadAbs) > 0.0001) {
            throw new BadRequestException(
              `La selección manual de capas para el ingrediente #${itemId} no cubre la cantidad requerida. Seleccionado: ${consumido} kg, Requerido: ${cantidadAbs} kg`,
            );
          }
        } else if (seleccionProveedorId) {
          consumosCapas = await this.capas.consumirCapasPorProveedor(
            m,
            itemId,
            cantidadAbs,
            seleccionProveedorId,
            seleccion?.bodega_id ?? null,
          );
          const consumido = consumosCapas.reduce(
            (a, c) => a + c.cantidad_consumida,
            0,
          );
          if (consumido < cantidadAbs - 0.001) {
            throw new BadRequestException(
              `Stock insuficiente del proveedor #${seleccionProveedorId} para el ingrediente #${itemId}. Disponible: ${consumido} kg, Requerido: ${cantidadAbs} kg`,
            );
          }
        } else {
          consumosCapas = await this.capas.consumirCapasFIFO(
            m,
            itemId,
            cantidadAbs,
            seleccion?.bodega_id ?? null,
          );
        }

        if (consumosCapas.length) {
          await this.capas.registrarConsumos(m, prepId, consumosCapas);
          const costoReal = consumosCapas.reduce((a, c) => a + c.costo_total, 0);
          const qtyReal = consumosCapas.reduce(
            (a, c) => a + c.cantidad_consumida,
            0,
          );
          costoUnitario = qtyReal > 0 ? costoReal / qtyReal : costoUnitario;
        }
      }

      // inventario legacy
      const stockRows: {
        id_inventario: number;
        cantidad: string;
        bodegas_id: number;
      }[] = await m.query(
        `SELECT id_inventario, cantidad, bodegas_id FROM inventario WHERE item_general_id = ? ORDER BY cantidad DESC LIMIT 1`,
        [itemId],
      );
      const stock = stockRows[0];
      const bodegaId = stock ? Number(stock.bodegas_id) : 1;
      const saldoAnterior = stock ? Number(stock.cantidad) : 0;
      const saldoNuevo = saldoAnterior + diff;
      if (!stock) {
        await m.query(
          `INSERT INTO inventario (item_general_id, bodegas_id, cantidad, estado, tipo, fecha_update) VALUES (?, ?, ?, 1, 1, NOW())`,
          [itemId, bodegaId, diff],
        );
      } else {
        await m.query(
          `UPDATE inventario SET cantidad = cantidad + ?, fecha_update = NOW() WHERE id_inventario = ?`,
          [diff, stock.id_inventario],
        );
      }

      // costo congelado
      if (multiplicador < 0) {
        let loteSnapshot: string | null = null;
        const capaIds = consumosCapas.map((c) => c.capa_id).filter(Boolean);
        if (capaIds.length) {
          const lotes: { lote_proveedor: string }[] = await m.query(
            `SELECT DISTINCT lote_proveedor FROM inventario_capas WHERE id_capa IN (${capaIds.map(() => '?').join(',')}) AND lote_proveedor IS NOT NULL`,
            capaIds,
          );
          if (lotes.length === 1) loteSnapshot = lotes[0].lote_proveedor;
        }
        await m.query(
          `INSERT INTO produccion_insumos_detalle
             (preparacion_id, item_general_id, proveedor_id, lote_proveedor, bodega_id, cantidad, costo_unitario, subtotal, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            prepId,
            itemId,
            seleccionProveedorId,
            loteSnapshot,
            bodegaId,
            cantidadAbs,
            costoUnitario,
            this.r4(cantidadAbs * costoUnitario),
          ],
        );
      }

      await this.capas.registrarMovimiento(m, {
        tipo: multiplicador < 0 ? MOV.TIPO_SALIDA : MOV.TIPO_ENTRADA,
        item_general_id: itemId,
        bodega_id: bodegaId,
        cantidad: Math.abs(diff),
        referencia_tipo: MOV.REF_PRODUCCION,
        referencia_id: prepId,
        descripcion:
          multiplicador < 0
            ? `Consumo por orden de producción #${prepId}`
            : `Reintegro por cancelación de orden #${prepId}`,
        costo_unitario: costoUnitario,
        saldo_anterior: saldoAnterior,
        saldo_nuevo: saldoNuevo,
        responsable: responsable ?? undefined,
        metadata: {
          preparacion_id: prepId,
          multiplicador,
          subtotal: this.r4(Math.abs(diff) * costoUnitario),
        },
      });
    }
  }

  // ── READS ──
  async getById(id: number): Promise<Record<string, unknown>> {
    const headRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT p.*, ig.nombre AS item_nombre, ig.codigo AS item_codigo,
              u.nombre AS unidad_nombre, u.escala
         FROM preparaciones p
         INNER JOIN item_general ig ON ig.id_item_general = p.item_general_id
         INNER JOIN unidad u ON u.id_unidad = p.unidad_id
        WHERE p.id_preparaciones = ?`,
      [id],
    );
    if (!headRows.length) {
      throw new NotFoundException(`Preparación con ID ${id} no encontrada.`);
    }
    const prep = headRows[0];
    const escala = Number(prep.escala);
    const cantidad = Number(prep.cantidad);

    const detalle: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT phig.item_general_id, phig.cantidad, phig.porcentajes, ig.nombre, ig.codigo,
              COALESCE(ci.costo_unitario, 0) AS materia_prima_costo_unitario,
              (phig.cantidad * COALESCE(ci.costo_unitario, 0)) AS costo_total_materia
         FROM preparaciones_has_item_general phig
         INNER JOIN item_general ig ON ig.id_item_general = phig.item_general_id
         LEFT JOIN (
           SELECT ci1.item_general_id, ci1.costo_unitario FROM costos_item ci1
           INNER JOIN (SELECT item_general_id, MAX(id_costos_item) AS max_id FROM costos_item GROUP BY item_general_id) cm
             ON cm.item_general_id = ci1.item_general_id AND cm.max_id = ci1.id_costos_item
         ) ci ON ci.item_general_id = ig.id_item_general
        WHERE phig.preparaciones_id_preparaciones = ?
        ORDER BY phig.item_general_id ASC`,
      [id],
    );

    const costosInd: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id, nombre, categoria, valor_aplicado FROM preparaciones_costos_indirectos WHERE preparaciones_id = ? ORDER BY categoria, nombre`,
      [id],
    );

    const consumoCapas: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pcc.*, ic.proveedor_id, ic.lote_proveedor, ic.fecha_ingreso,
              p.nombre_empresa AS proveedor_nombre, b.nombre AS bodega_nombre
         FROM preparacion_consumo_capas pcc
         INNER JOIN inventario_capas ic ON ic.id_capa = pcc.capa_id
         LEFT JOIN proveedor p ON p.id_proveedor = ic.proveedor_id
         LEFT JOIN bodegas b ON b.id_bodegas = ic.bodegas_id
        WHERE pcc.preparacion_id = ?
        ORDER BY pcc.item_general_id, ic.fecha_ingreso`,
      [id],
    );

    return {
      id_preparaciones: Number(prep.id_preparaciones),
      item_general_id: Number(prep.item_general_id),
      item_nombre: prep.item_nombre,
      item_codigo: prep.item_codigo,
      unidad_id: Number(prep.unidad_id),
      unidad_nombre: prep.unidad_nombre,
      escala,
      cantidad,
      volumen_galones: this.r4(cantidad * escala),
      observaciones: prep.observaciones,
      estado: ESTADO_MAP[Number(prep.estado)] ?? String(prep.estado),
      fecha_creacion: prep.fecha_creacion,
      fecha_inicio: prep.fecha_inicio,
      fecha_fin: prep.fecha_fin,
      detalle: detalle.map((d) => ({
        item_general_id: Number(d.item_general_id),
        nombre: d.nombre,
        codigo: d.codigo,
        cantidad: Number(d.cantidad),
        porcentajes: Number(d.porcentajes),
        materia_prima_costo_unitario: Number(d.materia_prima_costo_unitario),
        costo_total_materia: Number(d.costo_total_materia),
      })),
      costos_indirectos: costosInd.map((c) => ({
        id: Number(c.id),
        nombre: c.nombre,
        categoria: c.categoria,
        valor_aplicado: Number(c.valor_aplicado),
      })),
      consumo_capas: consumoCapas.map((c) => ({
        id: Number(c.id),
        capa_id: Number(c.capa_id),
        item_general_id: Number(c.item_general_id),
        cantidad_consumida: Number(c.cantidad_consumida),
        costo_unitario: Number(c.costo_unitario),
        costo_total: Number(c.costo_total),
        proveedor_nombre: c.proveedor_nombre ?? null,
        lote_proveedor: c.lote_proveedor ?? null,
        bodega_nombre: c.bodega_nombre ?? null,
        fecha_ingreso: c.fecha_ingreso,
      })),
    };
  }

  async getAll(
    page: number,
    limit: number,
    filtros: Record<string, string | undefined> = {},
  ): Promise<{
    data: Record<string, unknown>[];
    meta: Record<string, number>;
    stats: Record<string, number>;
    itemsFiltro: Array<{ value: string; label: string }>;
  }> {
    // Filtros server-side (antes se filtraba TODO en el navegador sobre solo 50 filas).
    const where: string[] = [];
    const params: unknown[] = [];
    if (filtros.estado && ESTADO_REV[filtros.estado] !== undefined) {
      where.push('p.estado = ?');
      params.push(ESTADO_REV[filtros.estado]);
    }
    if (filtros.item) {
      where.push('p.item_general_id = ?');
      params.push(filtros.item);
    }
    if (filtros.search) {
      where.push('(ig.nombre LIKE ? OR ig.codigo LIKE ?)');
      const t = `%${filtros.search}%`;
      params.push(t, t);
    }
    if (filtros.desde) {
      where.push('DATE(p.fecha_creacion) >= ?');
      params.push(filtros.desde);
    }
    if (filtros.hasta) {
      where.push('DATE(p.fecha_creacion) <= ?');
      params.push(filtros.hasta);
    }
    const whereSql = where.length
      ? 'WHERE ' + where.join(' AND ')
      : '';
    const joinWhere = `FROM preparaciones p
         INNER JOIN item_general ig ON ig.id_item_general = p.item_general_id
         INNER JOIN unidad u ON u.id_unidad = p.unidad_id
        ${whereSql}`;

    const totalRows: { n: number }[] = await this.dataSource.query(
      `SELECT COUNT(*) AS n ${joinWhere}`,
      params,
    );
    const total = Number(totalRows[0].n);
    const offset = (page - 1) * limit;
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT p.id_preparaciones, ig.id_item_general AS item_general_id,
              ig.nombre AS item_nombre, ig.codigo AS item_codigo,
              u.nombre AS unidad_nombre, u.escala, p.cantidad, p.observaciones,
              p.estado, p.fecha_creacion, p.fecha_inicio, p.fecha_fin
         ${joinWhere}
        ORDER BY p.fecha_creacion DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    // KPIs globales por estado (independientes de filtros, igual que ProduccionKpis).
    const [st] = (await this.dataSource.query(
      `SELECT COUNT(*) AS total,
              SUM(estado = 0) AS pendiente,
              SUM(estado = 1) AS en_proceso,
              SUM(estado = 2) AS completada,
              SUM(estado = 3) AS cancelada
         FROM preparaciones`,
    )) as Array<Record<string, unknown>>;

    // Ítems distintos con órdenes (para el <select> de filtro; antes se derivaba
    // del fetch completo en el navegador). Lista acotada, barata.
    const itemsFiltro: Array<{ value: string; label: string }> = (
      (await this.dataSource.query(
        `SELECT DISTINCT p.item_general_id AS value, ig.nombre AS label
           FROM preparaciones p
           INNER JOIN item_general ig ON ig.id_item_general = p.item_general_id
          ORDER BY ig.nombre ASC`,
      )) as Array<Record<string, unknown>>
    ).map((r) => ({ value: String(r.value), label: String(r.label) }));
    const data = rows.map((r) => {
      const escala = Number(r.escala);
      const cantidad = Number(r.cantidad);
      return {
        id_preparaciones: Number(r.id_preparaciones),
        item_general_id: Number(r.item_general_id),
        item_nombre: r.item_nombre,
        item_codigo: r.item_codigo,
        unidad_nombre: r.unidad_nombre,
        escala,
        cantidad,
        volumen_galones: this.r4(cantidad * escala),
        observaciones: r.observaciones,
        estado: ESTADO_MAP[Number(r.estado)] ?? String(r.estado),
        fecha_creacion: r.fecha_creacion,
        fecha_inicio: r.fecha_inicio,
        fecha_fin: r.fecha_fin,
      };
    });
    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      stats: {
        total: Number(st?.total ?? 0),
        pendiente: Number(st?.pendiente ?? 0),
        en_proceso: Number(st?.en_proceso ?? 0),
        completada: Number(st?.completada ?? 0),
        cancelada: Number(st?.cancelada ?? 0),
      },
      itemsFiltro,
    };
  }

  async getByItem(itemId: number): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT p.*, u.nombre AS unidad_nombre, u.escala
         FROM preparaciones p INNER JOIN unidad u ON u.id_unidad = p.unidad_id
        WHERE p.item_general_id = ? ORDER BY p.fecha_creacion DESC`,
      [itemId],
    );
    return rows.map((r) => {
      const escala = Number(r.escala);
      const cantidad = Number(r.cantidad);
      return {
        id_preparaciones: Number(r.id_preparaciones),
        unidad_nombre: r.unidad_nombre,
        escala,
        cantidad,
        volumen_galones: this.r4(cantidad * escala),
        observaciones: r.observaciones,
        estado: ESTADO_MAP[Number(r.estado)] ?? String(r.estado),
        fecha_creacion: r.fecha_creacion,
        fecha_inicio: r.fecha_inicio,
        fecha_fin: r.fecha_fin,
      };
    });
  }

  // ── COSTOS INDIRECTOS de una preparación ──
  async addCostoIndirecto(
    prepId: number,
    nombre: string,
    categoria: string,
    valor: number,
  ): Promise<Record<string, unknown>> {
    if (!nombre || valor <= 0) {
      throw new BadRequestException(
        'nombre y valor_aplicado son obligatorios.',
      );
    }
    const ins: { insertId: number } = await this.dataSource.query(
      `INSERT INTO preparaciones_costos_indirectos
         (preparaciones_id, costos_indirectos_id, valor_aplicado, nombre, categoria)
       VALUES (?, NULL, ?, ?, ?)`,
      [prepId, valor, nombre, categoria],
    );
    return {
      id: ins.insertId,
      nombre,
      categoria,
      valor_aplicado: valor,
    };
  }

  async updateCostoIndirecto(
    costoId: number,
    data: Record<string, unknown>,
  ): Promise<void> {
    const allowed = ['nombre', 'categoria', 'valor_aplicado'];
    const keys = allowed.filter((k) => data[k] !== undefined);
    if (!keys.length) return;
    const set = keys.map((k) => `${k} = ?`).join(', ');
    await this.dataSource.query(
      `UPDATE preparaciones_costos_indirectos SET ${set} WHERE id = ?`,
      [...keys.map((k) => data[k]), costoId],
    );
  }

  async deleteCostoIndirecto(costoId: number): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM preparaciones_costos_indirectos WHERE id = ?`,
      [costoId],
    );
  }

  // ── UPDATE (incluye cancelación/reactivación) ──
  async update(
    id: number,
    body: UpdatePreparacionDto,
    responsable: string,
  ): Promise<Record<string, unknown>> {
    const allowed: (keyof UpdatePreparacionDto)[] = [
      'estado',
      'observaciones',
      'fecha_inicio',
      'fecha_fin',
    ];
    const fields: Record<string, unknown> = {};
    for (const k of allowed) if (body[k] !== undefined) fields[k] = body[k];
    if (!Object.keys(fields).length) {
      throw new BadRequestException('No hay campos válidos para actualizar.');
    }

    if (fields.estado !== undefined) {
      const raw = fields.estado;
      if (typeof raw === 'string' && !/^\d+$/.test(raw)) {
        const key = raw.toUpperCase().trim();
        if (!(key in ESTADO_REV)) {
          throw new BadRequestException(`Estado '${raw}' inválido.`);
        }
        fields.estado = ESTADO_REV[key];
      } else {
        const intEstado = Number(raw);
        if (![0, 1, 2, 3].includes(intEstado)) {
          throw new BadRequestException(`Estado ${intEstado} inválido. Permitidos: 0..3.`);
        }
        fields.estado = intEstado;
      }
    }

    await this.dataSource.transaction(async (m) => {
      // FOR UPDATE: serializa el read-modify-write del estado. Sin esto, dos
      // cancelaciones concurrentes leen oldEstado≠3 y ambas reintegran stock
      // (doble reintegro de capas). Con el lock, la 2ª ve oldEstado=3 y no reintegra.
      const oldRows: { estado: number }[] = await m.query(
        `SELECT estado FROM preparaciones WHERE id_preparaciones = ? FOR UPDATE`,
        [id],
      );
      if (!oldRows.length) {
        throw new NotFoundException(`Preparación con ID ${id} no encontrada.`);
      }
      const oldEstado = Number(oldRows[0].estado);

      const keys = Object.keys(fields);
      const set = keys.map((k) => `${k} = ?`).join(', ');
      await m.query(`UPDATE preparaciones SET ${set} WHERE id_preparaciones = ?`, [
        ...keys.map((k) => fields[k]),
        id,
      ]);

      if (fields.estado !== undefined) {
        const newEstado = Number(fields.estado);
        if (oldEstado !== 3 && newEstado === 3) {
          await this.ajustarInventario(m, id, 1, responsable, new Map());
        } else if (oldEstado === 3 && newEstado !== 3) {
          await this.ajustarInventario(m, id, -1, responsable, new Map());
        }
      }
    });

    return this.getById(id);
  }
}
