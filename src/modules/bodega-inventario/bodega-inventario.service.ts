import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ConfiguracionService } from '../configuracion/configuracion.service';

const N = (x: unknown) => Number(x ?? 0);
const iNull = (x: unknown) => (x !== null && x !== undefined ? Number(x) : null);

/** Réplica fiel de BodegasController::bodega_inventario + BodegasModel (CI4). Read paginado legacy. */
@Injectable()
export class BodegaInventarioService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cfg: ConfiguracionService,
  ) {}

  async bodegaInventario(
    id: number,
    pageRaw?: string,
    perPageRaw?: string,
    search = '',
    tipo = '',
  ): Promise<Record<string, unknown>> {
    const bodega = (await this.dataSource.query(
      `SELECT * FROM bodegas WHERE id_bodegas = ? AND deleted_at IS NULL`,
      [id],
    ))[0];
    if (!bodega) throw new HttpException({ msg: `Bodega con ID ${id} no encontrada.` }, 404);

    const perPage = Math.trunc(Number(perPageRaw) || 10);
    const page = Math.trunc(Number(pageRaw) || 1);
    const offset = (page - 1) * perPage;

    let where = ' WHERE inv.bodegas_id = ? ';
    const params: unknown[] = [id];
    if (search) { where += ' AND (ig.nombre LIKE ? OR ig.codigo LIKE ?) '; params.push(`%${search}%`, `%${search}%`); }
    if (tipo !== '' && tipo !== null) { where += ' AND ig.tipo = ? '; params.push(tipo); }

    const totalItems = N(
      (await this.dataSource.query(
        `SELECT COUNT(*) AS total FROM inventario inv
           JOIN item_general ig ON inv.item_general_id = ig.id_item_general ${where}`,
        params,
      ))[0].total,
    );

    // Nota: CI4 agrega el filtro `inv.cantidad IS NULL` SOLO al query principal (no al count)
    // cuando tipo==='pendientes' (que además ya filtró ig.tipo='pendientes' → 0 filas). Se replica.
    if (tipo === 'pendientes') where += ' AND inv.cantidad IS NULL ';

    const inventario: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT inv.id_inventario, ig.id_item_general, ig.nombre, ig.codigo,
              inv.cantidad, ig.tipo, ca.nombre AS categoria,
              u.nombre AS unidad, u.escala AS escala_venta, u.id_unidad AS unidad_id,
              ca.id_categoria AS categoria_id, c.costo_mp_galon, c.precio_venta, c.costo_unitario,
              f.id_formulaciones AS formulacion_id,
              ig.precio_venta_manual, ig.precio_manual_activo, ig.unidad_almacenaje_id,
              ua.nombre AS unidad_almacenaje, ua.escala AS escala_almacenaje
         FROM inventario inv
         JOIN item_general ig ON inv.item_general_id = ig.id_item_general
         LEFT JOIN costos_item c ON c.item_general_id = ig.id_item_general
         LEFT JOIN categoria ca  ON ig.categoria_id   = ca.id_categoria
         LEFT JOIN unidad u      ON ig.unidad_id       = u.id_unidad
         LEFT JOIN unidad ua     ON ig.unidad_almacenaje_id = ua.id_unidad
         LEFT JOIN formulaciones f ON f.id_formulaciones = (
              SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ig.id_item_general AND estado = 1 LIMIT 1)
        ${where} LIMIT ${perPage} OFFSET ${offset}`,
      params,
    );

    const margenDef = N(await this.cfg.obtener('margen_utilidad_default_pct', 50));

    // Normalizar formulacion_id y separar los ítems con fórmula activa.
    for (const item of inventario) item.formulacion_id = iNull(item.formulacion_id);
    const conFormula = inventario.filter((it) => it.formulacion_id !== null);

    // Antes: 2 queries POR ítem con fórmula (N+1: una página de 200 ítems ≈ 400
    // queries). Ahora: 2 queries TOTALES con IN(...) + mapas en memoria.
    if (conFormula.length > 0) {
      const itemIds = [...new Set(conFormula.map((it) => Number(it.id_item_general)))];
      const formIds = [...new Set(conFormula.map((it) => Number(it.formulacion_id)))];
      const itemPh = itemIds.map(() => '?').join(',');
      const formPh = formIds.map(() => '?').join(',');

      const itemDatas: Record<string, unknown>[] = await this.dataSource.query(
        `SELECT ig.id_item_general, ig.viscosidad, ig.p_g, ig.color, ig.secado, ig.cubrimiento, ig.brillo_60,
                COALESCE(NULLIF(ci.volumen,0),1) AS volumen_base, COALESCE(ci.envase,0) AS envase,
                COALESCE(ci.etiqueta,0) AS etiqueta, COALESCE(ci.bandeja,0) AS bandeja,
                COALESCE(ci.plastico,0) AS plastico, COALESCE(ci.costo_mod,0) AS costo_mod,
                COALESCE(ci.porcentaje_utilidad, ?) AS porcentaje_utilidad
           FROM item_general ig LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
          WHERE ig.id_item_general IN (${itemPh})`,
        [margenDef, ...itemIds],
      );
      const itemDataMap = new Map<number, Record<string, unknown>>();
      for (const d of itemDatas) itemDataMap.set(Number(d.id_item_general), d);

      const mpsAll: Record<string, unknown>[] = await this.dataSource.query(
        `SELECT igf.id_item_general_formulaciones, igf.formulaciones_id,
                igf.item_general_id AS materia_prima_id, igf.cantidad,
                ig.nombre, ig.codigo, COALESCE(ci.costo_unitario,0) AS costo_unitario,
                (igf.cantidad * COALESCE(ci.costo_unitario,0)) AS costo_total,
                (SELECT COALESCE(SUM(i.cantidad),0) FROM inventario i WHERE i.item_general_id = ig.id_item_general) AS inventario_cantidad
           FROM item_general_formulaciones igf
           INNER JOIN item_general ig ON igf.item_general_id = ig.id_item_general
           LEFT JOIN costos_item ci ON ig.id_item_general = ci.item_general_id
          WHERE igf.formulaciones_id IN (${formPh}) ORDER BY ig.nombre ASC`,
        formIds,
      );
      const mpsMap = new Map<number, Record<string, unknown>[]>();
      for (const mp of mpsAll) {
        const fid = Number(mp.formulaciones_id);
        (mpsMap.get(fid) ?? mpsMap.set(fid, []).get(fid)!).push(mp);
      }

      for (const item of conFormula) {
        const itemData = itemDataMap.get(Number(item.id_item_general)) ?? {};
        const mps = mpsMap.get(Number(item.formulacion_id)) ?? [];
        item.formulacion = {
          item: {
            viscosidad: itemData.viscosidad, p_g: itemData.p_g, color: itemData.color,
            secado: itemData.secado, cubrimiento: itemData.cubrimiento, brillo_60: itemData.brillo_60,
            volumen_base: N(itemData.volumen_base), envase: N(itemData.envase), etiqueta: N(itemData.etiqueta),
            bandeja: N(itemData.bandeja), plastico: N(itemData.plastico), costo_mod: N(itemData.costo_mod),
            porcentaje_utilidad: N(itemData.porcentaje_utilidad),
          },
          materias_primas: mps.map((mp) => ({
            id: N(mp.id_item_general_formulaciones), formulaciones_id: N(mp.formulaciones_id),
            materia_prima_id: N(mp.materia_prima_id), nombre: mp.nombre, codigo: mp.codigo,
            cantidad: N(mp.cantidad), costo_unitario: N(mp.costo_unitario), costo_total: N(mp.costo_total),
            inventario_cantidad: N(mp.inventario_cantidad),
          })),
        };
      }
    }
    for (const item of inventario) {
      if (item.formulacion_id === null) item.formulacion = null;
    }

    return {
      id_bodegas: bodega.id_bodegas,
      nombre: bodega.nombre,
      instalaciones_id: bodega.instalaciones_id,
      inventario,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / perPage),
        currentPage: page,
        perPage,
      },
    };
  }
}
