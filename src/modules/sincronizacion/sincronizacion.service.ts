import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { CapasService } from '../inventario/capas.service';
import { ItemService } from '../item/item.service';
import { ClasificadorQuimicoService } from './clasificador-quimico.service';

/**
 * Réplica fiel de SincronizacionController + SincronizacionModel (endpoints NO-IA).
 * Migrado: stats, maestro, duplicados, huerfanos, merge.
 * Diferido a CI4: `pendientes` (usa ItemModel::buscarFuzzy + similar_text de PHP)
 * y todos los endpoints /ia/* (ClasificadorQuimicoService).
 * ⚠️ `merge` mueve stock/FKs entre ítems — verificado con golden harness.
 */
@Injectable()
export class SincronizacionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly capas: CapasService,
    private readonly item: ItemService,
  ) {}

  /**
   * Núcleo recursivo de similar_text de PHP sobre BYTES (longest common substring greedy,
   * primer máximo). PHP opera byte-a-byte (los acentos UTF-8 son multibyte), no char-a-char.
   */
  private simInner(s1: Buffer, s2: Buffer): number {
    let max = 0, pos1 = 0, pos2 = 0;
    for (let i = 0; i < s1.length; i++) {
      for (let j = 0; j < s2.length; j++) {
        let k = 0;
        while (i + k < s1.length && j + k < s2.length && s1[i + k] === s2[j + k]) k++;
        if (k > max) { max = k; pos1 = i; pos2 = j; }
      }
    }
    if (max === 0) return 0;
    return max + this.simInner(s1.subarray(0, pos1), s2.subarray(0, pos2)) + this.simInner(s1.subarray(pos1 + max), s2.subarray(pos2 + max));
  }
  /** similar_text(strtoupper($a),strtoupper($b),$percent) de PHP: uppercase ASCII-only + bytes UTF-8. */
  private similarPercent(a: string, b: string): number {
    const asciiUp = (s: string) => s.replace(/[a-z]/g, (c) => c.toUpperCase());
    const ba = Buffer.from(asciiUp(a), 'utf8');
    const bb = Buffer.from(asciiUp(b), 'utf8');
    const total = ba.length + bb.length;
    if (total === 0) return 0;
    return (this.simInner(ba, bb) * 200) / total;
  }

  // ── GET /sincronizacion/pendientes ──
  async pendientes(): Promise<Record<string, unknown>[]> {
    const pendientes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ip.id_item_proveedor, ip.nombre, ip.codigo, ip.precio_unitario, ip.factor_conversion,
              ip.unidad_compra_id, ip.proveedor_id, ip.tipo, p.nombre_empresa, uc.nombre AS unidad_compra_nombre
         FROM item_proveedor ip
         JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
         LEFT JOIN unidad uc ON uc.id_unidad = ip.unidad_compra_id
        WHERE ip.item_general_id IS NULL ORDER BY ip.id_item_proveedor DESC`,
    );
    if (!pendientes.length) return [];

    for (const p of pendientes) {
      const matches = await this.item.buscarFuzzy(String(p.nombre ?? ''), '3', '1,2');
      const sugerencias = matches.map((m) => ({
        id_item_general: Number(m.id_item_general),
        nombre: m.nombre,
        codigo: m.codigo ?? null,
        tipo: Number(m.tipo ?? 1),
        score: Math.round(this.similarPercent(String(p.nombre ?? ''), String(m.nombre ?? ''))),
      }));
      sugerencias.sort((a, b) => b.score - a.score);
      p.sugerencias = sugerencias;
      p.precio_unitario = Number(p.precio_unitario);
      p.factor_conversion = p.factor_conversion !== null && p.factor_conversion !== undefined ? Number(p.factor_conversion) : null;
    }
    return pendientes;
  }

  // ── normalización + Levenshtein (réplica de detectarDuplicados de CI4) ──
  private normalizar(nombre: string): string {
    return (nombre || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // acentos/ñ/ü → base
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    let cur = new Array<number>(n + 1);
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }

  private async detectarDuplicados(
    threshold: number,
  ): Promise<{ a: number; b: number; score: number }[]> {
    const rows: { id_item_general: number; nombre: string; categoria_id: number | null }[] =
      await this.dataSource.query(
        `SELECT id_item_general, nombre, categoria_id FROM item_general WHERE tipo = 1`,
      );
    const items = rows.map((r) => ({
      id: Number(r.id_item_general),
      norm: this.normalizar(r.nombre),
      cat: r.categoria_id != null ? Number(r.categoria_id) : null,
    }));
    const pares: { a: number; b: number; score: number }[] = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const A = items[i];
        const B = items[j];
        if (!A.norm || !B.norm || A.norm.length > 255 || B.norm.length > 255) continue;
        const maxLen = Math.max(A.norm.length, B.norm.length);
        if (maxLen === 0) continue;
        const dist = this.levenshtein(A.norm, B.norm);
        let score = Math.round((1 - dist / maxLen) * 100);
        if (A.cat !== null && B.cat !== null && A.cat === B.cat) score += 10;
        if (score >= threshold) {
          pares.push({ a: A.id, b: B.id, score: Math.min(score, 100) });
        }
      }
    }
    pares.sort((x, y) => y.score - x.score);
    return pares;
  }

  // ── GET /sincronizacion/stats ──
  // incluirDuplicados=false salta el Levenshtein O(n²) (lo usa el dashboard por velocidad).
  async stats(incluirDuplicados = true): Promise<Record<string, unknown>> {
    const c: Record<string, string>[] = await this.dataSource.query(
      `SELECT COUNT(*) AS total_mp,
              SUM(CASE WHEN prov_count >= 1 THEN 1 ELSE 0 END) AS mp_con_proveedor,
              SUM(CASE WHEN prov_count = 0  THEN 1 ELSE 0 END) AS mp_sin_proveedor,
              SUM(CASE WHEN prov_count = 1  THEN 1 ELSE 0 END) AS mp_un_solo_proveedor,
              SUM(CASE WHEN prov_count >= 2 THEN 1 ELSE 0 END) AS mp_dos_o_mas_proveedores
         FROM (SELECT ig.id_item_general,
                      (SELECT COUNT(*) FROM item_proveedor ip
                        WHERE ip.item_general_id = ig.id_item_general AND ip.disponible = 1) AS prov_count
                 FROM item_general ig WHERE ig.tipo = 1) t`,
    );
    const ip: Record<string, string>[] = await this.dataSource.query(
      `SELECT COUNT(*) AS items_proveedor_total,
              SUM(CASE WHEN item_general_id IS NULL THEN 1 ELSE 0 END) AS items_proveedor_pendientes
         FROM item_proveedor`,
    );
    const ah: { ahorro_potencial: string }[] = await this.dataSource.query(
      `SELECT COALESCE(SUM(CASE WHEN best.precio_min_kg > 0 AND ci.costo_unitario > best.precio_min_kg
                                THEN (ci.costo_unitario - best.precio_min_kg) * COALESCE(stock.stock_total, 0)
                                ELSE 0 END), 0) AS ahorro_potencial
         FROM item_general ig
         LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
         LEFT JOIN (SELECT item_general_id, MIN(precio_unitario / NULLIF(factor_conversion, 0)) AS precio_min_kg
                      FROM item_proveedor
                     WHERE disponible = 1 AND item_general_id IS NOT NULL AND factor_conversion > 0
                     GROUP BY item_general_id) best ON best.item_general_id = ig.id_item_general
         LEFT JOIN (SELECT item_general_id, SUM(cantidad_disponible) AS stock_total
                      FROM inventario_capas WHERE estado = 1 AND cantidad_disponible > 0
                     GROUP BY item_general_id) stock ON stock.item_general_id = ig.id_item_general
        WHERE ig.tipo = 1`,
    );
    const duplicados = incluirDuplicados ? (await this.detectarDuplicados(70)).length : null;
    return {
      total_mp: Number(c[0].total_mp),
      mp_con_proveedor: Number(c[0].mp_con_proveedor ?? 0),
      mp_sin_proveedor: Number(c[0].mp_sin_proveedor ?? 0),
      mp_un_solo_proveedor: Number(c[0].mp_un_solo_proveedor ?? 0),
      mp_dos_o_mas_proveedores: Number(c[0].mp_dos_o_mas_proveedores ?? 0),
      items_proveedor_total: Number(ip[0].items_proveedor_total),
      items_proveedor_pendientes: Number(ip[0].items_proveedor_pendientes ?? 0),
      duplicados_potenciales: duplicados,
      ahorro_potencial: Math.round(Number(ah[0].ahorro_potencial) * 100) / 100,
    };
  }

  // ── GET /sincronizacion/maestro ──
  async maestro(
    search?: string,
    cobertura?: string,
    tipo?: number,
  ): Promise<Record<string, unknown>[]> {
    let sql = `
      SELECT ig.id_item_general, ig.codigo, ig.nombre, ig.tipo, ig.categoria_id,
             cat.nombre AS categoria_nombre,
             COALESCE(ci.costo_unitario, 0) AS costo_unitario,
             COALESCE(stock.stock_total, 0) AS stock_total,
             COALESCE(prov.proveedores_count, 0) AS proveedores_count,
             prov.precio_min_kg, prov.precio_max_kg,
             CASE WHEN prov.precio_min_kg > 0 AND prov.precio_max_kg > 0
                  THEN ROUND(((prov.precio_max_kg - prov.precio_min_kg) / prov.precio_min_kg) * 100, 1)
                  ELSE 0 END AS spread_pct
        FROM item_general ig
        LEFT JOIN categoria cat ON cat.id_categoria = ig.categoria_id
        LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        LEFT JOIN (SELECT item_general_id, SUM(cantidad_disponible) AS stock_total
                     FROM inventario_capas WHERE estado = 1 AND cantidad_disponible > 0
                    GROUP BY item_general_id) stock ON stock.item_general_id = ig.id_item_general
        LEFT JOIN (SELECT item_general_id, COUNT(*) AS proveedores_count,
                          MIN(precio_unitario / NULLIF(factor_conversion, 0)) AS precio_min_kg,
                          MAX(precio_unitario / NULLIF(factor_conversion, 0)) AS precio_max_kg
                     FROM item_proveedor
                    WHERE disponible = 1 AND item_general_id IS NOT NULL AND factor_conversion > 0
                    GROUP BY item_general_id) prov ON prov.item_general_id = ig.id_item_general
       WHERE ig.tipo IN (1, 2)`;
    const params: unknown[] = [];
    if (tipo !== undefined) {
      sql += ' AND ig.tipo = ?';
      params.push(tipo);
    }
    if (search) {
      sql += ' AND (UPPER(ig.nombre) LIKE ? OR UPPER(ig.codigo) LIKE ?)';
      const t = '%' + search.toUpperCase() + '%';
      params.push(t, t);
    }
    if (cobertura === 'sin') sql += ' AND COALESCE(prov.proveedores_count, 0) = 0';
    else if (cobertura === 'uno') sql += ' AND COALESCE(prov.proveedores_count, 0) = 1';
    else if (cobertura === 'dos_mas') sql += ' AND COALESCE(prov.proveedores_count, 0) >= 2';
    sql += ' ORDER BY ig.nombre ASC';

    const items: Record<string, unknown>[] = await this.dataSource.query(sql, params);
    if (!items.length) return [];

    const ids = items.map((i) => Number(i.id_item_general));
    const provs: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ip.item_general_id, ip.id_item_proveedor, ip.precio_unitario, ip.factor_conversion,
              ip.unidad_compra_id, uc.nombre AS unidad_compra_nombre, p.id_proveedor, p.nombre_empresa,
              CASE WHEN ip.factor_conversion > 0 THEN ROUND(ip.precio_unitario / ip.factor_conversion, 2) ELSE NULL END AS precio_kg
         FROM item_proveedor ip
         JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
         LEFT JOIN unidad uc ON uc.id_unidad = ip.unidad_compra_id
        WHERE ip.item_general_id IN (${ids.map(() => '?').join(',')}) AND ip.disponible = 1
        ORDER BY ip.item_general_id, precio_kg ASC`,
      ids,
    );
    const byItem = new Map<number, Record<string, unknown>[]>();
    for (const p of provs) {
      const k = Number(p.item_general_id);
      if (!byItem.has(k)) byItem.set(k, []);
      byItem.get(k)!.push({
        id_item_proveedor: Number(p.id_item_proveedor),
        id_proveedor: Number(p.id_proveedor),
        nombre_empresa: p.nombre_empresa,
        precio_unitario: Number(p.precio_unitario),
        factor_conversion: Number(p.factor_conversion),
        unidad_compra_id: p.unidad_compra_id != null ? Number(p.unidad_compra_id) : null,
        unidad_compra_nombre: p.unidad_compra_nombre ?? null,
        precio_kg: p.precio_kg != null ? Number(p.precio_kg) : null,
      });
    }
    return items.map((i) => ({
      id_item_general: Number(i.id_item_general),
      codigo: i.codigo,
      nombre: i.nombre,
      tipo: Number(i.tipo),
      categoria_id: i.categoria_id != null ? Number(i.categoria_id) : null,
      categoria_nombre: i.categoria_nombre ?? null,
      costo_unitario: Number(i.costo_unitario),
      stock_total: Number(i.stock_total),
      proveedores_count: Number(i.proveedores_count),
      precio_min_kg: i.precio_min_kg != null ? Number(i.precio_min_kg) : null,
      precio_max_kg: i.precio_max_kg != null ? Number(i.precio_max_kg) : null,
      spread_pct: Number(i.spread_pct),
      proveedores: byItem.get(Number(i.id_item_general)) ?? [],
    }));
  }

  // ── GET /sincronizacion/duplicados ──
  async duplicados(threshold: number): Promise<Record<string, unknown>[]> {
    const th = Math.max(50, Math.min(threshold, 100));
    const pares = await this.detectarDuplicados(th);
    if (!pares.length) return [];
    const ids = [...new Set(pares.flatMap((p) => [p.a, p.b]))];
    const info: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.id_item_general, ig.codigo, ig.nombre,
              COALESCE(stock.stock_total, 0) AS stock_total,
              COALESCE(prov.proveedores_count, 0) AS proveedores_count
         FROM item_general ig
         LEFT JOIN (SELECT item_general_id, SUM(cantidad_disponible) AS stock_total
                      FROM inventario_capas WHERE estado = 1 AND cantidad_disponible > 0
                     GROUP BY item_general_id) stock ON stock.item_general_id = ig.id_item_general
         LEFT JOIN (SELECT item_general_id, COUNT(*) AS proveedores_count
                      FROM item_proveedor WHERE disponible = 1
                     GROUP BY item_general_id) prov ON prov.item_general_id = ig.id_item_general
        WHERE ig.id_item_general IN (${ids.map(() => '?').join(',')})`,
      ids,
    );
    const map = new Map<number, Record<string, unknown>>();
    for (const r of info) {
      map.set(Number(r.id_item_general), {
        id_item_general: Number(r.id_item_general),
        codigo: r.codigo,
        nombre: r.nombre,
        stock_total: Number(r.stock_total),
        proveedores_count: Number(r.proveedores_count),
      });
    }
    return pares.map((p) => ({ score: p.score, a: map.get(p.a), b: map.get(p.b) }));
  }

  // ── GET /sincronizacion/huerfanos ──
  huerfanos(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT ig.id_item_general, ig.codigo, ig.nombre, ig.categoria_id,
              cat.nombre AS categoria_nombre,
              COALESCE(stock.stock_total, 0) AS stock_total, ultima.ultima_compra
         FROM item_general ig
         LEFT JOIN categoria cat ON cat.id_categoria = ig.categoria_id
         LEFT JOIN (SELECT item_general_id, SUM(cantidad_disponible) AS stock_total
                      FROM inventario_capas WHERE estado = 1 AND cantidad_disponible > 0
                     GROUP BY item_general_id) stock ON stock.item_general_id = ig.id_item_general
         LEFT JOIN (SELECT ip.item_general_id, MAX(oc.fecha) AS ultima_compra
                      FROM ordenes_compra_detalle ocd
                      JOIN ordenes_compra oc ON oc.id_orden = ocd.ordenes_compra_id
                      JOIN item_proveedor ip ON ip.id_item_proveedor = ocd.item_proveedor_id
                     WHERE ip.item_general_id IS NOT NULL
                     GROUP BY ip.item_general_id) ultima ON ultima.item_general_id = ig.id_item_general
        WHERE ig.tipo = 1
          AND NOT EXISTS (SELECT 1 FROM item_proveedor ip2
                           WHERE ip2.item_general_id = ig.id_item_general AND ip2.disponible = 1)
        ORDER BY ig.nombre ASC`,
    );
  }

  // ── POST /sincronizacion/merge (endpoint HTTP: sin combinar_stock) ──
  async merge(keepId: number, removeId: number): Promise<Record<string, unknown>> {
    return this.dataSource.transaction((m) => this.mergeCore(m, keepId, removeId, {}));
  }

  /**
   * Motor N→1 (réplica de SincronizacionModel::merge). Opera sobre el manager de
   * la transacción del caller para poder anidarse: fusionarCluster lo llama en loop.
   */
  private async mergeCore(
    m: EntityManager,
    keepId: number,
    removeId: number,
    opts: { combinar_stock?: boolean; nombre_base?: string | null },
  ): Promise<Record<string, unknown>> {
    if (keepId === removeId) {
      throw new BadRequestException('keep_id y remove_id no pueden ser iguales.');
    }
    const keepRows: { tipo: number; nombre: string }[] = await m.query(
      `SELECT tipo, nombre FROM item_general WHERE id_item_general = ?`,
      [keepId],
    );
    const remRows: { tipo: number; nombre: string }[] = await m.query(
      `SELECT tipo, nombre FROM item_general WHERE id_item_general = ?`,
      [removeId],
    );
    if (!keepRows.length || !remRows.length) {
      throw new BadRequestException('Uno o ambos items no existen.');
    }
    if (Number(keepRows[0].tipo) !== Number(remRows[0].tipo)) {
      throw new BadRequestException(
        'Los items deben tener el mismo tipo (MP, Insumo, Producto) para poder unificarse.',
      );
    }
    if (!opts.combinar_stock) {
      const stockRows: { total: string }[] = await m.query(
        `SELECT COALESCE(SUM(cantidad_disponible), 0) AS total FROM inventario_capas
          WHERE item_general_id = ? AND estado = 1 AND cantidad_disponible > 0`,
        [removeId],
      );
      if (Number(stockRows[0].total) > 0) {
        throw new BadRequestException(
          'El item a remover tiene stock activo. Activá "combinar stock" o consume/traslada sus capas antes de unificar.',
        );
      }
    }

    const nombreOriginal = remRows[0].nombre;
    const nombreKeep = keepRows[0].nombre;

    {
      const af: Record<string, number> = {
        proveedores: 0,
        formulaciones: 0,
        costos_indirectos: 0,
        inventario_legacy: 0,
        capas_historicas: 0,
        movimientos: 0,
        produccion_snapshot: 0,
        costos_item_removed: 0,
      };

      // 1) item_proveedor
      const ipIds: { id_item_proveedor: number }[] = await m.query(
        `SELECT id_item_proveedor FROM item_proveedor WHERE item_general_id = ?`,
        [removeId],
      );
      const rProv = await m.query(
        `UPDATE item_proveedor SET item_general_id = ? WHERE item_general_id = ?`,
        [keepId, removeId],
      );
      af.proveedores = rProv.affectedRows ?? 0;

      // 2) item_general_formulaciones (consolida duplicados)
      const dupsForm: {
        formulaciones_id: number;
        cant_remove: string;
        pct_remove: number | null;
        cant_keep: string;
        pct_keep: number | null;
      }[] = await m.query(
        `SELECT a.formulaciones_id, a.cantidad AS cant_remove, a.porcentaje AS pct_remove,
                b.cantidad AS cant_keep, b.porcentaje AS pct_keep
           FROM item_general_formulaciones a
           JOIN item_general_formulaciones b ON b.formulaciones_id = a.formulaciones_id AND b.item_general_id = ?
          WHERE a.item_general_id = ?`,
        [keepId, removeId],
      );
      for (const d of dupsForm) {
        await m.query(
          `UPDATE item_general_formulaciones SET cantidad = ?, porcentaje = ?
            WHERE formulaciones_id = ? AND item_general_id = ?`,
          [
            Number(d.cant_keep) + Number(d.cant_remove),
            Number(d.pct_keep ?? 0) + Number(d.pct_remove ?? 0),
            d.formulaciones_id,
            keepId,
          ],
        );
        await m.query(
          `DELETE FROM item_general_formulaciones WHERE formulaciones_id = ? AND item_general_id = ?`,
          [d.formulaciones_id, removeId],
        );
      }
      const rForm = await m.query(
        `UPDATE item_general_formulaciones SET item_general_id = ? WHERE item_general_id = ?`,
        [keepId, removeId],
      );
      af.formulaciones = (rForm.affectedRows ?? 0) + dupsForm.length;

      // 3) costos_indirectos_item (dedup)
      try {
        const dupCI: { costos_indirectos_id: number }[] = await m.query(
          `SELECT a.costos_indirectos_id FROM costos_indirectos_item a
             JOIN costos_indirectos_item b ON b.costos_indirectos_id = a.costos_indirectos_id AND b.item_general_id = ?
            WHERE a.item_general_id = ?`,
          [keepId, removeId],
        );
        for (const d of dupCI) {
          await m.query(
            `DELETE FROM costos_indirectos_item WHERE item_general_id = ? AND costos_indirectos_id = ?`,
            [removeId, d.costos_indirectos_id],
          );
        }
        const rCI = await m.query(
          `UPDATE costos_indirectos_item SET item_general_id = ? WHERE item_general_id = ?`,
          [keepId, removeId],
        );
        af.costos_indirectos = (rCI.affectedRows ?? 0) + dupCI.length;
      } catch {
        /* tabla puede no existir */
      }

      // 4) inventario legacy
      const rInv = await m.query(
        `UPDATE inventario SET item_general_id = ? WHERE item_general_id = ?`,
        [keepId, removeId],
      );
      af.inventario_legacy = rInv.affectedRows ?? 0;

      // 5) inventario_capas
      const capaIds: { id_capa: number }[] = await m.query(
        `SELECT id_capa FROM inventario_capas WHERE item_general_id = ?`,
        [removeId],
      );
      const rCap = await m.query(
        `UPDATE inventario_capas SET item_general_id = ? WHERE item_general_id = ?`,
        [keepId, removeId],
      );
      af.capas_historicas = rCap.affectedRows ?? 0;

      // 6) movimiento_inventario
      const rMov = await m.query(
        `UPDATE movimiento_inventario SET item_general_id = ? WHERE item_general_id = ?`,
        [keepId, removeId],
      );
      af.movimientos = rMov.affectedRows ?? 0;

      // 7) produccion_insumos_detalle
      const rProd = await m.query(
        `UPDATE produccion_insumos_detalle SET item_general_id = ? WHERE item_general_id = ?`,
        [keepId, removeId],
      );
      af.produccion_snapshot = rProd.affectedRows ?? 0;

      // 8) costos_item (borra la del remove)
      const rCost = await m.query(
        `DELETE FROM costos_item WHERE item_general_id = ?`,
        [removeId],
      );
      af.costos_item_removed = rCost.affectedRows ?? 0;

      // 9) marcar removido
      const nuevoNombre = `[MERGED→${keepId}] ${nombreOriginal.substring(0, 200)}`;
      await m.query(`UPDATE item_general SET nombre = ? WHERE id_item_general = ?`, [
        nuevoNombre,
        removeId,
      ]);

      // 10) recalcular costo del keep
      const costoKeep = await this.capas.recalcularPromedioPonderado(m, keepId);

      // 11) renombrar keep si viene nombre_base (fusión IA)
      if (opts.nombre_base && opts.nombre_base.trim()) {
        await m.query(`UPDATE item_general SET nombre = ? WHERE id_item_general = ?`, [
          opts.nombre_base.trim().substring(0, 200),
          keepId,
        ]);
      }

      return {
        keep_id: keepId,
        remove_id: removeId,
        nombre_remove: nuevoNombre,
        nombre_remove_original: nombreOriginal,
        nombre_keep: opts.nombre_base && opts.nombre_base.trim()
          ? opts.nombre_base.trim().substring(0, 200)
          : nombreKeep,
        afectados: af,
        detalle_movimientos: {
          item_proveedor: ipIds.map((x) => Number(x.id_item_proveedor)),
          inventario_capas: capaIds.map((x) => Number(x.id_capa)),
        },
        costo_keep: costoKeep,
      };
    }
  }

  // ═══════════════════ GESTIÓN DE CLUSTERS (dedup IA, sin LLM) ═══════════════════

  /** items de un cluster con datos enriquecidos (stock, proveedores, costo). */
  private itemsDeCluster(clusterId: number): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT ci.id, ci.item_general_id, ci.rol, ci.confianza_item, ci.motivo_revision,
              ig.nombre, ig.codigo, ig.tipo,
              COALESCE(costos_item.costo_unitario, 0) AS costo_unitario,
              COALESCE((SELECT SUM(cantidad_disponible) FROM inventario_capas
                         WHERE item_general_id = ci.item_general_id AND estado = 1 AND cantidad_disponible > 0), 0) AS stock_total,
              COALESCE((SELECT COUNT(*) FROM item_proveedor
                         WHERE item_general_id = ci.item_general_id AND disponible = 1 AND deleted_at IS NULL), 0) AS proveedores_count
         FROM item_sync_cluster_items ci
         INNER JOIN item_general ig ON ig.id_item_general = ci.item_general_id
         LEFT JOIN costos_item ON costos_item.item_general_id = ci.item_general_id
        WHERE ci.cluster_id = ?
        ORDER BY FIELD(ci.rol,'keep','merge','excluido'), ig.nombre`,
      [clusterId],
    );
  }

  /** GET /ia/clusters → array crudo (con items). */
  async listarClusters(
    estado?: string,
    confianza?: string,
    tipo?: number,
  ): Promise<Record<string, unknown>[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (estado) { where.push('estado = ?'); params.push(estado); }
    if (confianza) { where.push('confianza = ?'); params.push(confianza); }
    if (tipo !== undefined) { where.push('tipo = ?'); params.push(tipo); }
    const clusters: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM item_sync_clusters ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY FIELD(confianza,'alta','media','baja'), id_cluster DESC`,
      params,
    );
    for (const c of clusters) c.items = await this.itemsDeCluster(Number(c.id_cluster));
    return clusters;
  }

  /** GET /ia/clusters/:id → objeto crudo (con items) o null (404). */
  async detalleCluster(id: number): Promise<Record<string, unknown> | null> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM item_sync_clusters WHERE id_cluster = ?`,
      [id],
    );
    if (!rows.length) return null;
    rows[0].items = await this.itemsDeCluster(id);
    return rows[0];
  }

  /** PATCH /ia/clusters/:id (editar nombre base / keep aprobado). */
  async actualizarCluster(
    id: number,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    if ('nombre_base_aprobado' in data) {
      sets.push('nombre_base_aprobado = ?');
      params.push(data.nombre_base_aprobado ?? null);
    }
    let keepAprobado: number | null = null;
    if ('keep_id_aprobado' in data) {
      keepAprobado = Number(data.keep_id_aprobado);
      sets.push('keep_id_aprobado = ?');
      params.push(keepAprobado);
    }
    if (
      'estado' in data &&
      ['propuesto', 'revisado', 'aprobado', 'descartado'].includes(
        String(data.estado),
      )
    ) {
      sets.push('estado = ?');
      params.push(data.estado);
    }
    if (!sets.length) return this.detalleCluster(id);

    await this.dataSource.transaction(async (m) => {
      await m.query(
        `UPDATE item_sync_clusters SET ${sets.join(', ')}, updated_at = NOW() WHERE id_cluster = ?`,
        [...params, id],
      );
      if (keepAprobado && keepAprobado > 0) {
        await m.query(
          `UPDATE item_sync_cluster_items SET rol = 'merge' WHERE cluster_id = ? AND rol = 'keep'`,
          [id],
        );
        await m.query(
          `UPDATE item_sync_cluster_items SET rol = 'keep' WHERE cluster_id = ? AND item_general_id = ?`,
          [id, keepAprobado],
        );
      }
    });
    return this.detalleCluster(id);
  }

  /** PATCH /ia/cluster-items/:id (mover item de rol). */
  async moverItem(itemRowId: number, rol: string): Promise<void> {
    if (!['keep', 'merge', 'excluido'].includes(rol)) {
      throw new BadRequestException('Rol inválido.');
    }
    await this.dataSource.transaction(async (m) => {
      const rows: { cluster_id: number; item_general_id: number }[] = await m.query(
        `SELECT cluster_id, item_general_id FROM item_sync_cluster_items WHERE id = ?`,
        [itemRowId],
      );
      if (!rows.length) throw new BadRequestException('Miembro no encontrado.');
      const { cluster_id, item_general_id } = rows[0];
      if (rol === 'keep') {
        await m.query(
          `UPDATE item_sync_cluster_items SET rol = 'merge' WHERE cluster_id = ? AND rol = 'keep'`,
          [cluster_id],
        );
        await m.query(
          `UPDATE item_sync_clusters SET keep_id_aprobado = ?, updated_at = NOW() WHERE id_cluster = ?`,
          [item_general_id, cluster_id],
        );
      }
      await m.query(`UPDATE item_sync_cluster_items SET rol = ? WHERE id = ?`, [rol, itemRowId]);
    });
  }

  /** POST /ia/clusters/:id/descartar. */
  async descartarCluster(id: number): Promise<void> {
    await this.dataSource.query(
      `UPDATE item_sync_clusters SET estado = 'descartado', updated_at = NOW() WHERE id_cluster = ?`,
      [id],
    );
  }

  /** POST /ia/clusters/:id/fusionar → merge N→1 en loop + auditoría por par. */
  async fusionarCluster(
    clusterId: number,
    responsable: string,
  ): Promise<Record<string, unknown>> {
    const cRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM item_sync_clusters WHERE id_cluster = ?`,
      [clusterId],
    );
    if (!cRows.length) throw new BadRequestException('Cluster no encontrado.');
    const cluster = cRows[0];
    if (cluster.estado === 'fusionado') {
      throw new BadRequestException('Este grupo ya fue fusionado.');
    }
    const miembros: { item_general_id: number; rol: string }[] = await this.dataSource.query(
      `SELECT item_general_id, rol FROM item_sync_cluster_items WHERE cluster_id = ?`,
      [clusterId],
    );
    const keepId = Number(
      cluster.keep_id_aprobado || cluster.keep_id_sugerido || 0,
    );
    if (keepId <= 0) {
      throw new BadRequestException(
        'El grupo no tiene un ítem "conservar" (keep) definido.',
      );
    }
    const removeIds = miembros
      .filter((mm) => mm.rol === 'merge' && Number(mm.item_general_id) !== keepId)
      .map((mm) => Number(mm.item_general_id));
    if (!removeIds.length) {
      throw new BadRequestException(
        'No hay ítems marcados para fusionar (rol=merge).',
      );
    }
    const nombreBase =
      (cluster.nombre_base_aprobado as string) ||
      (cluster.nombre_base_propuesto as string) ||
      null;

    const costoAntesRows: { costo_unitario: string }[] = await this.dataSource.query(
      `SELECT costo_unitario FROM costos_item WHERE item_general_id = ? LIMIT 1`,
      [keepId],
    );
    const costoAntes = costoAntesRows.length ? Number(costoAntesRows[0].costo_unitario) : 0;
    const nombreKeepAntesRows: { nombre: string }[] = await this.dataSource.query(
      `SELECT nombre FROM item_general WHERE id_item_general = ?`,
      [keepId],
    );
    const nombreKeepAntes = nombreKeepAntesRows[0]?.nombre ?? null;

    await this.dataSource.transaction(async (m) => {
      for (const rid of removeIds) {
        const res = await this.mergeCore(m, keepId, rid, {
          combinar_stock: true,
          nombre_base: nombreBase,
        });
        // auditoría por par
        await m.query(
          `INSERT INTO item_sync_auditoria
             (cluster_id, keep_id, remove_id, nombre_keep_antes, nombre_keep_despues,
              nombre_remove_original, costo_keep_antes, costo_keep_despues, afectados,
              detalle_movimientos, responsable, revertido, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
          [
            clusterId,
            keepId,
            rid,
            nombreKeepAntes,
            res.nombre_keep,
            res.nombre_remove_original,
            costoAntes,
            res.costo_keep,
            JSON.stringify(res.afectados),
            JSON.stringify(res.detalle_movimientos),
            responsable,
          ],
        );
      }
      await m.query(
        `UPDATE item_sync_clusters SET estado = 'fusionado', keep_id_aprobado = ?, nombre_base_aprobado = ?,
                aprobado_por = ?, fusionado_at = NOW(), updated_at = NOW() WHERE id_cluster = ?`,
        [keepId, nombreBase, responsable, clusterId],
      );
    });

    return {
      cluster_id: clusterId,
      keep_id: keepId,
      fusionados: removeIds.length,
      remove_ids: removeIds,
      verificacion: await this.verificarPostMerge(keepId),
    };
  }

  /** GET /ia/verificar/:keepId → chequeo determinista de fórmulas post-merge. */
  async verificarPostMerge(keepId: number): Promise<Record<string, unknown>> {
    const formulas: {
      formulaciones_id: number;
      nombre: string;
      n_ing: number;
      n_null: number;
      suma_pct: string | null;
      veces_keep: number;
    }[] = await this.dataSource.query(
      `SELECT igf.formulaciones_id, f.nombre,
              COUNT(*) AS n_ing,
              SUM(CASE WHEN igf.porcentaje IS NULL THEN 1 ELSE 0 END) AS n_null,
              SUM(igf.porcentaje) AS suma_pct,
              SUM(CASE WHEN igf.item_general_id = ? THEN 1 ELSE 0 END) AS veces_keep
         FROM item_general_formulaciones igf
         INNER JOIN formulaciones f ON f.id_formulaciones = igf.formulaciones_id
        WHERE igf.formulaciones_id IN (
              SELECT formulaciones_id FROM item_general_formulaciones WHERE item_general_id = ?)
        GROUP BY igf.formulaciones_id, f.nombre`,
      [keepId, keepId],
    );
    let conDuplicado = 0;
    const formulasOut = formulas.map((r) => {
      const nIng = Number(r.n_ing);
      const nNull = Number(r.n_null);
      const suma = Number(r.suma_pct ?? 0);
      const vecesKeep = Number(r.veces_keep);
      let porcentajeEstado: string;
      if (nNull === nIng) porcentajeEstado = 'no_definido';
      else if (Math.abs(suma - 100) <= 0.5) porcentajeEstado = 'ok';
      else porcentajeEstado = 'fuera_de_rango';
      const dup = vecesKeep > 1;
      if (dup) conDuplicado++;
      return {
        formulaciones_id: Number(r.formulaciones_id),
        nombre: r.nombre,
        porcentaje_estado: porcentajeEstado,
        suma_porcentaje: suma,
        ingrediente_duplicado: dup,
      };
    });
    const costoRows: { costo_unitario: string }[] = await this.dataSource.query(
      `SELECT costo_unitario FROM costos_item WHERE item_general_id = ? LIMIT 1`,
      [keepId],
    );
    return {
      keep_id: keepId,
      formulas: formulasOut,
      formulas_afectadas: formulasOut.length,
      con_duplicado: conDuplicado,
      costo_item_ok: costoRows.length > 0,
      costo_unitario: costoRows.length ? Number(costoRows[0].costo_unitario) : 0,
    };
  }

  /** POST /ia/auditoria/:id/revertir → UNDO parcial (item_proveedor + capas). */
  async revertirMerge(
    auditoriaId: number,
    responsable: string,
  ): Promise<Record<string, unknown>> {
    const aRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM item_sync_auditoria WHERE id = ?`,
      [auditoriaId],
    );
    if (!aRows.length) {
      throw new NotFoundException(`Auditoría #${auditoriaId} no encontrada.`);
    }
    const aud = aRows[0];
    if (Number(aud.revertido) === 1) {
      throw new BadRequestException('Esta fusión ya fue revertida.');
    }
    const keepId = Number(aud.keep_id);
    const removeId = Number(aud.remove_id);
    const detalle =
      typeof aud.detalle_movimientos === 'string'
        ? JSON.parse(aud.detalle_movimientos as string)
        : (aud.detalle_movimientos as { item_proveedor?: number[]; inventario_capas?: number[] });
    const ipIds: number[] = detalle?.item_proveedor ?? [];
    const capaIds: number[] = detalle?.inventario_capas ?? [];

    await this.dataSource.transaction(async (m) => {
      if (ipIds.length) {
        await m.query(
          `UPDATE item_proveedor SET item_general_id = ? WHERE id_item_proveedor IN (${ipIds.map(() => '?').join(',')})`,
          [removeId, ...ipIds],
        );
      }
      if (capaIds.length) {
        await m.query(
          `UPDATE inventario_capas SET item_general_id = ? WHERE id_capa IN (${capaIds.map(() => '?').join(',')})`,
          [removeId, ...capaIds],
        );
      }
      if (aud.nombre_remove_original) {
        await m.query(`UPDATE item_general SET nombre = ? WHERE id_item_general = ?`, [
          aud.nombre_remove_original,
          removeId,
        ]);
      }
      if (aud.nombre_keep_antes) {
        await m.query(`UPDATE item_general SET nombre = ? WHERE id_item_general = ?`, [
          aud.nombre_keep_antes,
          keepId,
        ]);
      }
      const cExists: { n: number }[] = await m.query(
        `SELECT COUNT(*) AS n FROM costos_item WHERE item_general_id = ?`,
        [removeId],
      );
      if (!Number(cExists[0].n)) {
        await m.query(
          `INSERT INTO costos_item (item_general_id, costo_unitario) VALUES (?, 0)`,
          [removeId],
        );
      }
      await this.capas.recalcularPromedioPonderado(m, removeId);
      await this.capas.recalcularPromedioPonderado(m, keepId);
      await m.query(
        `UPDATE item_sync_auditoria SET revertido = 1, revertido_at = NOW(), revertido_por = ? WHERE id = ?`,
        [responsable, auditoriaId],
      );
    });

    return {
      auditoria_id: auditoriaId,
      keep_id: keepId,
      remove_id: removeId,
      parcial: true,
      advertencia:
        'Las cantidades de ingredientes consolidadas en fórmulas y los snapshots de producción NO se revierten. Para reversa total restaurá el backup previo a la fusión.',
    };
  }

  // ══════════ Reemplazo manual de MP en fórmulas (buscar/reemplazar A→B) ══════════

  private fail(msg: string, status: number): HttpException {
    return new HttpException({ msg }, status);
  }

  /** Fórmulas que usan una materia (para el preview del reemplazo). */
  formulasQueUsan(itemId: number, toId: number | null = null): Promise<Record<string, unknown>[]> {
    const tieneReemplazo = toId
      ? `EXISTS(SELECT 1 FROM item_general_formulaciones b WHERE b.formulaciones_id = igf.formulaciones_id AND b.item_general_id = ?)`
      : '0';
    const bind = toId ? [toId, itemId] : [itemId];
    return this.dataSource.query(
      `SELECT igf.formulaciones_id, MAX(f.nombre) AS formula_nombre, MAX(f.estado) AS formula_estado,
              MAX(p.nombre) AS producto_nombre, MAX(p.codigo) AS producto_codigo,
              SUM(igf.cantidad) AS cantidad, MAX(ci.costo_unitario) AS costo_unitario,
              ROUND(SUM(igf.cantidad) * COALESCE(MAX(ci.costo_unitario), 0), 2) AS costo_en_formula,
              (SELECT COUNT(*) FROM item_general_formulaciones t WHERE t.formulaciones_id = igf.formulaciones_id) AS ingredientes,
              ${tieneReemplazo} AS tiene_reemplazo
         FROM item_general_formulaciones igf
         JOIN formulaciones f ON f.id_formulaciones = igf.formulaciones_id
         LEFT JOIN item_general p ON p.id_item_general = f.item_general_id
         LEFT JOIN costos_item ci ON ci.item_general_id = igf.item_general_id
        WHERE igf.item_general_id = ?
        GROUP BY igf.formulaciones_id ORDER BY MAX(p.nombre)`,
      bind,
    );
  }

  // GET /sincronizacion/uso-formulas/:itemId
  async usoEnFormulas(itemId: number, to = 0): Promise<Record<string, unknown>> {
    if (itemId <= 0) throw this.fail('itemId inválido.', 400);
    const stock = Number(
      (await this.dataSource.query(
        `SELECT COALESCE(SUM(cantidad_disponible),0) AS s FROM inventario_capas WHERE item_general_id = ? AND estado = 1 AND cantidad_disponible > 0`,
        [itemId],
      ))[0].s,
    );
    return { item_id: itemId, origen_stock: stock, formulas: await this.formulasQueUsan(itemId, to > 0 ? to : null) };
  }

  // POST /sincronizacion/reemplazar-formula
  async reemplazarEnFormulas(
    fromId: number,
    toId: number,
    formulacionIds: unknown[] | null,
    usuario: string,
  ): Promise<Record<string, unknown>> {
    if (fromId === toId) throw this.fail('La materia origen y la de reemplazo no pueden ser la misma.', 422);
    const from = (await this.dataSource.query(`SELECT nombre FROM item_general WHERE id_item_general = ?`, [fromId]))[0];
    const to = (await this.dataSource.query(`SELECT nombre FROM item_general WHERE id_item_general = ?`, [toId]))[0];
    if (!from) throw this.fail('La materia origen no existe.', 422);
    if (!to) throw this.fail('La materia de reemplazo no existe.', 422);

    let scope: number[] | null = null;
    if (Array.isArray(formulacionIds) && formulacionIds.length) {
      scope = [...new Set(formulacionIds.map((x) => Math.trunc(Number(x))).filter((x) => x > 0))];
      if (!scope.length) scope = null;
    }

    return this.dataSource.transaction(async (m) => {
      let grpSql = `SELECT formulaciones_id, SUM(cantidad) AS sc, SUM(porcentaje) AS sp
                      FROM item_general_formulaciones WHERE item_general_id = ?`;
      const grpBind: unknown[] = [fromId];
      if (scope) { grpSql += ` AND formulaciones_id IN (${scope.map(() => '?').join(',')})`; grpBind.push(...scope); }
      grpSql += ' GROUP BY formulaciones_id';
      const formulas: Record<string, unknown>[] = await m.query(grpSql, grpBind);

      const afectadasIds = formulas.map((f) => Number(f.formulaciones_id));
      let snapshot: Record<string, unknown>[] = [];
      if (afectadasIds.length) {
        const ph = afectadasIds.map(() => '?').join(',');
        snapshot = await m.query(
          `SELECT formulaciones_id, item_general_id, cantidad, porcentaje
             FROM item_general_formulaciones WHERE item_general_id IN (?, ?) AND formulaciones_id IN (${ph})`,
          [fromId, toId, ...afectadasIds],
        );
      }

      let consolidadas = 0;
      let repuntadas = 0;
      for (const f of formulas) {
        const fid = Number(f.formulaciones_id);
        const sumC = Number(f.sc);
        const sumP = Number(f.sp);
        await m.query(`DELETE FROM item_general_formulaciones WHERE formulaciones_id = ? AND item_general_id = ?`, [fid, fromId]);
        const bRow = (await m.query(
          `SELECT id_item_general_formulaciones, cantidad, porcentaje FROM item_general_formulaciones
            WHERE formulaciones_id = ? AND item_general_id = ? ORDER BY id_item_general_formulaciones ASC LIMIT 1`,
          [fid, toId],
        ))[0];
        if (bRow) {
          await m.query(
            `UPDATE item_general_formulaciones SET cantidad = ?, porcentaje = ? WHERE id_item_general_formulaciones = ?`,
            [Number(bRow.cantidad) + sumC, Number(bRow.porcentaje) + sumP, bRow.id_item_general_formulaciones],
          );
          consolidadas++;
        } else {
          await m.query(
            `INSERT INTO item_general_formulaciones (formulaciones_id, item_general_id, cantidad, porcentaje) VALUES (?, ?, ?, ?)`,
            [fid, toId, sumC, sumP],
          );
          repuntadas++;
        }
      }

      const usoRestante = Number(
        (await m.query(`SELECT COUNT(*) AS c FROM item_general_formulaciones WHERE item_general_id = ?`, [fromId]))[0].c,
      );
      const stockActivo = Number(
        (await m.query(
          `SELECT COUNT(*) AS c FROM inventario_capas WHERE item_general_id = ? AND estado = 1 AND cantidad_disponible > 0`,
          [fromId],
        ))[0].c,
      );
      let aEliminada = false;
      if (usoRestante === 0 && stockActivo === 0) {
        await m.query(`UPDATE item_general SET deleted_at = NOW() WHERE id_item_general = ?`, [fromId]);
        aEliminada = true;
      }

      let logId: number | null = null;
      if (afectadasIds.length) {
        const res: { insertId: number } = await m.query(
          `INSERT INTO item_reemplazo_log
             (from_item_id, to_item_id, from_nombre, to_nombre, formulas_afectadas, origen_eliminada, snapshot, usuario, revertido, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
          [
            fromId, toId, String(from.nombre ?? '').slice(0, 150), String(to.nombre ?? '').slice(0, 150),
            consolidadas + repuntadas, aEliminada ? 1 : 0, JSON.stringify(snapshot), String(usuario).slice(0, 100),
          ],
        );
        logId = res.insertId;
      }

      return {
        ok: true, log_id: logId, consolidadas, repuntadas,
        formulas_afectadas: consolidadas + repuntadas, origen_eliminada: aEliminada,
        origen_uso_restante: usoRestante, origen_stock_activo: stockActivo,
        msg: `Reemplazo aplicado: ${repuntadas} repuntada(s), ${consolidadas} consolidada(s)`
          + (aEliminada ? '. La materia origen quedó sin uso y se marcó como eliminada.' : '.'),
      };
    });
  }

  // GET /sincronizacion/reemplazos
  historialReemplazos(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT id, from_item_id, to_item_id, from_nombre, to_nombre, formulas_afectadas,
              origen_eliminada, usuario, revertido, created_at, revertido_at
         FROM item_reemplazo_log ORDER BY created_at DESC, id DESC LIMIT 20`,
    );
  }

  // POST /sincronizacion/reemplazos/:id/revertir
  async revertirReemplazo(logId: number, usuario: string): Promise<Record<string, unknown>> {
    const log = (await this.dataSource.query(`SELECT * FROM item_reemplazo_log WHERE id = ?`, [logId]))[0];
    if (!log) throw this.fail('Reemplazo no encontrado.', 422);
    if (Number(log.revertido) === 1) throw this.fail('Este reemplazo ya fue deshecho.', 422);

    const fromId = Number(log.from_item_id);
    const toId = Number(log.to_item_id);
    let snapshot: Record<string, unknown>[] = [];
    try { snapshot = JSON.parse(log.snapshot ?? '[]') || []; } catch { snapshot = []; }
    const afectadas = [...new Set(snapshot.map((r) => Number(r.formulaciones_id)))];

    return this.dataSource.transaction(async (m) => {
      if (afectadas.length) {
        const ph = afectadas.map(() => '?').join(',');
        await m.query(
          `DELETE FROM item_general_formulaciones WHERE item_general_id IN (?, ?) AND formulaciones_id IN (${ph})`,
          [fromId, toId, ...afectadas],
        );
        for (const r of snapshot) {
          await m.query(
            `INSERT INTO item_general_formulaciones (formulaciones_id, item_general_id, cantidad, porcentaje) VALUES (?, ?, ?, ?)`,
            [Number(r.formulaciones_id), Number(r.item_general_id), r.cantidad, r.porcentaje],
          );
        }
      }
      if (Number(log.origen_eliminada) === 1) {
        await m.query(`UPDATE item_general SET deleted_at = NULL WHERE id_item_general = ?`, [fromId]);
      }
      await m.query(
        `UPDATE item_reemplazo_log SET revertido = 1, revertido_at = NOW(), usuario = ? WHERE id = ?`,
        [String(usuario).slice(0, 100), logId],
      );
      return {
        ok: true,
        msg: `Reemplazo deshecho: restauradas ${log.formulas_afectadas} fórmula(s)`
          + (Number(log.origen_eliminada) === 1 ? ` y se restauró «${log.from_nombre}».` : '.'),
      };
    });
  }

  // ── IA / Clasificación química (POST /sincronizacion/ia/clasificar) ──

  /** Réplica de SincronizacionModel::datasetParaClasificacion. */
  async datasetParaClasificacion(tipo: number | null = null): Promise<Record<string, unknown>[]> {
    let sql = `
      SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo,
             cat.nombre AS categoria, ua.nombre AS unidad,
             COALESCE(ci.costo_unitario, 0) AS costo,
             COALESCE(stock.stock_total, 0) AS stock_kg,
             COALESCE(usos.n, 0) AS usos_en_formulas
        FROM item_general ig
        LEFT JOIN categoria cat ON cat.id_categoria = ig.categoria_id
        LEFT JOIN unidad ua     ON ua.id_unidad     = ig.unidad_almacenaje_id
        LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        LEFT JOIN (SELECT item_general_id, SUM(cantidad_disponible) AS stock_total
                     FROM inventario_capas WHERE estado = 1 AND cantidad_disponible > 0
                     GROUP BY item_general_id) stock ON stock.item_general_id = ig.id_item_general
        LEFT JOIN (SELECT item_general_id, COUNT(*) AS n
                     FROM item_general_formulaciones GROUP BY item_general_id) usos
               ON usos.item_general_id = ig.id_item_general
       WHERE ig.tipo IN (1, 2) AND (ig.deleted_at IS NULL) AND ig.nombre NOT LIKE '[MERGED%'`;
    const params: unknown[] = [];
    if (tipo !== null) { sql += ` AND ig.tipo = ?`; params.push(tipo); }
    sql += ` ORDER BY ig.tipo, ig.nombre`;

    const items: Record<string, unknown>[] = await this.dataSource.query(sql, params);
    if (!items.length) return [];

    const ids = items.map((i) => Number(i.id_item_general));
    const ph = ids.map(() => '?').join(',');
    const refs: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ip.item_general_id, ip.nombre, ip.codigo, p.nombre_empresa AS proveedor
         FROM item_proveedor ip
         JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
        WHERE ip.item_general_id IN (${ph}) AND ip.deleted_at IS NULL`,
      ids,
    );
    const bucket = new Map<number, Record<string, unknown>[]>();
    for (const r of refs) {
      const k = Number(r.item_general_id);
      if (!bucket.has(k)) bucket.set(k, []);
      bucket.get(k)!.push({ nombre_tecnico: r.nombre, codigo: r.codigo, proveedor: r.proveedor });
    }
    for (const it of items) {
      it.id_item_general = Number(it.id_item_general);
      it.tipo = Number(it.tipo);
      it.costo = Number(it.costo);
      it.stock_kg = Number(it.stock_kg);
      it.usos_en_formulas = Number(it.usos_en_formulas);
      it.referencias_proveedor = bucket.get(Number(it.id_item_general)) ?? [];
    }
    return items;
  }

  /** Réplica de SincronizacionModel::guardarSugerencias (idempotente por lote). */
  async guardarSugerencias(
    clusters: Record<string, unknown>[],
    lote: string,
    modelo = '',
  ): Promise<Record<string, unknown>> {
    return this.dataSource.transaction(async (m) => {
      await m.query(
        `DELETE FROM item_sync_clusters WHERE estado IN ('propuesto','revisado','aprobado')`,
      );
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      let creados = 0;
      const confOk = (c: unknown) =>
        ['alta', 'media', 'baja'].includes(String(c ?? 'media')) ? String(c) : 'media';

      for (const c of clusters) {
        const items = (c.items as Record<string, unknown>[]) ?? [];
        if (items.length < 2) continue;
        const keepId = c.keep_id ?? items[0]?.item_general_id ?? null;
        const claveGrupo = c.clave_grupo ?? this.normalizar(String(c.identidad_quimica ?? ''));

        const res = await m.query(
          `INSERT INTO item_sync_clusters
             (clave_grupo, identidad_quimica, nombre_base_propuesto, confianza, razonamiento,
              tipo, estado, keep_id_sugerido, lote_ia, modelo_ia, created_at, updated_at)
           VALUES (?,?,?,?,?,?, 'propuesto', ?,?,?,?,?)`,
          [
            claveGrupo, c.identidad_quimica ?? null, c.nombre_base ?? null, confOk(c.confianza),
            c.razonamiento ?? null, Math.trunc(Number(c.tipo ?? 1)),
            keepId, lote, modelo, now, now,
          ],
        );
        const clusterId = Number(res.insertId);

        for (const mem of items) {
          const igid = Math.trunc(Number(mem.item_general_id ?? 0));
          if (igid <= 0) continue;
          const rol = igid === Number(keepId)
            ? 'keep'
            : (String(mem.confianza ?? 'media') === 'baja' ? 'excluido' : 'merge');
          await m.query(
            `INSERT INTO item_sync_cluster_items
               (cluster_id, item_general_id, rol, confianza_item, motivo_revision, created_at)
             VALUES (?,?,?,?,?,?)`,
            [clusterId, igid, rol, confOk(mem.confianza), mem.motivo ?? null, now],
          );
        }
        creados++;
      }
      return { clusters_creados: creados, lote };
    });
  }

  /** Réplica de SincronizacionController::iaClasificar (orquesta dataset → IA → guardar). */
  async iaClasificar(tipo: number | null): Promise<Record<string, unknown>> {
    const dataset = await this.datasetParaClasificacion(tipo);
    if (!dataset.length) {
      throw this.fail('No hay materias primas/insumos para clasificar.', 400);
    }
    // Instanciación lazy: si falta la API key, lanza (capturado como 400), sin romper el arranque.
    const service = new ClasificadorQuimicoService();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const lote = `IA-${stamp}`;
    const clusters = await service.clasificar(dataset);
    const res = await this.guardarSugerencias(clusters, lote, service.modelo());
    return { message: 'Clasificación completada.', detalle: res };
  }
}
