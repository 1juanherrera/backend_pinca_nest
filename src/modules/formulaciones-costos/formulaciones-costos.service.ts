import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ConfiguracionService } from '../configuracion/configuracion.service';

const N = (x: unknown) => Number(x ?? 0);
const round = (x: number, d: number) => { const f = 10 ** d; return Math.round(x * f) / f; };
const upperTrim = (s: unknown) => String(s ?? '').trim().toUpperCase();
const limpiarNombre = (n: unknown) => String(n ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim().toUpperCase();
const matchNombre = (mp: unknown, ip: unknown): number => {
  const a = upperTrim(mp); const b = limpiarNombre(ip);
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 2;
  return 0;
};
// ── Formatter (réplica de App\Libraries\Formatter) ──
const isNumericLike = (v: unknown) => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v));
/** toCOP: number_format(v,0,',','.') → entero con '.' de miles; '0' si no numérico. */
const toCOP = (v: unknown): string => {
  if (!isNumericLike(v)) return '0';
  const num = Number(v);
  const sign = num < 0 ? '-' : '';
  const intStr = Math.round(Math.abs(num)).toString();
  return sign + intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
/** toThousands: number_format(n,2,'.',',') → 2 dec '.', ',' de miles. */
const toThousands = (n: unknown): string => {
  const num = Number(n) || 0;
  const sign = num < 0 ? '-' : '';
  const [int, dec] = Math.abs(num).toFixed(2).split('.');
  return sign + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
};
/** fromCOP: parse inverso. */
const fromCOP = (v: unknown): number => {
  if (typeof v === 'number') return v;
  const s = String(v ?? '');
  if (isNumericLike(s) && !s.includes('.') && !s.includes(',')) return Number(s);
  const limpio = s.trim().replace(/\$|COP|cop| |\.| /g, '').replace(/,/g, '.');
  return Number(limpio) || 0;
};

/** Réplica fiel de las simulaciones de costo de FormulacionesModel (CI4). */
@Injectable()
export class FormulacionesCostosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cfg: ConfiguracionService,
  ) {}

  private fail(msg: string, status = 400): HttpException {
    return new HttpException({ msg }, status);
  }
  private async margenDefault(): Promise<number> {
    return N(await this.cfg.obtener('margen_utilidad_default_pct', 50));
  }

  // ── calculate_costs (GET formulaciones/costos/:id) ──
  async calculateCosts(itemId: number, newVolume: number | null = null): Promise<Record<string, unknown>> {
    if (!itemId) throw this.fail('Parámetro inválido: itemId requerido.');
    const margenDef = await this.margenDefault();
    const item = (await this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo, ig.precio_venta_manual, ig.precio_manual_activo,
              ig.viscosidad, ig.p_g, ig.color, ig.secado, ig.cubrimiento, ig.brillo_60, i.cantidad,
              ci.id_costos_item, COALESCE(ci.costo_unitario,0) AS costo_unitario, COALESCE(ci.costo_mp_galon,0) AS costo_mp_galon,
              COALESCE(ci.costo_mp_kg,0) AS costo_mp_kg, COALESCE(ci.envase,0) AS envase, COALESCE(ci.etiqueta,0) AS etiqueta,
              COALESCE(ci.bandeja,0) AS bandeja, COALESCE(ci.plastico,0) AS plastico,
              COALESCE(NULLIF(ci.volumen,0),1) AS volumen_base, COALESCE(ci.precio_venta,0) AS precio_venta_actual,
              COALESCE(ci.costo_mod,0) AS costo_mod, COALESCE(ci.porcentaje_utilidad, ${margenDef}) AS porcentaje_utilidad
         FROM item_general ig
         LEFT JOIN inventario i ON i.item_general_id = ig.id_item_general
         LEFT JOIN costos_item ci ON ig.id_item_general = ci.item_general_id
        WHERE ig.id_item_general = ?`,
      [itemId],
    ))[0];
    if (!item) throw this.fail(`Item con ID ${itemId} no encontrado.`);

    const formRow = (await this.dataSource.query(
      `SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`,
      [N(item.id_item_general)],
    ))[0];
    if (!formRow) throw this.fail(`El item '${item.nombre}' no tiene una formulación activa vinculada.`);

    const formulaciones: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.id_item_general_formulaciones, igf.item_general_id, igf.formulaciones_id, igf.cantidad,
              igf.orden, igf.tipo, igf.texto, igf.nota, i.cantidad AS inventario_cantidad, ci.fecha_calculo,
              ig.nombre AS materia_prima_nombre, ig.codigo AS materia_prima_codigo,
              COALESCE(NULLIF(ci.costo_unitario,0),
                (SELECT MIN(ip2.precio_unitario / GREATEST(ip2.factor_conversion,1)) FROM item_proveedor ip2
                  WHERE ip2.item_general_id = ig.id_item_general AND ip2.deleted_at IS NULL), 0) AS materia_prima_costo_unitario,
              igf.cantidad * COALESCE(NULLIF(ci.costo_unitario,0),
                (SELECT MIN(ip2.precio_unitario / GREATEST(ip2.factor_conversion,1)) FROM item_proveedor ip2
                  WHERE ip2.item_general_id = ig.id_item_general AND ip2.deleted_at IS NULL), 0) AS costo_total_materia
         FROM item_general_formulaciones igf
         LEFT JOIN item_general ig ON igf.item_general_id = ig.id_item_general
         LEFT JOIN costos_item ci ON ig.id_item_general = ci.item_general_id
         LEFT JOIN inventario i ON ig.id_item_general = i.item_general_id
        WHERE igf.formulaciones_id = ? ORDER BY igf.orden ASC, igf.id_item_general_formulaciones ASC`,
      [formRow.id_formulaciones],
    );
    if (!formulaciones.length) throw this.fail(`La formulación del item ${item.nombre} no tiene materias primas asignadas.`);

    const volumenBase = N(item.volumen_base);
    let factorVolumen = 1;
    let usarNuevoVolumen = false;
    if (newVolume && !Number.isNaN(Number(newVolume)) && newVolume > 0 && volumenBase > 0) {
      factorVolumen = newVolume / volumenBase;
      usarNuevoVolumen = true;
    }

    let totalMateriaPrima = 0;
    let totalCantidad = 0;
    for (const row of formulaciones) {
      if ((row.tipo ?? 'ingrediente') !== 'ingrediente') continue;
      const cantidadRecalc = usarNuevoVolumen ? round(N(row.cantidad) * factorVolumen, 2) : N(row.cantidad);
      const costoTotalMateria = usarNuevoVolumen ? round(N(row.costo_total_materia) * factorVolumen, 2) : N(row.costo_total_materia);
      totalMateriaPrima += costoTotalMateria;
      totalCantidad += cantidadRecalc;
    }

    const nuevoCostoMateriaPrima = totalMateriaPrima;
    let divisorVolumen = newVolume ?? volumenBase;
    if (divisorVolumen === 0) divisorVolumen = 1;
    const nuevoCostoTotal = nuevoCostoMateriaPrima / divisorVolumen + N(item.envase) + N(item.etiqueta) + N(item.bandeja) + N(item.plastico) + N(item.costo_mod);
    const margen = N(item.porcentaje_utilidad);
    const precioVenta = margen > 0 ? nuevoCostoTotal * (1 + margen / 100) : nuevoCostoTotal;
    const costoMgKg = newVolume && newVolume > 0 ? nuevoCostoMateriaPrima / newVolume : totalMateriaPrima / (volumenBase > 0 ? volumenBase : 1);

    const formateadas = formulaciones.map((r) => ({
      ...r,
      cantidad: N(r.cantidad),
      materia_prima_costo_unitario: toCOP(N(r.materia_prima_costo_unitario)),
      costo_total_materia: toCOP(N(r.costo_total_materia)),
      inventario_valor_total: toCOP(N(r.inventario_cantidad) * N(r.materia_prima_costo_unitario)),
    }));

    return {
      item: {
        id: item.id_item_general, nombre: item.nombre, codigo: item.codigo, tipo: item.tipo,
        viscosidad: item.viscosidad, p_g: item.p_g, color: item.color, secado: item.secado,
        cubrimiento: item.cubrimiento, brillo_60: item.brillo_60, cantidad: N(item.cantidad),
        volumen_base: volumenBase, volumen_nuevo: newVolume ?? volumenBase, factor_volumen: factorVolumen,
        precio_venta_manual: item.precio_venta_manual, precio_manual_activo: N(item.precio_manual_activo),
      },
      costos: {
        id_costos_item: item.id_costos_item,
        total_costo_materia_prima: toCOP(nuevoCostoMateriaPrima),
        costo_mp_galon: toCOP(nuevoCostoMateriaPrima / divisorVolumen),
        envase: toCOP(item.envase), etiqueta: toCOP(item.etiqueta), bandeja: toCOP(item.bandeja),
        plastico: toCOP(item.plastico), costo_mod: toCOP(item.costo_mod), costo_mp_kg: toCOP(costoMgKg),
        porcentaje_utilidad: margen, total_cantidad_materia_prima: toThousands(totalCantidad),
        total: toCOP(nuevoCostoTotal), precio_venta: toCOP(precioVenta),
        fecha_calculo: formulaciones[0].fecha_calculo ?? null,
      },
      formulaciones: formateadas,
    };
  }

  // ── recalculate_costs_with_new_volume (GET formulaciones/recalcular_costos/:id/:vol) ──
  async recalculateCostsWithNewVolume(itemId: number, newVolume: number): Promise<Record<string, unknown>> {
    if (!itemId || !newVolume || Number.isNaN(Number(newVolume)) || newVolume <= 0) {
      throw this.fail('Parámetros inválidos: itemId o newVolume incorrectos.');
    }
    const currentData = await this.calculateCosts(itemId);
    const newData = await this.calculateCosts(itemId, newVolume);
    const item = { ...(currentData.item as Record<string, unknown>) };
    item.volumen_nuevo = newVolume;
    item.factor_volumen = round(newVolume / N(item.volumen_base), 3);

    const combinadas = (currentData.formulaciones as Record<string, unknown>[]).map((f) => {
      const cantidadRecalc = (newVolume / N(item.volumen_base)) * N(f.cantidad);
      return {
        id_item_general_formulaciones: f.id_item_general_formulaciones, item_general_id: f.item_general_id,
        formulaciones_id: f.formulaciones_id, orden: f.orden ?? 0, tipo: f.tipo ?? 'ingrediente',
        texto: f.texto ?? null, nota: f.nota ?? null, cantidad: f.cantidad,
        cantidad_recalculada: round(cantidadRecalc, 2), inventario_cantidad: f.inventario_cantidad,
        fecha_calculo: f.fecha_calculo, materia_prima_nombre: f.materia_prima_nombre,
        materia_prima_codigo: f.materia_prima_codigo, materia_prima_costo_unitario: f.materia_prima_costo_unitario,
        costo_total_materia: f.costo_total_materia, inventario_valor_total: f.inventario_valor_total,
        costo_total_materia_recalculado: toCOP(fromCOP(f.materia_prima_costo_unitario) * cantidadRecalc),
      };
    });
    return { item, costos: currentData.costos, recalculados: newData.costos, formulaciones: combinadas };
  }

  // ── get_opciones_proveedor_formulacion (GET formulaciones/:id/opciones-ingredientes) ──
  async getOpcionesProveedorFormulacion(itemId: number): Promise<Record<string, unknown>> {
    const margenDef = await this.margenDefault();
    const formulacion = (await this.dataSource.query(
      `SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`, [itemId],
    ))[0];
    if (!formulacion) throw this.fail('El item no tiene una formulación activa.');

    const item = (await this.dataSource.query(
      `SELECT COALESCE(NULLIF(ci.volumen,0),1) AS volumen_base, COALESCE(ci.envase,0) AS envase,
              COALESCE(ci.etiqueta,0) AS etiqueta, COALESCE(ci.bandeja,0) AS bandeja, COALESCE(ci.plastico,0) AS plastico,
              COALESCE(ci.costo_mod,0) AS costo_mod, COALESCE(ci.porcentaje_utilidad, ${margenDef}) AS porcentaje_utilidad
         FROM item_general ig LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        WHERE ig.id_item_general = ?`, [itemId],
    ))[0];

    const materias: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.item_general_id, ig.nombre,
              COALESCE(NULLIF(ci.costo_unitario,0),
                (SELECT MIN(ip2.precio_unitario / GREATEST(ip2.factor_conversion,1)) FROM item_proveedor ip2
                  WHERE ip2.item_general_id = ig.id_item_general AND ip2.deleted_at IS NULL), 0) AS costo_estandar
         FROM item_general_formulaciones igf
         INNER JOIN item_general ig ON ig.id_item_general = igf.item_general_id
         LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        WHERE igf.formulaciones_id = ?`, [formulacion.id_formulaciones],
    );
    if (!materias.length) return { item: [], materias: [] };

    const mpIds = [...new Set(materias.map((m) => N(m.item_general_id)))];
    const ph = mpIds.map(() => '?').join(',');
    const catalogo: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ip.id_item_proveedor, ip.item_general_id, ip.nombre, ip.precio_unitario, ip.factor_conversion,
              ip.proveedor_id, p.nombre_empresa, uc.nombre AS unidad_compra
         FROM item_proveedor ip
         INNER JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
         LEFT JOIN unidad uc ON uc.id_unidad = ip.unidad_compra_id
        WHERE ip.disponible = 1 AND ip.deleted_at IS NULL AND (ip.item_general_id IN (${ph}) OR ip.item_general_id IS NULL)`,
      mpIds,
    );

    const ultimoPrecio = new Map<number, number>();
    const capas: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ic.item_general_id, ic.id_capa, ic.costo_unitario FROM inventario_capas ic
         INNER JOIN (SELECT item_general_id, MAX(fecha_ingreso) AS maxf FROM inventario_capas
                      WHERE estado = 1 AND item_general_id IN (${ph}) GROUP BY item_general_id) m
           ON m.item_general_id = ic.item_general_id AND m.maxf = ic.fecha_ingreso
        WHERE ic.estado = 1 ORDER BY ic.id_capa DESC`, mpIds,
    );
    for (const c of capas) { const cid = N(c.item_general_id); if (!ultimoPrecio.has(cid)) ultimoPrecio.set(cid, N(c.costo_unitario)); }

    const resultado: Record<string, unknown> = {};
    for (const mp of materias) {
      const mpId = N(mp.item_general_id);
      const opciones: Record<string, unknown>[] = [];
      for (const ip of catalogo) {
        let priority = 999;
        if (ip.item_general_id && N(ip.item_general_id) === mpId) priority = 1;
        else { const nm = matchNombre(mp.nombre, ip.nombre); if (nm === 1) priority = 2; else if (nm === 2) priority = 3; }
        if (priority < 999) {
          const factor = Math.max(Number(ip.factor_conversion) || 1, 0.001);
          opciones.push({
            id_item_proveedor: N(ip.id_item_proveedor), nombre_item: ip.nombre, nombre_empresa: ip.nombre_empresa,
            precio_unitario: N(ip.precio_unitario), factor_conversion: N(ip.factor_conversion),
            precio_por_kg: round(N(ip.precio_unitario) / factor, 2), unidad_compra: ip.unidad_compra, match_tipo: priority,
          });
        }
      }
      opciones.sort((a, b) => N(a.precio_por_kg) - N(b.precio_por_kg));
      resultado[mpId] = {
        materia_prima_nombre: mp.nombre, costo_estandar: N(mp.costo_estandar),
        ultimo_precio: ultimoPrecio.has(mpId) ? ultimoPrecio.get(mpId) : null, opciones,
      };
    }
    return {
      item: {
        volumen_base: N(item.volumen_base), envase: N(item.envase), etiqueta: N(item.etiqueta),
        bandeja: N(item.bandeja), plastico: N(item.plastico), costo_mod: N(item.costo_mod),
        porcentaje_utilidad: N(item.porcentaje_utilidad),
      },
      materias: resultado,
    };
  }

  // ── get_proveedores_formulacion (GET formulaciones/:id/proveedores) ──
  async getProveedoresFormulacion(itemId: number): Promise<Record<string, unknown>[]> {
    const formulacion = (await this.dataSource.query(
      `SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`, [itemId],
    ))[0];
    if (!formulacion) throw this.fail('El item no tiene una formulación activa.');

    const materias: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.item_general_id, ig.nombre FROM item_general_formulaciones igf
         INNER JOIN item_general ig ON ig.id_item_general = igf.item_general_id WHERE igf.formulaciones_id = ?`,
      [formulacion.id_formulaciones],
    );
    if (!materias.length) return [];
    const totalMaterias = materias.length;
    const mpIds = [...new Set(materias.map((m) => N(m.item_general_id)))];
    const ph = mpIds.map(() => '?').join(',');
    const catalogo: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ip.id_item_proveedor, ip.item_general_id, ip.nombre, ip.proveedor_id, p.nombre_empresa, p.nombre_encargado
         FROM item_proveedor ip INNER JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
        WHERE ip.disponible = 1 AND ip.deleted_at IS NULL AND (ip.item_general_id IN (${ph}) OR ip.item_general_id IS NULL)`,
      mpIds,
    );

    const provCobertura = new Map<number, { id_proveedor: number; nombre_empresa: unknown; nombre_encargado: unknown; set: Set<number> }>();
    for (const mp of materias) {
      for (const ip of catalogo) {
        let matched = false;
        if (ip.item_general_id && N(ip.item_general_id) === N(mp.item_general_id)) matched = true;
        else if (matchNombre(mp.nombre, ip.nombre) > 0) matched = true;
        if (matched) {
          const pid = N(ip.proveedor_id);
          if (!provCobertura.has(pid)) provCobertura.set(pid, { id_proveedor: pid, nombre_empresa: ip.nombre_empresa, nombre_encargado: ip.nombre_encargado, set: new Set() });
          provCobertura.get(pid)!.set.add(N(mp.item_general_id));
        }
      }
    }
    const result = [...provCobertura.values()].map((prov) => {
      const cubiertas = prov.set.size;
      return {
        id_proveedor: prov.id_proveedor, nombre_empresa: prov.nombre_empresa, nombre_encargado: prov.nombre_encargado,
        materias_cubiertas: cubiertas, total_materias: totalMaterias,
        cobertura_pct: totalMaterias > 0 ? Math.round((cubiertas / totalMaterias) * 100) : 0,
      };
    });
    result.sort((a, b) => b.materias_cubiertas - a.materias_cubiertas);
    return result;
  }

  // ── calculate_costs_by_proveedor (GET formulaciones/costos/:id/proveedor/:pid) ──
  async calculateCostsByProveedor(itemId: number, proveedorId: number): Promise<Record<string, unknown>> {
    const margenDef = await this.margenDefault();
    const proveedor = (await this.dataSource.query(
      `SELECT id_proveedor, nombre_empresa, nombre_encargado FROM proveedor WHERE id_proveedor = ?`, [proveedorId],
    ))[0];
    if (!proveedor) throw this.fail(`Proveedor con ID ${proveedorId} no encontrado.`);
    const formRow = (await this.dataSource.query(
      `SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`, [itemId],
    ))[0];
    if (!formRow) throw this.fail('El item no tiene una formulación activa.');
    const item = (await this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre, ig.codigo, COALESCE(NULLIF(ci.volumen,0),1) AS volumen_base,
              COALESCE(ci.envase,0) AS envase, COALESCE(ci.etiqueta,0) AS etiqueta, COALESCE(ci.bandeja,0) AS bandeja,
              COALESCE(ci.plastico,0) AS plastico, COALESCE(ci.costo_mod,0) AS costo_mod,
              COALESCE(ci.porcentaje_utilidad, ${margenDef}) AS porcentaje_utilidad
         FROM item_general ig LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        WHERE ig.id_item_general = ?`, [itemId],
    ))[0];
    if (!item) throw this.fail(`Item con ID ${itemId} no encontrado.`);

    const formulaciones: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.id_item_general_formulaciones, igf.item_general_id, igf.formulaciones_id, igf.cantidad,
              ig.nombre AS materia_prima_nombre, ig.codigo AS materia_prima_codigo,
              COALESCE(NULLIF(ci.costo_unitario,0),
                (SELECT MIN(ip2.precio_unitario / GREATEST(ip2.factor_conversion,1)) FROM item_proveedor ip2
                  WHERE ip2.item_general_id = ig.id_item_general AND ip2.deleted_at IS NULL), 0) AS costo_unitario_estandar,
              i.cantidad AS inventario_cantidad, ci.fecha_calculo
         FROM item_general_formulaciones igf
         INNER JOIN item_general ig ON igf.item_general_id = ig.id_item_general
         LEFT JOIN costos_item ci ON ig.id_item_general = ci.item_general_id
         LEFT JOIN inventario i ON ig.id_item_general = i.item_general_id
        WHERE igf.formulaciones_id = ? ORDER BY ig.nombre ASC`, [formRow.id_formulaciones],
    );
    if (!formulaciones.length) throw this.fail('La formulación no tiene materias primas asignadas.');

    const itemsProveedor: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ip.*, uc.nombre AS unidad_compra_nombre FROM item_proveedor ip
         LEFT JOIN unidad uc ON uc.id_unidad = ip.unidad_compra_id
        WHERE ip.proveedor_id = ? AND ip.disponible = 1`, [proveedorId],
    );

    let totalMPProveedor = 0;
    let totalMPEstandar = 0;
    const formateadas = formulaciones.map((row) => {
      const cantidad = N(row.cantidad);
      const costoEstandar = N(row.costo_unitario_estandar);
      const mpNombre = row.materia_prima_nombre;
      const mpId = N(row.item_general_id);

      let bestMatch: Record<string, unknown> | null = null;
      let bestPriority = 999;
      for (const ip of itemsProveedor) {
        let priority = 999;
        if (ip.item_general_id && N(ip.item_general_id) === mpId) priority = 1;
        else { const nm = matchNombre(mpNombre, ip.nombre); if (nm === 1) priority = 2; else if (nm === 2) priority = 3; }
        if (priority < bestPriority) { bestMatch = ip; bestPriority = priority; }
        else if (priority === bestPriority && bestMatch && priority < 999) {
          const bf = Math.max(Number(bestMatch.factor_conversion) || 1, 0.001);
          const ipf = Math.max(Number(ip.factor_conversion) || 1, 0.001);
          if (N(ip.precio_unitario) / ipf < N(bestMatch.precio_unitario) / bf) bestMatch = ip;
        }
      }

      let costoProveedor: number | null = null;
      let precioProvRaw: number | null = null;
      let factorConv: number | null = null;
      let unidadCompraNombre: unknown = null;
      if (bestMatch) {
        const factor = Math.max(Number(bestMatch.factor_conversion) || 1, 0.001);
        costoProveedor = N(bestMatch.precio_unitario) / factor;
        precioProvRaw = N(bestMatch.precio_unitario);
        factorConv = N(bestMatch.factor_conversion);
        unidadCompraNombre = bestMatch.unidad_compra_nombre ?? null;
      }
      const costoEfectivo = costoProveedor ?? costoEstandar;
      const usaProveedor = costoProveedor !== null;
      const totalEstandar = cantidad * costoEstandar;
      const totalProveedor = cantidad * costoEfectivo;
      totalMPProveedor += totalProveedor;
      totalMPEstandar += totalEstandar;

      return {
        id_item_general_formulaciones: row.id_item_general_formulaciones, item_general_id: row.item_general_id,
        formulaciones_id: row.formulaciones_id, cantidad, materia_prima_nombre: row.materia_prima_nombre,
        materia_prima_codigo: row.materia_prima_codigo, inventario_cantidad: N(row.inventario_cantidad),
        fecha_calculo: row.fecha_calculo, costo_unitario_estandar: toCOP(costoEstandar),
        costo_unitario_proveedor: costoProveedor !== null ? toCOP(costoProveedor) : null,
        costo_unitario_efectivo: toCOP(costoEfectivo), usa_precio_proveedor: usaProveedor,
        costo_total_estandar: toCOP(totalEstandar), costo_total_proveedor: toCOP(totalProveedor),
        precio_proveedor_raw: precioProvRaw !== null ? toCOP(precioProvRaw) : null,
        factor_conversion: factorConv, unidad_compra_nombre: unidadCompraNombre,
      };
    });

    const volumen = N(item.volumen_base);
    const nuevoCostoTotal = totalMPProveedor / volumen + N(item.envase) + N(item.etiqueta) + N(item.bandeja) + N(item.plastico) + N(item.costo_mod);
    const margen = N(item.porcentaje_utilidad);
    const precioVenta = margen > 0 ? nuevoCostoTotal * (1 + margen / 100) : nuevoCostoTotal;
    const costoMPKg = volumen > 0 ? totalMPProveedor / volumen : 0;
    const diferenciaMPTotal = totalMPProveedor - totalMPEstandar;

    return {
      proveedor: { id_proveedor: N(proveedor.id_proveedor), nombre_empresa: proveedor.nombre_empresa, nombre_encargado: proveedor.nombre_encargado },
      costos_proveedor: {
        total_costo_materia_prima: toCOP(totalMPProveedor), costo_mp_kg: toCOP(costoMPKg),
        envase: toCOP(item.envase), etiqueta: toCOP(item.etiqueta), bandeja: toCOP(item.bandeja),
        plastico: toCOP(item.plastico), costo_mod: toCOP(item.costo_mod), porcentaje_utilidad: margen,
        total: toCOP(nuevoCostoTotal), precio_venta: toCOP(precioVenta),
      },
      diferencia: {
        total_mp: toCOP(Math.abs(diferenciaMPTotal)), es_mas_caro: diferenciaMPTotal > 0,
        porcentaje: totalMPEstandar > 0 ? round((diferenciaMPTotal / totalMPEstandar) * 100, 1) : 0,
      },
      formulaciones: formateadas,
    };
  }
}
