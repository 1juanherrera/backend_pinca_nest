import { HttpException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

/**
 * Réplica fiel de ItemController + ItemModel (CI4) — controller LEGACY /item_general.
 * item_general NO usa soft-delete acá (useSoftDeletes=false → find/delete son físicos).
 * ⚠️ p_kg NOT NULL sin default: CI4 no-estricto → ''; Nest estricto → seteamos '' explícito.
 */
@Injectable()
export class ItemService {
  constructor(private readonly dataSource: DataSource) {}

  private fail(msg: string, status: number): HttpException {
    return new HttpException({ msg }, status);
  }

  private tipoMap(tipo: unknown): number {
    if (tipo === 'MATERIA PRIMA') return 1;
    if (tipo === 'INSUMO') return 2;
    return 0;
  }

  // ── GET /item_general ── (findAll, sin filtro soft-delete)
  itemGeneral(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`SELECT * FROM item_general`);
  }

  // ── GET /items ──
  async getItemsAll(): Promise<Record<string, unknown>[]> {
    const items: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.*, c.nombre AS categoria, ci.costo_unitario,
              u.nombre AS unidad_nombre, u.escala AS escala_venta,
              ua.nombre AS unidad_almacenaje, ua.escala AS escala_almacenaje
         FROM item_general ig
         LEFT JOIN categoria c    ON ig.categoria_id          = c.id_categoria
         LEFT JOIN costos_item ci ON ci.item_general_id       = ig.id_item_general
         LEFT JOIN unidad u       ON ig.unidad_id             = u.id_unidad
         LEFT JOIN unidad ua      ON ig.unidad_almacenaje_id  = ua.id_unidad`,
    );
    const tipos: Record<number, string> = { 0: 'PRODUCTO', 1: 'MATERIA PRIMA', 2: 'INSUMO' };
    for (const it of items) it.nombre_tipo = tipos[Number(it.tipo)] ?? 'Otro';
    return items;
  }

  // ── GET /items/materias_disponibles ──
  materiasDisponibles(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`
      SELECT ig.id_item_general AS item_general_id, NULL AS id_item_proveedor, ig.nombre, ig.codigo,
             COALESCE(NULLIF(ci.costo_unitario, 0),
               (SELECT MIN(ip2.precio_unitario / GREATEST(ip2.factor_conversion, 1))
                  FROM item_proveedor ip2 WHERE ip2.item_general_id = ig.id_item_general AND ip2.deleted_at IS NULL),
               0) AS costo_unitario,
             'inventario' AS fuente, NULL AS proveedor_nombre, 1 AS comprado
        FROM item_general ig
        LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
       WHERE ig.tipo = 1 AND ig.deleted_at IS NULL
      UNION ALL
      SELECT NULL AS item_general_id, ip.id_item_proveedor, ip.nombre, ip.codigo,
             COALESCE(ip.precio_unitario, 0) AS costo_unitario,
             'proveedor' AS fuente, p.nombre_empresa AS proveedor_nombre, 0 AS comprado
        FROM item_proveedor ip
        LEFT JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
       WHERE ip.item_general_id IS NULL AND ip.deleted_at IS NULL
       ORDER BY nombre ASC`);
  }

  // ── GET /item_general/:id ──
  async show(id: number): Promise<Record<string, unknown>> {
    if (!id) throw this.fail('ID no proporcionado', 400);
    const item = (await this.dataSource.query(
      `SELECT ig.*, c.costo_unitario, c.envase, c.etiqueta, c.plastico, c.volumen,
              c.costo_mp_galon, c.costo_mp_kg, c.precio_venta, i.cantidad
         FROM item_general ig
         LEFT JOIN costos_item c ON c.item_general_id = ig.id_item_general
         LEFT JOIN inventario i  ON i.item_general_id = ig.id_item_general
        WHERE ig.id_item_general = ?`,
      [id],
    ))[0];
    if (!item) throw this.fail('El item no existe.', 404);

    const form = (await this.dataSource.query(
      `SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ?`,
      [id],
    ))[0];
    item.formulaciones = form
      ? await this.dataSource.query(
          `SELECT igf.item_general_id, ig.nombre, igf.cantidad
             FROM item_general_formulaciones igf
             LEFT JOIN item_general ig ON ig.id_item_general = igf.item_general_id
            WHERE igf.formulaciones_id = ?`,
          [form.id_formulaciones],
        )
      : [];
    return item;
  }

  // ── GET /item_general/:id/inventario ──
  async inventarioPorItem(id: number): Promise<Record<string, unknown>[]> {
    if (!id) throw this.fail('ID no proporcionado', 400);
    return this.dataSource.query(
      `SELECT inv.id_inventario, inv.cantidad, inv.bodegas_id,
              COALESCE(b.nombre, CONCAT('Bodega #', inv.bodegas_id)) AS bodega, ins.nombre AS sede
         FROM inventario inv
         LEFT JOIN bodegas b         ON b.id_bodegas         = inv.bodegas_id
         LEFT JOIN instalaciones ins ON ins.id_instalaciones = b.instalaciones_id
        WHERE inv.item_general_id = ? ORDER BY bodega ASC`,
      [id],
    );
  }

  // ── GET /item_general/buscar ──
  async buscarFuzzy(queryRaw: string, limitRaw?: string, tiposRaw?: string): Promise<Record<string, unknown>[]> {
    const query = (queryRaw ?? '').trim();
    const limit = Math.min(Math.trunc(Number(limitRaw) || 10), 30);
    if (query.length < 2) return [];
    const tipos = (tiposRaw ?? '').trim() !== ''
      ? tiposRaw!.split(',').map((x) => Math.trunc(Number(x)))
      : [];

    const queryUpper = query.toUpperCase();
    const tokens = [...new Set(queryUpper.split(' ').filter((t) => t))];

    const whereParts: string[] = [];
    const scoreParts: string[] = [];
    const params: unknown[] = [];
    for (const token of tokens) {
      if (token.length < 2) continue;
      whereParts.push('UPPER(ig.nombre) LIKE ?');
      scoreParts.push('CASE WHEN UPPER(ig.nombre) LIKE ? THEN 3 ELSE 0 END');
      params.push(`%${token}%`, `%${token}%`);
      if (token.length > 3) {
        const truncado = token.slice(0, -1);
        whereParts.push('UPPER(ig.nombre) LIKE ?');
        scoreParts.push('CASE WHEN UPPER(ig.nombre) LIKE ? THEN 1 ELSE 0 END');
        params.push(`%${truncado}%`, `%${truncado}%`);
      }
      whereParts.push("SOUNDEX(ig.nombre) LIKE CONCAT(SOUNDEX(?), '%')");
      scoreParts.push("CASE WHEN SOUNDEX(ig.nombre) LIKE CONCAT(SOUNDEX(?), '%') THEN 1 ELSE 0 END");
      params.push(token, token);
    }
    if (!whereParts.length) return [];

    let whereClause = '(' + whereParts.join(' OR ') + ')';
    const scoreExpr = '(' + scoreParts.join(' + ') + ')';
    if (tipos.length) {
      whereClause += ` AND ig.tipo IN (${tipos.map(() => '?').join(',')})`;
      params.push(...tipos);
    }
    params.push(limit);

    return this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo, ci.costo_unitario,
              (SELECT COUNT(*) FROM item_proveedor ip WHERE ip.item_general_id = ig.id_item_general AND ip.disponible = 1) AS total_proveedores,
              (SELECT MIN(ip2.precio_unitario) FROM item_proveedor ip2 WHERE ip2.item_general_id = ig.id_item_general AND ip2.disponible = 1) AS precio_min,
              (SELECT MAX(ip3.precio_unitario) FROM item_proveedor ip3 WHERE ip3.item_general_id = ig.id_item_general AND ip3.disponible = 1) AS precio_max,
              (SELECT GROUP_CONCAT(CONCAT(COALESCE(p.nombre_empresa, p.nombre_encargado), '|', ip4.precio_unitario)
                       ORDER BY ip4.precio_unitario ASC SEPARATOR ';;;')
                 FROM item_proveedor ip4 JOIN proveedor p ON p.id_proveedor = ip4.proveedor_id
                WHERE ip4.item_general_id = ig.id_item_general AND ip4.disponible = 1) AS proveedores_lista,
              ${scoreExpr} AS relevancia
         FROM item_general ig
         LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        WHERE ${whereClause}
        ORDER BY relevancia DESC, ig.nombre ASC LIMIT ?`,
      params,
    );
  }

  // ── PATCH /item_general/:id/precio-manual ──
  async updatePrecioManual(id: number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!id) throw this.fail('ID no proporcionado', 400);
    if (!data || Object.keys(data).length === 0) throw this.fail('No se recibieron datos válidos.', 400);
    const allowedKeys = ['precio_venta_manual', 'precio_manual_activo'];
    const cols = allowedKeys.filter((k) => Object.prototype.hasOwnProperty.call(data, k));
    if (!cols.length) throw this.fail('No hay campos válidos para actualizar.', 400);
    const exists = Number(
      (await this.dataSource.query(`SELECT COUNT(*) AS n FROM item_general WHERE id_item_general = ?`, [id]))[0].n,
    );
    if (!exists) throw this.fail(`Item con ID ${id} no encontrado.`, 400);
    await this.dataSource.query(
      `UPDATE item_general SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id_item_general = ?`,
      [...cols.map((c) => data[c]), id],
    );
    return { success: true, mensaje: `Precio manual del item ${id} actualizado correctamente`, data };
  }

  // ── POST /item_general ── create_full_item
  async create(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!data || Object.keys(data).length === 0) throw this.fail('No se recibieron datos o el JSON es inválido', 400);
    if (!data.nombre) throw this.fail('El nombre es obligatorio.', 422);

    const id = await this.dataSource.transaction(async (m) => {
      const tipo = this.tipoMap(data.tipo);
      const ins: { insertId: number } = await m.query(
        `INSERT INTO item_general
           (nombre, codigo, tipo, categoria_id, viscosidad, p_g, color, brillo_60, secado,
            cubrimiento, molienda, ph, poder_tintoreo, unidad_id, costo_produccion, p_kg)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')`,
        [
          data.nombre, String(data.codigo ?? '').slice(0, 10), tipo, data.categoria_id ?? null,
          data.viscosidad ?? null, data.p_g ?? null, data.color ?? null, data.brillo_60 ?? null,
          data.secado ?? null, data.cubrimiento ?? null, data.molienda ?? null, data.ph ?? null,
          data.poder_tintoreo ?? null, data.unidad_id ?? null, data.costo_unitario ?? 0,
        ],
      );
      const newId = ins.insertId;

      await m.query(
        `INSERT INTO costos_item
           (item_general_id, costo_unitario, costo_mp_galon, costo_cunete, costo_tambor, periodo,
            metodo_calculo, fecha_calculo, costo_mp_kg, envase, etiqueta, bandeja, plastico,
            precio_venta, costo_mod, volumen, estado)
         VALUES (?, ?, ?, ?, ?, DATE_FORMAT(CURDATE(),'%Y-%m'), ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          newId, data.costo_unitario ?? 0, data.costo_mp_galon ?? 0, data.costo_cunete ?? 0,
          data.costo_tambor ?? 0, data.metodo_calculo ?? 'Manual', data.costo_mp_kg ?? 0,
          data.envase ?? 0, data.etiqueta ?? 0, data.bandeja ?? 0, data.plastico ?? 0,
          data.precio_venta ?? 0, data.costo_mod ?? 0, data.volumen ?? 1,
        ],
      );

      await m.query(
        `INSERT INTO inventario
           (item_general_id, bodegas_id, cantidad, fecha_update, apartada, estado, movimiento_inventario_id, tipo)
         VALUES (?, ?, ?, CURDATE(), 0, 1, NULL, 1)`,
        [newId, data.bodega_id ?? 1, data.cantidad ?? 0],
      );

      const forms = data.formulaciones as Record<string, unknown>[] | undefined;
      if (forms && forms.length) {
        const insF: { insertId: number } = await m.query(
          `INSERT INTO formulaciones (nombre, descripcion, estado, defecto, item_general_id)
           VALUES (?, ?, 1, 1, ?)`,
          [`PREPARACION ${data.nombre}`, data.descripcion_formula ?? null, newId],
        );
        const idForm = insF.insertId;
        const detalle = forms.filter((f) => f.materia_prima_id);
        for (const f of detalle) {
          await m.query(
            `INSERT INTO item_general_formulaciones (formulaciones_id, item_general_id, cantidad, porcentaje)
             VALUES (?, ?, ?, ?)`,
            [idForm, f.materia_prima_id, f.cantidad, f.porcentaje ?? 0],
          );
        }
      }
      return newId;
    });

    return { status: 201, message: 'Ítem completo creado con éxito', id };
  }

  // ── PUT /item_general/:id ── update_full_item
  async update(id: number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!id) throw this.fail('ID no proporcionado', 400);
    await this.dataSource.transaction(async (m) => {
      const existing = (await m.query(`SELECT id_item_general FROM item_general WHERE id_item_general = ?`, [id]))[0];
      if (!existing) throw this.fail('El item no existe.', 400);

      const tipoRaw = data.tipo;
      const tipo = tipoRaw != null && !Number.isNaN(Number(tipoRaw)) && String(tipoRaw).trim() !== ''
        ? Math.trunc(Number(tipoRaw))
        : this.tipoMap(tipoRaw);

      await m.query(
        `UPDATE item_general SET nombre=?, codigo=?, tipo=?, categoria_id=?, viscosidad=?, p_g=?, color=?,
                brillo_60=?, secado=?, cubrimiento=?, molienda=?, ph=?, poder_tintoreo=?, unidad_id=?
          WHERE id_item_general=?`,
        [
          data.nombre, String(data.codigo ?? '').slice(0, 10), tipo, data.categoria_id ?? null,
          data.viscosidad ?? null, data.p_g ?? null, data.color ?? null, data.brillo_60 ?? null,
          data.secado ?? null, data.cubrimiento ?? null, data.molienda ?? null, data.ph ?? null,
          data.poder_tintoreo ?? null, data.unidad_id ?? null, id,
        ],
      );

      const existsCostos = Number(
        (await m.query(`SELECT COUNT(*) AS n FROM costos_item WHERE item_general_id = ?`, [id]))[0].n,
      );
      // Columnas de costo permitidas (whitelist). Sólo se actualizan las que
      // vienen REALMENTE en el body: antes se usaba `data.x ?? 0` para todas, así
      // que un PUT parcial que no reenviaba `costo_unitario` lo pisaba con 0
      // (destruyendo el promedio ponderado que mantiene el motor de capas) y
      // `volumen` con 1. Ahora las ausentes quedan intactas; `costo_unitario`
      // sólo se toca si el body lo envía explícitamente.
      const COST_COLS = [
        'costo_unitario', 'envase', 'etiqueta', 'plastico',
        'volumen', 'costo_cunete', 'costo_tambor',
      ] as const;
      if (existsCostos > 0) {
        const present = COST_COLS.filter((c) => data[c] !== undefined);
        if (present.length > 0) {
          const setSql = present.map((c) => `${c}=?`).join(', ');
          await m.query(
            `UPDATE costos_item SET ${setSql}, fecha_calculo=CURDATE() WHERE item_general_id=?`,
            [...present.map((c) => data[c]), id],
          );
        }
      } else {
        // Ítem nuevo sin fila de costos: se siembra una fila completa con defaults.
        const costos = [
          data.costo_unitario ?? 0, data.envase ?? 0, data.etiqueta ?? 0, data.plastico ?? 0,
          data.volumen ?? 1, data.costo_cunete ?? 0, data.costo_tambor ?? 0,
        ];
        await m.query(
          `INSERT INTO costos_item (costo_unitario, envase, etiqueta, plastico, volumen, fecha_calculo,
                  costo_cunete, costo_tambor, item_general_id)
           VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)`,
          [...costos, id],
        );
      }

      if (data.cantidad !== undefined && data.bodega_id !== undefined) {
        const res: { affectedRows: number } = await m.query(
          `UPDATE inventario SET cantidad=? WHERE item_general_id=? AND bodegas_id=?`,
          [Number(data.cantidad), id, Number(data.bodega_id)],
        );
        if (res.affectedRows === 0) {
          const check = (await m.query(
            `SELECT id_inventario FROM inventario WHERE item_general_id=? AND bodegas_id=?`,
            [id, Number(data.bodega_id)],
          ))[0];
          if (!check) {
            await m.query(
              `INSERT INTO inventario (item_general_id, bodegas_id, cantidad, estado, tipo) VALUES (?, ?, ?, 0, 1)`,
              [id, Number(data.bodega_id), Number(data.cantidad)],
            );
          }
        }
      }

      const formRow = (await m.query(`SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ?`, [id]))[0];
      let idForm: number;
      if (formRow) {
        idForm = Number(formRow.id_formulaciones);
        if (data.descripcion_formula !== undefined) {
          await m.query(`UPDATE formulaciones SET descripcion=? WHERE id_formulaciones=?`, [data.descripcion_formula, idForm]);
        }
      } else {
        const insF: { insertId: number } = await m.query(
          `INSERT INTO formulaciones (nombre, item_general_id, estado, defecto) VALUES (?, ?, 1, 1)`,
          [`Formulación - ${data.nombre}`, id],
        );
        idForm = insF.insertId;
      }

      if (data.formulaciones !== undefined) {
        await m.query(`DELETE FROM item_general_formulaciones WHERE formulaciones_id = ?`, [idForm]);
        const detalle = (data.formulaciones as Record<string, unknown>[]).filter((f) => f.materia_prima_id);
        for (const f of detalle) {
          await m.query(
            `INSERT INTO item_general_formulaciones (formulaciones_id, item_general_id, cantidad, porcentaje)
             VALUES (?, ?, ?, ?)`,
            [idForm, f.materia_prima_id, f.cantidad ?? 0, f.porcentaje ?? 0],
          );
        }
      }
    });

    return { status: 200, message: `Item ${id} y sus dependencias actualizados correctamente` };
  }

  // ── DELETE /item_general/:id ──
  async remove(id: number): Promise<Record<string, unknown>> {
    const item = (await this.dataSource.query(`SELECT id_item_general FROM item_general WHERE id_item_general = ?`, [id]))[0];
    if (!item) throw this.fail(`Item con ID ${id} no encontrado.`, 404);

    const bloqueos: string[] = [];
    const stock = Number(
      (await this.dataSource.query(
        `SELECT COALESCE(SUM(cantidad_disponible),0) AS total FROM inventario_capas WHERE item_general_id=? AND estado=1`,
        [id],
      ))[0].total,
    );
    if (stock > 0.0001) bloqueos.push(`tiene ${stock} de stock activo`);
    const usos = Number(
      (await this.dataSource.query(`SELECT COUNT(*) AS n FROM item_general_formulaciones WHERE item_general_id=?`, [id]))[0].n,
    );
    if (usos > 0) bloqueos.push(`se usa como ingrediente en ${usos} fórmula(s)`);
    // CI4 hace `WHERE deleted_at IS NULL` acá, pero `formulaciones` NO tiene esa columna →
    // CI4 delete() SIEMPRE tira 500 (endpoint MUERTO). Nest lo hace bien (sin ese filtro).
    const tieneFormula = Number(
      (await this.dataSource.query(`SELECT COUNT(*) AS n FROM formulaciones WHERE item_general_id=?`, [id]))[0].n,
    );
    if (tieneFormula > 0) bloqueos.push(`tiene ${tieneFormula} fórmula(s) propia(s)`);

    if (bloqueos.length) {
      throw this.fail(
        `No se puede eliminar el ítem #${id}: ${bloqueos.join(', ')}. Quitá esas dependencias o usá Sincronización → Merge para unificarlo.`,
        409,
      );
    }
    try {
      await this.dataSource.query(`DELETE FROM item_general WHERE id_item_general=?`, [id]);
    } catch {
      throw this.fail(`No se puede eliminar el ítem #${id} porque está referenciado por otros registros.`, 409);
    }
    return { mensaje: `Item ${id} eliminado` };
  }
}
