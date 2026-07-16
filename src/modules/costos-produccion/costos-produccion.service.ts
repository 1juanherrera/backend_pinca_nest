import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

import { ConfiguracionService } from '../configuracion/configuracion.service';

const N = (x: unknown) => Number(x ?? 0);
const fNull = (x: unknown) => (x !== null && x !== undefined ? Number(x) : null);
const round = (x: number, d: number) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};
const upperTrim = (s: unknown) => String(s ?? '').trim().toUpperCase();
/** limpiarNombreProveedor: uppercase(trim(quita paréntesis final)). */
const limpiarNombre = (nombre: unknown) =>
  String(nombre ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim().toUpperCase();
/** matchNombre: exacto→1, substring cualquier dirección→2, else 0. */
const matchNombre = (mpNombre: unknown, ipNombre: unknown): number => {
  const mp = upperTrim(mpNombre);
  const ip = limpiarNombre(ipNombre);
  if (mp === ip) return 1;
  if (ip.includes(mp) || mp.includes(ip)) return 2;
  return 0;
};

/**
 * CostosProduccionController. `historia` (snapshots) + `index`/`show` que calculan el costo
 * de cada producto usando el proveedor más barato por ingrediente (matching por link directo
 * o nombre exacto/substring — determinístico, sin Levenshtein).
 */
@Injectable()
export class CostosProduccionService {
  private readonly logger = new Logger(CostosProduccionService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cfg: ConfiguracionService,
  ) {}

  private async margenDefault(): Promise<number> {
    return N(await this.cfg.obtener('margen_utilidad_default_pct', 50));
  }

  /**
   * Genera/actualiza el snapshot de costos del día para todos los productos con
   * fórmula activa. Réplica del comando CI4 `php spark snapshot:costos`
   * (`App\Commands\SnapshotCostos`). Idempotente: UNIQUE(item_general_id, fecha)
   * → INSERT ... ON DUPLICATE KEY UPDATE. Alimenta el gráfico de evolución
   * (`GET /costos-produccion/:id/historia`).
   */
  async generarSnapshot(): Promise<{ fecha: string; total: number }> {
    const batch = (await this.getCostosProduccionBatch()) as {
      productos?: Record<string, unknown>[];
    };
    const productos = batch.productos ?? [];
    // CURDATE() en la BD (dateStrings:true → 'YYYY-MM-DD') para no depender de la TZ del proceso.
    const fecha: string = (
      await this.dataSource.query(`SELECT CURDATE() AS f`)
    )[0].f;

    for (const p of productos) {
      const mpsTotal = N(p.mps_total);
      const mpsCubiertas =
        mpsTotal - ((p.mps_faltantes as unknown[])?.length ?? 0);
      await this.dataSource.query(
        `INSERT INTO costos_snapshot
           (item_general_id, fecha, estado, volumen_base, costo_mp_total, costo_mp_por_unidad,
            costo_empaque_mod, costo_total, porcentaje_utilidad, precio_venta_calc, mps_total, mps_cubiertas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           estado=VALUES(estado), volumen_base=VALUES(volumen_base),
           costo_mp_total=VALUES(costo_mp_total), costo_mp_por_unidad=VALUES(costo_mp_por_unidad),
           costo_empaque_mod=VALUES(costo_empaque_mod), costo_total=VALUES(costo_total),
           porcentaje_utilidad=VALUES(porcentaje_utilidad), precio_venta_calc=VALUES(precio_venta_calc),
           mps_total=VALUES(mps_total), mps_cubiertas=VALUES(mps_cubiertas)`,
        [
          N(p.id_item_general), fecha, p.estado, N(p.volumen_base),
          fNull(p.costo_mp_total), fNull(p.costo_mp_por_unidad), N(p.costo_empaque_mod),
          fNull(p.costo_total), N(p.porcentaje_utilidad), fNull(p.precio_venta_calc),
          mpsTotal, mpsCubiertas,
        ],
      );
    }
    return { fecha, total: productos.length };
  }

  /**
   * Snapshot automático mensual (1º de cada mes, 06:00 hora de Colombia).
   * Reemplaza el cron externo que corría `php spark snapshot:costos` en CI4.
   */
  @Cron('0 6 1 * *', { name: 'snapshot-costos-mensual', timeZone: 'America/Bogota' })
  async snapshotMensual(): Promise<void> {
    try {
      const r = await this.generarSnapshot();
      this.logger.log(
        `Snapshot mensual de costos generado: ${r.total} producto(s) — fecha ${r.fecha}`,
      );
    } catch (e) {
      this.logger.error(`Snapshot mensual falló: ${(e as Error).message}`);
    }
  }

  // ── GET /costos-produccion ──
  async getCostosProduccionBatch(): Promise<unknown> {
    const margenDef = await this.margenDefault();
    const productos: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.precio_venta_manual, ig.precio_manual_activo,
              cat.nombre AS categoria_nombre, f.id_formulaciones,
              COALESCE(NULLIF(ci.volumen,0),1) AS volumen_base,
              COALESCE(ci.envase,0) AS envase, COALESCE(ci.etiqueta,0) AS etiqueta,
              COALESCE(ci.bandeja,0) AS bandeja, COALESCE(ci.plastico,0) AS plastico,
              COALESCE(ci.costo_mod,0) AS costo_mod,
              COALESCE(ci.porcentaje_utilidad, ${margenDef}) AS porcentaje_utilidad
         FROM item_general ig
         INNER JOIN formulaciones f ON f.item_general_id = ig.id_item_general AND f.estado = 1
         LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
         LEFT JOIN categoria cat  ON cat.id_categoria    = ig.categoria_id
        WHERE ig.tipo = 0 AND ig.deleted_at IS NULL ORDER BY ig.nombre ASC`,
    );
    if (!productos.length) return [];

    const formIds = productos.map((p) => N(p.id_formulaciones));
    const phF = formIds.map(() => '?').join(',');
    const ingredientes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.formulaciones_id, igf.item_general_id AS mp_id, igf.cantidad, igf.porcentaje,
              ig.nombre AS mp_nombre, ig.codigo AS mp_codigo, ig.deleted_at AS mp_deleted
         FROM item_general_formulaciones igf
         INNER JOIN item_general ig ON ig.id_item_general = igf.item_general_id
        WHERE igf.formulaciones_id IN (${phF}) ORDER BY igf.formulaciones_id, ig.nombre`,
      formIds,
    );

    const mpIds = [...new Set(ingredientes.map((i) => N(i.mp_id)))];
    const mpsPorId = new Map<number, { nombre: unknown; codigo: unknown }>();
    for (const i of ingredientes) mpsPorId.set(N(i.mp_id), { nombre: i.mp_nombre, codigo: i.mp_codigo });

    const stockPorMp = new Map<number, number>();
    if (mpIds.length) {
      const ph = mpIds.map(() => '?').join(',');
      const rows: Record<string, unknown>[] = await this.dataSource.query(
        `SELECT item_general_id, COALESCE(SUM(cantidad_disponible),0) AS stock_kg
           FROM inventario_capas WHERE estado = 1 AND item_general_id IN (${ph}) GROUP BY item_general_id`,
        mpIds,
      );
      for (const r of rows) stockPorMp.set(N(r.item_general_id), N(r.stock_kg));
    }

    const proveedoresPorMp = new Map<number, Record<string, unknown>[]>();
    if (mpIds.length) {
      const ph = mpIds.map(() => '?').join(',');
      const rows: Record<string, unknown>[] = await this.dataSource.query(
        `SELECT ip.item_general_id, ip.id_item_proveedor, ip.nombre AS ip_nombre, ip.precio_unitario,
                ip.factor_conversion, ip.proveedor_id, p.nombre_empresa
           FROM item_proveedor ip
           INNER JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
          WHERE ip.disponible = 1 AND ip.deleted_at IS NULL AND p.deleted_at IS NULL
            AND (ip.item_general_id IN (${ph}) OR ip.item_general_id IS NULL)`,
        mpIds,
      );
      for (const r of rows) {
        const factor = Math.max(Number(r.factor_conversion) || 1, 0.001);
        r.precio_por_kg = round(N(r.precio_unitario) / factor, 4);
        const ipItemId = r.item_general_id !== null && r.item_general_id !== undefined ? N(r.item_general_id) : null;
        if (ipItemId !== null && mpsPorId.has(ipItemId)) {
          r.match_tipo = 1;
          if (!proveedoresPorMp.has(ipItemId)) proveedoresPorMp.set(ipItemId, []);
          proveedoresPorMp.get(ipItemId)!.push(r);
          continue;
        }
        for (const [mpId, mp] of mpsPorId) {
          const score = matchNombre(mp.nombre, r.ip_nombre);
          if (score > 0) {
            const rr = { ...r, match_tipo: score + 1 };
            if (!proveedoresPorMp.has(mpId)) proveedoresPorMp.set(mpId, []);
            proveedoresPorMp.get(mpId)!.push(rr);
          }
        }
      }
      for (const opts of proveedoresPorMp.values()) {
        opts.sort((a, b) => (N(a.match_tipo) - N(b.match_tipo)) || (N(a.precio_por_kg) - N(b.precio_por_kg)));
      }
    }

    const ingredientesPorForm = new Map<number, Record<string, unknown>[]>();
    for (const i of ingredientes) {
      const fid = N(i.formulaciones_id);
      if (!ingredientesPorForm.has(fid)) ingredientesPorForm.set(fid, []);
      ingredientesPorForm.get(fid)!.push(i);
    }

    const resultado: Record<string, unknown>[] = [];
    for (const p of productos) {
      const formId = N(p.id_formulaciones);
      const mps = ingredientesPorForm.get(formId) ?? [];
      const faltantes: Record<string, unknown>[] = [];
      const proveedoresUsados = new Map<number, Record<string, unknown>>();
      let costoMpTotal = 0;
      let tandasMin = Infinity;
      let cuello: Record<string, unknown> | null = null;

      for (const mp of mps) {
        const mpId = N(mp.mp_id);
        const cantidad = N(mp.cantidad);
        if (cantidad > 0) {
          const stockMp = stockPorMp.get(mpId) ?? 0;
          const tandasMp = stockMp / cantidad;
          if (tandasMp < tandasMin) {
            tandasMin = tandasMp;
            cuello = {
              mp_id: mpId, nombre: mp.mp_nombre, codigo: mp.mp_codigo,
              stock_kg: round(stockMp, 4), requerido_por_tanda_kg: round(cantidad, 4), tandas: round(tandasMp, 3),
            };
          }
        }
        const esAgua = upperTrim(mp.mp_nombre) === 'AGUA';
        const opciones = proveedoresPorMp.get(mpId) ?? [];
        if (mp.mp_deleted || (!opciones.length && !esAgua)) {
          faltantes.push({ id: mpId, nombre: mp.mp_nombre, codigo: mp.mp_codigo, motivo: mp.mp_deleted ? 'archivado' : 'sin_proveedor' });
          continue;
        }
        if (esAgua && !opciones.length) {
          const cu = N((await this.dataSource.query(`SELECT COALESCE(costo_unitario,0) AS cu FROM costos_item WHERE item_general_id = ?`, [mpId]))[0]?.cu);
          costoMpTotal += cantidad * cu;
          continue;
        }
        const opcion = opciones[0];
        costoMpTotal += cantidad * N(opcion.precio_por_kg);
        const pid = N(opcion.proveedor_id);
        if (!proveedoresUsados.has(pid)) {
          proveedoresUsados.set(pid, { id_proveedor: pid, nombre_empresa: opcion.nombre_empresa, items: 0 });
        }
        (proveedoresUsados.get(pid)!.items as number)++;
      }

      const estado = faltantes.length ? 'incompleto' : 'completo';
      const vol = N(p.volumen_base);
      const empaqueMod = N(p.envase) + N(p.etiqueta) + N(p.bandeja) + N(p.plastico) + N(p.costo_mod);
      const costoMpPorUnidad = vol > 0 ? costoMpTotal / vol : costoMpTotal;
      const costoTotal = estado === 'completo' ? costoMpPorUnidad + empaqueMod : null;
      const margen = N(p.porcentaje_utilidad);
      const precioVentaCalc =
        costoTotal !== null && margen > 0 ? round(costoTotal * (1 + margen / 100), 2)
          : costoTotal !== null ? round(costoTotal, 2) : null;
      const tandasPosibles = tandasMin === Infinity ? 0 : Math.floor(tandasMin);
      const galonesPosibles = tandasPosibles * vol;

      resultado.push({
        id_item_general: N(p.id_item_general), nombre: p.nombre, codigo: p.codigo,
        categoria_nombre: p.categoria_nombre, volumen_base: vol, estado,
        mps_total: mps.length, mps_faltantes: faltantes,
        tandas_posibles: tandasPosibles, galones_posibles: galonesPosibles, cuello_botella: cuello,
        costo_mp_total: estado === 'completo' ? round(costoMpTotal, 2) : null,
        costo_mp_por_unidad: estado === 'completo' ? round(costoMpPorUnidad, 2) : null,
        costo_empaque_mod: round(empaqueMod, 2),
        empaque_mod_detalle: {
          envase: round(N(p.envase), 2), etiqueta: round(N(p.etiqueta), 2), bandeja: round(N(p.bandeja), 2),
          plastico: round(N(p.plastico), 2), costo_mod: round(N(p.costo_mod), 2),
        },
        costo_total: costoTotal !== null ? round(costoTotal, 2) : null,
        porcentaje_utilidad: margen, precio_venta_calc: precioVentaCalc,
        precio_venta_manual: fNull(p.precio_venta_manual),
        precio_manual_activo: N(p.precio_manual_activo),
        proveedores_usados: [...proveedoresUsados.values()],
      });
    }

    const totalMps = mpIds.length;
    let cubiertasMps = 0;
    for (const mid of mpIds) {
      const esAgua = upperTrim(mpsPorId.get(mid)?.nombre) === 'AGUA';
      if ((proveedoresPorMp.get(mid)?.length ?? 0) > 0 || esAgua) cubiertasMps++;
    }
    return {
      productos: resultado,
      cobertura: {
        mps_totales: totalMps, mps_cubiertas: cubiertasMps, mps_sin_proveedor: totalMps - cubiertasMps,
        pct: totalMps > 0 ? round((cubiertasMps / totalMps) * 100, 1) : 0,
      },
    };
  }

  // ── GET /costos-produccion/:id ──
  async getCostoProduccionDetalle(itemId: number): Promise<Record<string, unknown> | null> {
    const batch = (await this.getCostosProduccionBatch()) as { productos?: Record<string, unknown>[] };
    const producto = (batch.productos ?? []).find((p) => N(p.id_item_general) === itemId) ?? null;
    if (!producto) return null;

    const formulacion = (await this.dataSource.query(
      `SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`,
      [itemId],
    ))[0];
    if (!formulacion) return producto;

    const ingredientes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.item_general_id AS mp_id, igf.cantidad, igf.porcentaje, ig.nombre AS mp_nombre,
              ig.codigo AS mp_codigo, ig.deleted_at AS mp_deleted
         FROM item_general_formulaciones igf
         INNER JOIN item_general ig ON ig.id_item_general = igf.item_general_id
        WHERE igf.formulaciones_id = ? ORDER BY ig.nombre ASC`,
      [formulacion.id_formulaciones],
    );

    const mpIds = [...new Set(ingredientes.map((i) => N(i.mp_id)))];
    const mpsPorId = new Map<number, { nombre: unknown }>();
    for (const i of ingredientes) mpsPorId.set(N(i.mp_id), { nombre: i.mp_nombre });

    const proveedoresPorMp = new Map<number, Record<string, unknown>[]>();
    if (mpIds.length) {
      const ph = mpIds.map(() => '?').join(',');
      const rows: Record<string, unknown>[] = await this.dataSource.query(
        `SELECT ip.item_general_id, ip.id_item_proveedor, ip.precio_unitario, ip.factor_conversion,
                ip.proveedor_id, ip.nombre AS item_proveedor_nombre, p.nombre_empresa, uc.nombre AS unidad_compra
           FROM item_proveedor ip
           INNER JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
           LEFT JOIN unidad uc ON uc.id_unidad = ip.unidad_compra_id
          WHERE ip.disponible = 1 AND ip.deleted_at IS NULL AND p.deleted_at IS NULL
            AND (ip.item_general_id IN (${ph}) OR ip.item_general_id IS NULL)`,
        mpIds,
      );
      for (const r of rows) {
        const factor = Math.max(Number(r.factor_conversion) || 1, 0.001);
        r.precio_por_kg = round(N(r.precio_unitario) / factor, 4);
        const ipItemId = r.item_general_id !== null && r.item_general_id !== undefined ? N(r.item_general_id) : null;
        if (ipItemId !== null && mpsPorId.has(ipItemId)) {
          r.match_tipo = 1;
          if (!proveedoresPorMp.has(ipItemId)) proveedoresPorMp.set(ipItemId, []);
          proveedoresPorMp.get(ipItemId)!.push(r);
          continue;
        }
        for (const [mpId, mp] of mpsPorId) {
          const score = matchNombre(mp.nombre, r.item_proveedor_nombre);
          if (score > 0) {
            const rr = { ...r, match_tipo: score + 1 };
            if (!proveedoresPorMp.has(mpId)) proveedoresPorMp.set(mpId, []);
            proveedoresPorMp.get(mpId)!.push(rr);
          }
        }
      }
      for (const opts of proveedoresPorMp.values()) {
        opts.sort((a, b) => (N(a.match_tipo) - N(b.match_tipo)) || (N(a.precio_por_kg) - N(b.precio_por_kg)));
      }
    }

    const detalle: Record<string, unknown>[] = [];
    for (const mp of ingredientes) {
      const mpId = N(mp.mp_id);
      const cantidad = N(mp.cantidad);
      const opciones = proveedoresPorMp.get(mpId) ?? [];
      const mejor = opciones[0] ?? null;
      const esAgua = upperTrim(mp.mp_nombre) === 'AGUA';

      if (esAgua && !opciones.length) {
        const cu = N((await this.dataSource.query(`SELECT COALESCE(costo_unitario,0) AS cu FROM costos_item WHERE item_general_id = ?`, [mpId]))[0]?.cu);
        detalle.push({
          mp_id: mpId, nombre: mp.mp_nombre, codigo: mp.mp_codigo, archivado: false,
          cantidad_kg: cantidad, porcentaje: N(mp.porcentaje), proveedor_id: null,
          proveedor_nombre: 'Costo interno', item_proveedor_id: null, item_proveedor_nombre: null,
          unidad_compra: null, factor_conversion: null, precio_unitario: cu, precio_por_kg: cu,
          subtotal: round(cantidad * cu, 2), total_opciones: 0, costo_interno: true,
        });
        continue;
      }
      detalle.push({
        mp_id: mpId, nombre: mp.mp_nombre, codigo: mp.mp_codigo, archivado: !!mp.mp_deleted,
        cantidad_kg: cantidad, porcentaje: N(mp.porcentaje),
        proveedor_id: mejor?.proveedor_id ?? null, proveedor_nombre: mejor?.nombre_empresa ?? null,
        item_proveedor_id: mejor?.id_item_proveedor ?? null, item_proveedor_nombre: mejor?.item_proveedor_nombre ?? null,
        unidad_compra: mejor?.unidad_compra ?? null,
        factor_conversion: mejor?.factor_conversion != null ? N(mejor.factor_conversion) : null,
        precio_unitario: mejor?.precio_unitario != null ? N(mejor.precio_unitario) : null,
        precio_por_kg: mejor?.precio_por_kg ?? null,
        subtotal: mejor ? round(cantidad * N(mejor.precio_por_kg), 2) : null,
        total_opciones: opciones.length,
      });
    }
    producto.detalle_ingredientes = detalle;
    return producto;
  }

  async historia(id: number): Promise<Record<string, unknown>> {
    if (!id || Number.isNaN(Number(id))) throw new HttpException({ msg: 'ID inválido.' }, 422);
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT fecha, estado, costo_mp_por_unidad, costo_empaque_mod, costo_total,
              precio_venta_calc, mps_total, mps_cubiertas
         FROM costos_snapshot WHERE item_general_id = ? ORDER BY fecha ASC LIMIT 36`,
      [id],
    );
    return {
      item_general_id: N(id),
      snapshots: rows.map((r) => ({
        fecha: r.fecha, estado: r.estado,
        costo_mp_por_unidad: fNull(r.costo_mp_por_unidad), costo_empaque_mod: N(r.costo_empaque_mod),
        costo_total: fNull(r.costo_total), precio_venta_calc: fNull(r.precio_venta_calc),
        mps_total: N(r.mps_total), mps_cubiertas: N(r.mps_cubiertas),
      })),
    };
  }
}
