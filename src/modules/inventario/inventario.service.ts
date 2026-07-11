import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CapasService, MOV } from './capas.service';
import { AjusteManualDto } from './dto/ajuste-manual.dto';
import { TraspasoDto } from './dto/traspaso.dto';

/**
 * Fase 3 — LECTURAS de inventario/capas/movimientos + ajuste manual (consumo FIFO).
 * Réplica fiel de InventarioController + CapasInventarioController + MovimientoInventario.
 */
@Injectable()
export class InventarioService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly capas: CapasService,
  ) {}

  /**
   * POST /inventario/ajuste-manual — descuenta stock por FIFO de una bodega.
   * Réplica byte-por-byte de InventarioController::ajusteManual.
   */
  async ajusteManual(
    dto: AjusteManualDto,
    username: string,
  ): Promise<Record<string, unknown>> {
    return this.dataSource.transaction(async (m) => {
      const stockRows: { s: string }[] = await m.query(
        `SELECT COALESCE(SUM(cantidad_disponible), 0) AS s FROM inventario_capas
          WHERE item_general_id = ? AND bodegas_id = ? AND estado = 1`,
        [dto.item_general_id, dto.bodega_id],
      );
      const disponible = Number(stockRows[0].s ?? 0);
      if (disponible < dto.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible en esta bodega: ${disponible.toFixed(4)}, intentando descontar: ${dto.cantidad.toFixed(4)}`,
        );
      }

      const consumos = await this.capas.consumirCapasFIFO(
        m,
        dto.item_general_id,
        dto.cantidad,
        dto.bodega_id,
      );
      if (!consumos.length) {
        throw new BadRequestException(
          'No se pudieron consumir capas para el ajuste.',
        );
      }

      const consumido = consumos.reduce((a, c) => a + c.cantidad_consumida, 0);
      const costoTotal = consumos.reduce((a, c) => a + c.costo_total, 0);
      const costoUnitProm = consumido > 0 ? costoTotal / consumido : 0;

      await this.capas.recalcularPromedioPonderado(m, dto.item_general_id);

      await this.capas.registrarMovimiento(m, {
        tipo: MOV.TIPO_AJUSTE,
        item_general_id: dto.item_general_id,
        bodega_id: dto.bodega_id,
        cantidad: consumido,
        referencia_tipo: MOV.REF_AJUSTE,
        referencia_id: null,
        descripcion: `Ajuste manual (${dto.motivo}): descontó ${consumido}`,
        costo_unitario: costoUnitProm,
        responsable: username,
        metadata: {
          motivo: dto.motivo,
          observacion: dto.observacion?.trim() || null,
          capas: consumos.map((c) => ({
            capa_id: c.capa_id,
            cantidad: c.cantidad_consumida,
            costo_u: c.costo_unitario,
          })),
        },
      });

      return {
        mensaje: 'Ajuste registrado correctamente',
        cantidad_descontada: consumido,
        costo_total_perdido: costoTotal,
      };
    });
  }

  private r4(n: number): number {
    return Math.round(n * 10000) / 10000;
  }

  /** POST /inventario/traspaso — mueve stock entre bodegas (capas FIFO, preserva costo/lote). */
  async traspaso(dto: TraspasoDto, username: string): Promise<void> {
    const itemId = Number(dto.item_id);
    const origen = Number(dto.bodega_origen_id);
    const destino = Number(dto.bodega_destino_id);
    const cantidad = Number(dto.cantidad);
    if (origen === destino || cantidad <= 0) {
      throw new BadRequestException('Error al realizar el traspaso');
    }

    await this.dataSource.transaction(async (m) => {
      const capasOrigen: Record<string, unknown>[] = await m.query(
        `SELECT * FROM inventario_capas
          WHERE item_general_id = ? AND bodegas_id = ? AND estado = 1 AND cantidad_disponible > 0
          ORDER BY fecha_ingreso ASC, id_capa ASC FOR UPDATE`,
        [itemId, origen],
      );
      const saldoOrigenAntes = capasOrigen.reduce(
        (a, c) => a + Number(c.cantidad_disponible),
        0,
      );
      if (saldoOrigenAntes + 0.0001 < cantidad) {
        throw new BadRequestException('Error al realizar el traspaso');
      }
      const destRows: { s: string }[] = await m.query(
        `SELECT COALESCE(SUM(cantidad_disponible), 0) AS s FROM inventario_capas
          WHERE item_general_id = ? AND bodegas_id = ? AND estado = 1`,
        [itemId, destino],
      );
      const saldoDestinoAntes = Number(destRows[0].s ?? 0);

      let restante = cantidad;
      for (const capa of capasOrigen) {
        if (restante <= 0.0001) break;
        const disp = Number(capa.cantidad_disponible);
        const mover = Math.min(restante, disp);
        if (mover >= disp - 0.0001) {
          await m.query(
            `UPDATE inventario_capas SET bodegas_id = ? WHERE id_capa = ?`,
            [destino, Number(capa.id_capa)],
          );
        } else {
          await m.query(
            `UPDATE inventario_capas SET cantidad_disponible = cantidad_disponible - ? WHERE id_capa = ?`,
            [mover, Number(capa.id_capa)],
          );
          await m.query(
            `INSERT INTO inventario_capas
               (item_general_id, bodegas_id, proveedor_id, item_proveedor_id, orden_compra_id,
                cantidad_original, cantidad_disponible, costo_unitario, unidad_compra_id,
                factor_conversion, precio_compra, fecha_ingreso, lote_proveedor, observaciones, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              itemId,
              destino,
              capa.proveedor_id,
              capa.item_proveedor_id,
              capa.orden_compra_id,
              mover,
              mover,
              capa.costo_unitario,
              capa.unidad_compra_id,
              capa.factor_conversion,
              capa.precio_compra,
              capa.fecha_ingreso,
              capa.lote_proveedor,
              capa.observaciones,
            ],
          );
        }
        restante -= mover;
      }

      const saldoOrigenDespues = saldoOrigenAntes - cantidad;
      const saldoDestinoDespues = saldoDestinoAntes + cantidad;

      // legacy inventario (best-effort)
      await m.query(
        `UPDATE inventario SET cantidad = GREATEST(cantidad - ?, 0) WHERE item_general_id = ? AND bodegas_id = ?`,
        [cantidad, itemId, origen],
      );
      await m.query(
        `DELETE FROM inventario WHERE item_general_id = ? AND bodegas_id = ? AND cantidad = 0`,
        [itemId, origen],
      );
      const checkDest: unknown[] = await m.query(
        `SELECT id_inventario FROM inventario WHERE item_general_id = ? AND bodegas_id = ?`,
        [itemId, destino],
      );
      if (checkDest.length) {
        await m.query(
          `UPDATE inventario SET cantidad = cantidad + ? WHERE item_general_id = ? AND bodegas_id = ?`,
          [cantidad, itemId, destino],
        );
      } else {
        await m.query(
          `INSERT INTO inventario (item_general_id, bodegas_id, cantidad, estado, tipo) VALUES (?, ?, ?, 1, 1)`,
          [itemId, destino, cantidad],
        );
      }

      const bo: { nombre: string }[] = await m.query(
        `SELECT nombre FROM bodegas WHERE id_bodegas = ?`,
        [origen],
      );
      const bd: { nombre: string }[] = await m.query(
        `SELECT nombre FROM bodegas WHERE id_bodegas = ?`,
        [destino],
      );
      const nomOrigen = bo[0]?.nombre ?? null;
      const nomDestino = bd[0]?.nombre ?? null;

      await this.capas.registrarMovimiento(m, {
        tipo: MOV.TIPO_TRASPASO,
        item_general_id: itemId,
        bodega_id: origen,
        cantidad,
        referencia_tipo: MOV.REF_TRASPASO,
        referencia_id: null,
        descripcion: `Traspaso de bodega ${nomOrigen} → ${nomDestino}`,
        saldo_anterior: saldoOrigenAntes,
        saldo_nuevo: saldoOrigenDespues,
        responsable: username,
        metadata: {
          bodega_origen_id: origen,
          bodega_origen_nombre: nomOrigen,
          bodega_destino_id: destino,
          bodega_destino_nombre: nomDestino,
          saldo_origen_antes: saldoOrigenAntes,
          saldo_origen_despues: saldoOrigenDespues,
          saldo_destino_antes: saldoDestinoAntes,
          saldo_destino_despues: saldoDestinoDespues,
          observaciones: dto.observaciones ?? null,
        },
      });
    });
  }

  /** DELETE /inventario/:itemId/bodega/:bodegaId — quita la fila legacy + audit AJUSTE. */
  async removeFromBodega(
    itemId: number,
    bodegaId: number,
    username: string,
    motivo?: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (m) => {
      const rows: { cantidad: string }[] = await m.query(
        `SELECT cantidad FROM inventario WHERE item_general_id = ? AND bodegas_id = ?`,
        [itemId, bodegaId],
      );
      if (!rows.length) {
        throw new NotFoundException('No se encontró el ítem en esta bodega');
      }
      const saldoAntes = Number(rows[0].cantidad);
      await m.query(
        `DELETE FROM inventario WHERE item_general_id = ? AND bodegas_id = ?`,
        [itemId, bodegaId],
      );
      const bo: { nombre: string }[] = await m.query(
        `SELECT nombre FROM bodegas WHERE id_bodegas = ?`,
        [bodegaId],
      );
      const nombre = bo[0]?.nombre ?? null;
      await this.capas.registrarMovimiento(m, {
        tipo: MOV.TIPO_AJUSTE,
        item_general_id: itemId,
        bodega_id: bodegaId,
        cantidad: saldoAntes,
        referencia_tipo: MOV.REF_AJUSTE,
        referencia_id: null,
        descripcion: `Ajuste manual: removido de bodega ${nombre}${motivo ? ` — ${motivo}` : ''}`,
        saldo_anterior: saldoAntes,
        saldo_nuevo: 0,
        responsable: username,
        metadata: {
          accion: 'remove_from_bodega',
          bodega_id: bodegaId,
          bodega_nombre: nombre,
          cantidad_removida: saldoAntes,
          motivo: motivo ?? null,
        },
      });
    });
  }

  // ── GET /inventario/capas/bodegas ──
  bodegasConCapas(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT DISTINCT b.id_bodegas, b.nombre
         FROM inventario_capas ic
         INNER JOIN bodegas b ON b.id_bodegas = ic.bodegas_id
        WHERE ic.estado = 1 AND ic.cantidad_disponible > 0
        ORDER BY b.nombre`,
    );
  }

  // ── GET /inventario/:id/capas?bodega_id= ──
  async capasDeItem(
    itemGeneralId: number,
    bodegaId?: number,
  ): Promise<Record<string, unknown>> {
    let sql = `
      SELECT ic.*, p.nombre_empresa AS proveedor_nombre,
             b.nombre AS bodega_nombre, u.nombre AS unidad_compra_nombre
        FROM inventario_capas ic
        LEFT JOIN proveedor p ON p.id_proveedor = ic.proveedor_id
        LEFT JOIN bodegas b   ON b.id_bodegas   = ic.bodegas_id
        LEFT JOIN unidad u    ON u.id_unidad    = ic.unidad_compra_id
       WHERE ic.item_general_id = ? AND ic.estado = 1 AND ic.cantidad_disponible > 0`;
    const params: unknown[] = [itemGeneralId];
    if (bodegaId) {
      sql += ' AND ic.bodegas_id = ?';
      params.push(bodegaId);
    }
    sql += ' ORDER BY ic.fecha_ingreso ASC';
    const capasRaw: Record<string, unknown>[] = await this.dataSource.query(
      sql,
      params,
    );

    // resumenStock (promedio ponderado, en PHP)
    let totalDisp = 0;
    let totalPond = 0;
    for (const c of capasRaw) {
      const qty = Number(c.cantidad_disponible);
      totalDisp += qty;
      totalPond += qty * Number(c.costo_unitario);
    }
    const stockTotal = this.r4(totalDisp);
    const promedio = totalDisp > 0 ? this.r4(totalPond / totalDisp) : 0;

    const itemRows: { nombre: string; codigo: string }[] =
      await this.dataSource.query(
        `SELECT id_item_general, nombre, codigo FROM item_general WHERE id_item_general = ?`,
        [itemGeneralId],
      );
    const item = itemRows[0];

    const nowSec = Date.now() / 1000;
    const capas = capasRaw.map((c) => ({
      id_capa: Number(c.id_capa),
      proveedor_id: c.proveedor_id ? Number(c.proveedor_id) : null,
      proveedor_nombre: c.proveedor_nombre ?? null,
      bodega_id: Number(c.bodegas_id),
      bodega_nombre: c.bodega_nombre ?? null,
      cantidad_original: Number(c.cantidad_original),
      cantidad_disponible: Number(c.cantidad_disponible),
      costo_unitario: Number(c.costo_unitario),
      unidad_compra_nombre: c.unidad_compra_nombre ?? null,
      factor_conversion: c.factor_conversion ? Number(c.factor_conversion) : null,
      precio_compra: c.precio_compra ? Number(c.precio_compra) : null,
      lote_proveedor: c.lote_proveedor ?? null,
      fecha_ingreso: c.fecha_ingreso,
      // fecha_ingreso es datetime naïve; CI4 lo interpreta en la TZ del server (UTC).
      // Parseamos como UTC ("...T...Z") para que el conteo de días coincida.
      dias_en_stock: Math.round(
        (nowSec -
          new Date(String(c.fecha_ingreso).replace(' ', 'T') + 'Z').getTime() /
            1000) /
          86400,
      ),
      orden_compra_id: c.orden_compra_id ? Number(c.orden_compra_id) : null,
    }));

    return {
      item_general_id: itemGeneralId,
      nombre: item?.nombre ?? null,
      codigo: item?.codigo ?? null,
      stock_total: stockTotal,
      costo_promedio_ponderado: promedio,
      total_capas: capasRaw.length,
      capas,
    };
  }

  // ── GET /inventario/capas/preparacion/:id ──
  async consumosPorPreparacion(
    preparacionId: number,
  ): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pcc.*, ic.proveedor_id, ic.lote_proveedor, ic.fecha_ingreso,
              p.nombre_empresa AS proveedor_nombre,
              ig.nombre AS item_nombre, ig.codigo AS item_codigo,
              b.nombre AS bodega_nombre
         FROM preparacion_consumo_capas pcc
         INNER JOIN inventario_capas ic ON ic.id_capa = pcc.capa_id
         INNER JOIN item_general ig ON ig.id_item_general = pcc.item_general_id
         LEFT JOIN proveedor p ON p.id_proveedor = ic.proveedor_id
         LEFT JOIN bodegas b ON b.id_bodegas = ic.bodegas_id
        WHERE pcc.preparacion_id = ?
        ORDER BY pcc.item_general_id, ic.fecha_ingreso`,
      [preparacionId],
    );
    return rows.map((c) => ({
      id: Number(c.id),
      capa_id: Number(c.capa_id),
      item_general_id: Number(c.item_general_id),
      item_nombre: c.item_nombre,
      item_codigo: c.item_codigo,
      cantidad_consumida: Number(c.cantidad_consumida),
      costo_unitario: Number(c.costo_unitario),
      costo_total: Number(c.costo_total),
      proveedor_nombre: c.proveedor_nombre ?? null,
      lote_proveedor: c.lote_proveedor ?? null,
      bodega_nombre: c.bodega_nombre ?? null,
      fecha_ingreso_capa: c.fecha_ingreso,
    }));
  }

  // ── GET /inventario/global?tipo= ──
  async inventarioGlobal(tipo?: number): Promise<Record<string, unknown>[]> {
    let q1 = `
      SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo,
             ub.nombre AS unidad_base, uv.nombre AS unidad_venta,
             COALESCE(SUM(ic.cantidad_disponible), 0) AS stock_total,
             COALESCE(SUM(ic.cantidad_disponible * ic.costo_unitario)
                      / NULLIF(SUM(ic.cantidad_disponible), 0), 0) AS costo_promedio,
             COALESCE(SUM(ic.cantidad_disponible * ic.costo_unitario), 0) AS valor_inventario,
             COUNT(DISTINCT CASE WHEN ic.cantidad_disponible > 0 THEN ic.bodegas_id END) AS bodegas_con_stock
        FROM item_general ig
        LEFT JOIN unidad ub ON ub.id_unidad = ig.unidad_almacenaje_id
        LEFT JOIN unidad uv ON uv.id_unidad = ig.unidad_id
        LEFT JOIN inventario_capas ic ON ic.item_general_id = ig.id_item_general AND ic.estado = 1`;
    const p1: unknown[] = [];
    if (tipo !== undefined) {
      q1 += ' WHERE ig.tipo = ?';
      p1.push(tipo);
    }
    q1 += ` GROUP BY ig.id_item_general, ig.nombre, ig.codigo, ig.tipo, ub.nombre, uv.nombre
            ORDER BY ig.nombre ASC`;
    const items: Record<string, unknown>[] = await this.dataSource.query(q1, p1);

    const bodegaRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ic.item_general_id, ic.bodegas_id, b.nombre AS bodega_nombre,
              COALESCE(ins.nombre, '') AS instalacion_nombre,
              SUM(ic.cantidad_disponible) AS cantidad
         FROM inventario_capas ic
         JOIN bodegas b ON b.id_bodegas = ic.bodegas_id
         LEFT JOIN instalaciones ins ON ins.id_instalaciones = b.instalaciones_id
        WHERE ic.estado = 1
        GROUP BY ic.item_general_id, ic.bodegas_id, b.nombre, ins.nombre
        HAVING SUM(ic.cantidad_disponible) > 0
        ORDER BY ic.item_general_id, b.nombre`,
    );
    const stockPorBodega = new Map<number, Record<string, unknown>[]>();
    for (const r of bodegaRows) {
      const id = Number(r.item_general_id);
      if (!stockPorBodega.has(id)) stockPorBodega.set(id, []);
      stockPorBodega.get(id)!.push({
        bodega_id: Number(r.bodegas_id),
        bodega: r.bodega_nombre,
        instalacion: r.instalacion_nombre,
        cantidad: Number(r.cantidad),
      });
    }

    const consumoRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pid.item_general_id, SUM(pid.cantidad) AS consumo_30_dias
         FROM produccion_insumos_detalle pid
         JOIN preparaciones p ON p.id_preparaciones = pid.preparacion_id
        WHERE p.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND p.estado != 3
        GROUP BY pid.item_general_id`,
    );
    const consumo = new Map<number, number>();
    for (const r of consumoRows) {
      consumo.set(Number(r.item_general_id), Number(r.consumo_30_dias));
    }

    return items.map((it) => {
      const id = Number(it.id_item_general);
      const stock = Number(it.stock_total);
      const consumoTotal = consumo.has(id) ? (consumo.get(id) as number) : null;
      const consumoDiario =
        consumoTotal ? Math.round((consumoTotal / 30) * 1e6) / 1e6 : null;
      const diasRestantes =
        consumoDiario && consumoDiario > 0
          ? Math.round(stock / consumoDiario)
          : null;
      return {
        id_item_general: id,
        nombre: it.nombre ?? null,
        codigo: it.codigo ?? null,
        tipo: Number(it.tipo),
        unidad_base: it.unidad_base ?? null,
        unidad_venta: it.unidad_venta ?? null,
        stock_total: Number(it.stock_total),
        costo_promedio: Number(it.costo_promedio),
        valor_inventario: Number(it.valor_inventario),
        bodegas_con_stock: Number(it.bodegas_con_stock),
        stock_por_bodega: stockPorBodega.get(id) ?? [],
        consumo_30_dias: consumoTotal,
        consumo_diario: consumoDiario,
        dias_restantes: diasRestantes,
      };
    });
  }

  private async pagCfg(): Promise<{ def: number; max: number }> {
    const read = async (clave: string, fb: number): Promise<number> => {
      try {
        const rows: { valor: unknown }[] = await this.dataSource.query(
          `SELECT valor FROM configuracion_sistema WHERE clave = ? LIMIT 1`,
          [clave],
        );
        return rows.length ? Number(rows[0].valor) || fb : fb;
      } catch {
        return fb;
      }
    };
    return { def: await read('page_size_default', 50), max: await read('max_per_page', 200) };
  }

  // ── GET /movimientos ──
  async movimientos(
    filtros: Record<string, string | undefined>,
    page: number,
    limitInput?: number,
  ): Promise<{ data: Record<string, unknown>[]; meta: Record<string, number> }> {
    const { def, max } = await this.pagCfg();
    const limit = Math.min(limitInput || def, max);
    const p = page > 0 ? page : 1;

    const where: string[] = [];
    const params: unknown[] = [];
    const eq = (col: string, key: string) => {
      if (filtros[key]) {
        where.push(`${col} = ?`);
        params.push(filtros[key]);
      }
    };
    eq('mi.item_general_id', 'item_general_id');
    eq('mi.bodega_id', 'bodega_id');
    eq('mi.tipo_movimiento', 'tipo_movimiento');
    eq('mi.referencia_tipo', 'referencia_tipo');
    eq('mi.responsable', 'responsable');
    if (filtros.fecha_inicio) {
      where.push('DATE(mi.fecha_movimiento) >= ?');
      params.push(filtros.fecha_inicio);
    }
    if (filtros.fecha_fin) {
      where.push('DATE(mi.fecha_movimiento) <= ?');
      params.push(filtros.fecha_fin);
    }
    if (filtros.search) {
      where.push(
        '(ig.nombre LIKE ? OR ig.codigo LIKE ? OR mi.descripcion LIKE ? OR mi.responsable LIKE ?)',
      );
      const t = `%${filtros.search}%`;
      params.push(t, t, t, t);
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const totalRows: { n: number }[] = await this.dataSource.query(
      `SELECT COUNT(*) AS n
         FROM movimiento_inventario mi
         LEFT JOIN item_general ig ON ig.id_item_general = mi.item_general_id
         LEFT JOIN bodegas bo ON bo.id_bodegas = mi.bodega_id
        ${whereSql}`,
      params,
    );
    const total = Number(totalRows[0].n);
    const offset = (p - 1) * limit;

    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT mi.*, ig.nombre AS item_nombre, ig.codigo AS item_codigo,
              bo.nombre AS bodega_nombre
         FROM movimiento_inventario mi
         LEFT JOIN item_general ig ON ig.id_item_general = mi.item_general_id
         LEFT JOIN bodegas bo ON bo.id_bodegas = mi.bodega_id
        ${whereSql}
        ORDER BY mi.id_movimiento_inventario DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const data = rows.map((row) => {
      const meta = row.metadata;
      return {
        ...row,
        cantidad: Number(row.cantidad),
        costo_unitario: Number(row.costo_unitario),
        saldo_anterior: Number(row.saldo_anterior),
        saldo_nuevo: Number(row.saldo_nuevo),
        metadata: meta && typeof meta === 'object' ? meta : null,
      };
    });

    return {
      data,
      meta: { total, page: p, limit, pages: Math.ceil(total / limit) },
    };
  }
}
