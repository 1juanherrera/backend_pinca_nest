import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

const N = (x: unknown) => Number(x ?? 0);

/** Réplica fiel de TrazabilidadController (CI4). Read-only: preparación↔lotes↔proveedores. */
@Injectable()
export class TrazabilidadService {
  constructor(private readonly dataSource: DataSource) {}

  private fail(msg: string, status: number): HttpException {
    return new HttpException({ msg }, status);
  }

  // ── GET /trazabilidad/preparacion/:id ──
  async porPreparacion(id: number): Promise<Record<string, unknown>> {
    if (id <= 0) throw this.fail('ID de preparación requerido', 400);

    const prep = (await this.dataSource.query(
      `SELECT p.id_preparaciones, p.cantidad, p.fecha_creacion, p.fecha_inicio, p.fecha_fin,
              p.estado, p.observaciones, p.item_general_id,
              ig.nombre AS producto_nombre, ig.codigo AS producto_codigo, u.nombre AS unidad_nombre
         FROM preparaciones p
         LEFT JOIN item_general ig ON ig.id_item_general = p.item_general_id
         LEFT JOIN unidad u        ON u.id_unidad        = p.unidad_id
        WHERE p.id_preparaciones = ?`,
      [id],
    ))[0];
    if (!prep) throw this.fail(`Preparación #${id} no encontrada`, 404);

    const consumos: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pcc.item_general_id, ig.nombre AS item_nombre, ig.codigo AS item_codigo,
              pcc.cantidad_consumida, pcc.costo_unitario, pcc.costo_total,
              ic.id_capa, ic.lote_proveedor, ic.fecha_ingreso AS fecha_ingreso_capa,
              ic.orden_compra_id, oc.numero AS orden_compra_numero,
              ic.proveedor_id, p.nombre_empresa AS proveedor_nombre, b.nombre AS bodega_nombre
         FROM preparacion_consumo_capas pcc
         JOIN inventario_capas ic ON ic.id_capa = pcc.capa_id
         JOIN item_general ig     ON ig.id_item_general = pcc.item_general_id
         LEFT JOIN proveedor p    ON p.id_proveedor = ic.proveedor_id
         LEFT JOIN bodegas b      ON b.id_bodegas   = ic.bodegas_id
         LEFT JOIN ordenes_compra oc ON oc.id_orden = ic.orden_compra_id
        WHERE pcc.preparacion_id = ?
        ORDER BY pcc.item_general_id, ic.fecha_ingreso ASC`,
      [id],
    );

    const porIng = new Map<number, Record<string, unknown>>();
    for (const c of consumos) {
      const key = N(c.item_general_id);
      if (!porIng.has(key)) {
        porIng.set(key, {
          item_general_id: N(c.item_general_id),
          nombre: c.item_nombre,
          codigo: c.item_codigo,
          cantidad_total: 0,
          costo_total: 0,
          capas: [],
        });
      }
      const g = porIng.get(key)!;
      (g.cantidad_total as number) += N(c.cantidad_consumida);
      (g.costo_total as number) += N(c.costo_total);
      (g.capas as Record<string, unknown>[]).push({
        capa_id: N(c.id_capa),
        lote_proveedor: c.lote_proveedor,
        fecha_ingreso: c.fecha_ingreso_capa,
        orden_compra_id: c.orden_compra_id ? N(c.orden_compra_id) : null,
        orden_compra_numero: c.orden_compra_numero,
        proveedor_id: c.proveedor_id ? N(c.proveedor_id) : null,
        proveedor_nombre: c.proveedor_nombre,
        bodega_nombre: c.bodega_nombre,
        cantidad: N(c.cantidad_consumida),
        costo_unitario: N(c.costo_unitario),
        subtotal: N(c.costo_total),
      });
    }

    return {
      preparacion: prep,
      ingredientes: [...porIng.values()],
      totales: {
        ingredientes_count: porIng.size,
        capas_count: consumos.length,
        costo_total: consumos.reduce((a, c) => a + N(c.costo_total), 0),
      },
    };
  }

  // ── GET /trazabilidad/lote/:lote ──
  async porLote(loteRaw: string): Promise<Record<string, unknown>> {
    const lote = decodeURIComponent(loteRaw ?? '').trim();
    if (lote === '') throw this.fail('Lote requerido', 400);

    const capas: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ic.id_capa, ic.lote_proveedor, ic.item_general_id, ig.nombre AS item_nombre,
              ig.codigo AS item_codigo, ic.proveedor_id, p.nombre_empresa AS proveedor_nombre,
              ic.fecha_ingreso, ic.cantidad_original, ic.cantidad_disponible, ic.costo_unitario,
              ic.orden_compra_id, oc.numero AS orden_compra_numero
         FROM inventario_capas ic
         JOIN item_general ig ON ig.id_item_general = ic.item_general_id
         LEFT JOIN proveedor p ON p.id_proveedor = ic.proveedor_id
         LEFT JOIN ordenes_compra oc ON oc.id_orden = ic.orden_compra_id
        WHERE ic.lote_proveedor = ?`,
      [lote],
    );

    if (!capas.length) {
      return { lote, capas: [], preparaciones: [], mensaje: 'No se encontró ningún lote con ese código.' };
    }

    const capaIds = capas.map((c) => N(c.id_capa));
    const ph = capaIds.map(() => '?').join(',');
    const preparaciones: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT DISTINCT p.id_preparaciones, p.fecha_creacion, p.fecha_inicio, p.fecha_fin,
              p.estado, p.cantidad, ig.nombre AS producto_nombre, ig.codigo AS producto_codigo,
              SUM(pcc.cantidad_consumida) AS cantidad_lote_usada, SUM(pcc.costo_total) AS costo_lote_usado
         FROM preparacion_consumo_capas pcc
         JOIN preparaciones p ON p.id_preparaciones = pcc.preparacion_id
         LEFT JOIN item_general ig ON ig.id_item_general = p.item_general_id
        WHERE pcc.capa_id IN (${ph})
        GROUP BY p.id_preparaciones, p.fecha_creacion, p.fecha_inicio, p.fecha_fin,
                 p.estado, p.cantidad, ig.nombre, ig.codigo
        ORDER BY p.fecha_creacion DESC`,
      capaIds,
    );

    return {
      lote,
      capas: capas.map((c) => ({
        id_capa: N(c.id_capa),
        item_general_id: N(c.item_general_id),
        item_nombre: c.item_nombre,
        item_codigo: c.item_codigo,
        proveedor_id: c.proveedor_id ? N(c.proveedor_id) : null,
        proveedor_nombre: c.proveedor_nombre,
        fecha_ingreso: c.fecha_ingreso,
        cantidad_original: N(c.cantidad_original),
        cantidad_disponible: N(c.cantidad_disponible),
        costo_unitario: N(c.costo_unitario),
        orden_compra_id: c.orden_compra_id ? N(c.orden_compra_id) : null,
        orden_compra_numero: c.orden_compra_numero,
      })),
      preparaciones: preparaciones.map((p) => ({
        id_preparaciones: N(p.id_preparaciones),
        producto_nombre: p.producto_nombre,
        producto_codigo: p.producto_codigo,
        cantidad: N(p.cantidad),
        fecha_creacion: p.fecha_creacion,
        fecha_inicio: p.fecha_inicio,
        fecha_fin: p.fecha_fin,
        estado: N(p.estado),
        cantidad_lote_usada: N(p.cantidad_lote_usada),
        costo_lote_usado: N(p.costo_lote_usado),
      })),
      totales: { capas_count: capas.length, preparaciones_count: preparaciones.length },
    };
  }

  // ── GET /trazabilidad/lotes?q= ──
  async lotes(qStr?: string): Promise<Record<string, unknown>[]> {
    const query = (qStr ?? '').trim();
    const params: unknown[] = [];
    let like = '';
    if (query !== '') { like = 'AND lote_proveedor LIKE ?'; params.push(`%${query}%`); }
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT lote_proveedor, COUNT(*) AS capas, MAX(fecha_ingreso) AS ultima_recepcion
         FROM inventario_capas
        WHERE lote_proveedor IS NOT NULL AND lote_proveedor != '' ${like}
        GROUP BY lote_proveedor ORDER BY ultima_recepcion DESC LIMIT 20`,
      params,
    );
    return rows.map((r) => ({
      lote: r.lote_proveedor,
      capas: N(r.capas),
      ultima_recepcion: r.ultima_recepcion,
    }));
  }
}
