import { HttpException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import * as crypto from 'node:crypto';

/**
 * Réplica fiel de ItemProveedorController + ItemProveedorModel (CI4).
 * item_proveedor usa SOFT DELETE (deleted_at). resolverItemGeneral auto-crea el
 * item_general (con GET_LOCK por nombre) + su costos_item.
 *
 * ⚠️ p_kg es NOT NULL sin default: CI4 corre NO-ESTRICTO (strictOn=false) y guarda
 * p_kg=''. Nest es ESTRICTO → seteamos p_kg='' explícito para igualar el resultado.
 */
const IP_ALLOWED = [
  'nombre', 'codigo', 'tipo', 'precio_unitario', 'precio_con_iva', 'disponible',
  'descripcion', 'proveedor_id', 'item_general_id', 'unidad_compra_id', 'factor_conversion',
];

@Injectable()
export class ItemProveedorService {
  constructor(private readonly dataSource: DataSource) {}

  private fail(msg: string, status: number, errors?: Record<string, string>): HttpException {
    return new HttpException(errors ? { msg, errors } : { msg }, status);
  }

  private validarFactorConversion(data: Record<string, unknown>): void {
    if (!Object.prototype.hasOwnProperty.call(data, 'factor_conversion')) return;
    const raw = data.factor_conversion;
    if (raw === null || raw === '') return;
    if (Number(raw) <= 0) {
      throw this.fail(
        `El factor de conversión debe ser mayor a 0. Recibido: ${String(raw)}`,
        400,
      );
    }
  }

  // ── GET /item_proveedores (JOIN con proveedor/item_general/unidad) ──
  private mapItemProveedor(it: Record<string, unknown>): Record<string, unknown> {
    return {
      id_item_proveedor: it.id_item_proveedor,
      nombre: it.nombre,
      codigo: it.codigo,
      tipo: it.tipo,
      precio_unitario: Number(it.precio_unitario),
      precio_con_iva: Number(it.precio_con_iva),
      disponible: it.disponible,
      descripcion: it.descripcion,
      proveedor_id: it.proveedor_id,
      nombre_encargado: it.nombre_encargado,
      nombre_empresa: it.nombre_empresa,
      telefono: it.telefono,
      email: it.email,
      item_general_id: it.item_general_id,
      item_general_nombre: it.item_general_nombre,
      item_general_codigo: it.item_general_codigo,
      unidad_compra_id: it.unidad_compra_id,
      unidad_compra_nombre: it.unidad_compra_nombre,
      factor_conversion: Number(it.factor_conversion ?? 1),
      unidad_almacenaje_nombre: it.unidad_almacenaje_nombre,
    };
  }

  /**
   * GET /item_proveedores
   * Retrocompatible: sin `page` → array crudo mapeado (comportamiento histórico,
   * pero SIN el 404-on-empty que rompía con catálogo vacío / páginas vacías).
   * Con `page` → { data, meta }. Filtros: q (nombre|codigo|proveedor), disponible.
   */
  async getItemProveedores(
    query: Record<string, string> = {},
  ): Promise<
    | Record<string, unknown>[]
    | {
        data: Record<string, unknown>[];
        meta: { total: number; page: number; limit: number; pages: number };
      }
  > {
    const where: string[] = ['ip.deleted_at IS NULL'];
    const params: unknown[] = [];
    if (query.disponible) {
      where.push('ip.disponible = ?');
      params.push(query.disponible);
    }
    if (query.q) {
      where.push('(ip.nombre LIKE ? OR ip.codigo LIKE ? OR p.nombre_empresa LIKE ?)');
      params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');
    const base = `FROM item_proveedor ip
         LEFT JOIN proveedor    p  ON p.id_proveedor     = ip.proveedor_id
         LEFT JOIN item_general ig ON ig.id_item_general = ip.item_general_id
         LEFT JOIN unidad       uc ON uc.id_unidad       = ip.unidad_compra_id
         LEFT JOIN unidad       ua ON ua.id_unidad       = ig.unidad_almacenaje_id
        ${whereSql}`;
    const select = `SELECT ip.*, p.nombre_encargado, p.nombre_empresa, p.telefono, p.email,
              ig.nombre AS item_general_nombre, ig.codigo AS item_general_codigo,
              uc.nombre AS unidad_compra_nombre, ua.nombre AS unidad_almacenaje_nombre
         ${base}`;

    // Modo legacy: array completo (sin 404).
    if (!query.page) {
      const items: Record<string, unknown>[] = await this.dataSource.query(
        `${select} ORDER BY ip.id_item_proveedor DESC`,
        params,
      );
      return items.map((it) => this.mapItemProveedor(it));
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

    const items: Record<string, unknown>[] = await this.dataSource.query(
      `${select} ORDER BY ip.id_item_proveedor DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      data: items.map((it) => this.mapItemProveedor(it)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }

  private async getRaw(m: EntityManager | DataSource, id: number): Promise<Record<string, unknown> | null> {
    const rows: Record<string, unknown>[] = await m.query(
      `SELECT * FROM item_proveedor WHERE id_item_proveedor = ? AND deleted_at IS NULL`,
      [id],
    );
    return rows[0] ?? null;
  }

  async show(id: number): Promise<Record<string, unknown>> {
    const row = await this.getRaw(this.dataSource, id);
    if (!row) throw this.fail(`Item Proveedor con ID ${id} no encontrado.`, 404);
    return row;
  }

  // ── resolverItemGeneral: respeta item_general_id, o busca/crea por nombre ──
  private async resolverItemGeneral(m: EntityManager, data: Record<string, unknown>): Promise<number> {
    if (data.item_general_id) return Number(data.item_general_id);

    const nombre = String(data.nombre ?? '').trim().toUpperCase();
    if (nombre === '') {
      throw this.fail('El nombre es obligatorio para auto-vincular el ítem general.', 400);
    }

    const lockKey = 'item_general_create:' + crypto.createHash('md5').update(nombre).digest('hex');
    const lockRow: { got: number | null }[] = await m.query(`SELECT GET_LOCK(?, 5) AS got`, [lockKey]);
    if (Number(lockRow[0]?.got) !== 1) {
      throw this.fail(
        `No se pudo obtener el lock para crear '${nombre}'. Otra operación concurrente está procesando un nombre similar. Reintentá.`,
        400,
      );
    }

    try {
      const existente: { id_item_general: number; deleted_at: string | null }[] = await m.query(
        `SELECT id_item_general, deleted_at FROM item_general WHERE UPPER(TRIM(nombre)) = ? LIMIT 1`,
        [nombre],
      );
      if (existente.length) {
        if (existente[0].deleted_at) {
          throw this.fail(
            `Ya existe un ítem '${nombre}' archivado (soft-deleted). Restauralo desde Catálogo o usá un nombre distinto.`,
            400,
          );
        }
        data.item_general_id = Number(existente[0].id_item_general);
        return data.item_general_id as number;
      }

      const tipoMap: Record<string, number> = { 'Materia Prima': 1, Insumo: 2, Producto: 0 };
      const tipo = tipoMap[String(data.tipo ?? '')] ?? 1;
      const kilo: { id_unidad: number }[] = await m.query(
        `SELECT id_unidad FROM unidad WHERE nombre = 'KILO' LIMIT 1`,
      );
      const kiloId = kilo[0]?.id_unidad ?? null;

      const codigo = data.catalogo_codigo ? String(data.catalogo_codigo).slice(0, 10) : null;
      const categoriaId = data.catalogo_categoria_id ? Number(data.catalogo_categoria_id) : null;
      const unidadId = data.catalogo_unidad_id ? Number(data.catalogo_unidad_id) : null;
      const unidadAlmId = data.catalogo_unidad_almacenaje_id
        ? Number(data.catalogo_unidad_almacenaje_id)
        : kiloId;

      // p_kg='' → NOT NULL sin default; CI4 no-estricto lo dejaría en ''.
      const ins: { insertId: number } = await m.query(
        `INSERT INTO item_general (nombre, codigo, tipo, categoria_id, unidad_id, unidad_almacenaje_id, p_kg)
         VALUES (?, ?, ?, ?, ?, ?, '')`,
        [nombre, codigo, tipo, categoriaId, unidadId, unidadAlmId],
      );
      const nuevoId = ins.insertId;
      if (!nuevoId) throw this.fail(`No se pudo crear el ítem general para '${nombre}'.`, 400);

      await m.query(
        `INSERT INTO costos_item
           (item_general_id, costo_unitario, costo_mp_galon, costo_mp_kg, costo_cunete, costo_tambor,
            periodo, metodo_calculo, fecha_calculo, envase, etiqueta, bandeja, plastico,
            precio_venta, costo_mod, volumen, estado)
         VALUES (?, 0, 0, 0, 0, 0, DATE_FORMAT(CURDATE(),'%Y-%m'), 'Catálogo', CURDATE(), 0, 0, 0, 0, 0, 0, 1, 1)`,
        [nuevoId],
      );

      data.item_general_id = nuevoId;
      return nuevoId;
    } finally {
      await m.query(`SELECT RELEASE_LOCK(?)`, [lockKey]);
    }
  }

  private async insertItemProveedor(m: EntityManager, data: Record<string, unknown>): Promise<number> {
    const cols = IP_ALLOWED.filter((k) => Object.prototype.hasOwnProperty.call(data, k));
    if (!cols.length) return 0;
    const res: { insertId: number } = await m.query(
      `INSERT INTO item_proveedor (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map((k) => data[k]),
    );
    return res.insertId;
  }

  // ── POST /item_proveedores ──
  async create(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!body || Object.keys(body).length === 0) {
      throw this.fail('Datos inválidos', 422, { payload: 'No se recibieron datos válidos.' });
    }
    this.validarFactorConversion(body);
    const data = { ...body };
    return this.dataSource.transaction(async (m) => {
      const itemGeneralId = await this.resolverItemGeneral(m, data);
      const insertId = await this.insertItemProveedor(m, data);
      if (!insertId) throw this.fail('Error al crear el Item Proveedor', 400);
      return {
        mensaje: 'Item Proveedor creado correctamente',
        id: insertId,
        item_general_id: itemGeneralId,
      };
    });
  }

  // ── PUT /item_proveedores/:id ──
  async update(id: number, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!body || Object.keys(body).length === 0) {
      throw this.fail('Datos inválidos', 422, { payload: 'No se recibieron datos válidos.' });
    }
    if (!(await this.getRaw(this.dataSource, id))) {
      throw this.fail(`Item Proveedor con ID ${id} no encontrado.`, 404);
    }
    this.validarFactorConversion(body);
    const data = { ...body };
    return this.dataSource.transaction(async (m) => {
      await this.resolverItemGeneral(m, data);
      const cols = IP_ALLOWED.filter((k) => Object.prototype.hasOwnProperty.call(data, k));
      if (cols.length) {
        await m.query(
          `UPDATE item_proveedor SET ${cols.map((k) => `${k} = ?`).join(', ')}
            WHERE id_item_proveedor = ? AND deleted_at IS NULL`,
          [...cols.map((k) => data[k]), id],
        );
      }
      return {
        mensaje: `Item Proveedor con ID ${id} actualizado correctamente`,
        item_general_id: data.item_general_id,
      };
    });
  }

  // ── DELETE /item_proveedores/:id (soft) ──
  async remove(id: number): Promise<Record<string, unknown>> {
    if (!(await this.getRaw(this.dataSource, id))) {
      throw this.fail(`Item Proveedor con ID ${id} no encontrado.`, 404);
    }
    await this.dataSource.query(
      `UPDATE item_proveedor SET deleted_at = NOW() WHERE id_item_proveedor = ? AND deleted_at IS NULL`,
      [id],
    );
    return { mensaje: `Item Proveedor con ID ${id} eliminada correctamente` };
  }

  // ── PATCH /item_proveedores/:id/vincular ──
  async vincular(id: number, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const data = body ?? {};
    // validateJson (CI4): factor_conversion permit_empty|decimal|greater_than[0] → 422.
    if (
      Object.prototype.hasOwnProperty.call(data, 'factor_conversion') &&
      data.factor_conversion !== null &&
      data.factor_conversion !== ''
    ) {
      const f = Number(data.factor_conversion);
      if (!(f > 0)) {
        throw this.fail('Datos inválidos', 422, {
          factor_conversion: 'The factor_conversion field must contain a number greater than 0.',
        });
      }
    }
    // NOTA: en CI4 `crear:true` (booleano) siempre falla la validación in_list → 422,
    // y `crear:1` pasa pero `===true` es false → nunca crea (feature MUERTO en CI4).
    // Nest lo implementa correctamente: crear truthy → crea el item_general.
    const itemProveedor = await this.getRaw(this.dataSource, id);
    if (!itemProveedor) throw this.fail(`Item Proveedor con ID ${id} no encontrado.`, 404);

    return this.dataSource.transaction(async (m) => {
      let itemGeneralId: number | null;

      if (data.crear === true) {
        // Crear ítem nuevo en item_general (sin costos_item; eso solo lo hace resolverItemGeneral).
        const ins: { insertId: number } = await m.query(
          `INSERT INTO item_general (nombre, codigo, tipo, unidad_id, categoria_id, p_kg)
           VALUES (?, ?, ?, ?, ?, '')`,
          [
            data.nombre ?? itemProveedor.nombre,
            data.codigo ?? itemProveedor.codigo,
            data.tipo ?? 2,
            data.unidad_id ?? null,
            data.categoria_id ?? null,
          ],
        );
        itemGeneralId = ins.insertId;
        if (!itemGeneralId) throw this.fail('No se pudo crear el ítem general.', 400);
      } else {
        itemGeneralId =
          data.item_general_id !== undefined && data.item_general_id !== null
            ? Number(data.item_general_id)
            : null;
      }

      const unidadCompraId =
        data.unidad_compra_id !== undefined && data.unidad_compra_id !== null
          ? Number(data.unidad_compra_id)
          : null;
      const factorConversion =
        data.factor_conversion !== undefined && data.factor_conversion !== null
          ? Number(data.factor_conversion)
          : 1.0;
      if (factorConversion <= 0) {
        throw this.fail('El factor de conversión debe ser mayor a 0.', 400);
      }

      await m.query(
        `UPDATE item_proveedor SET item_general_id = ?, unidad_compra_id = ?, factor_conversion = ?
          WHERE id_item_proveedor = ?`,
        [itemGeneralId, unidadCompraId, factorConversion, id],
      );

      return { mensaje: 'Ítem vinculado correctamente', item_general_id: itemGeneralId };
    });
  }

  // ── GET /proveedor_items (:id?) — proveedores con sus items anidados ──
  async proveedorItems(id?: number): Promise<unknown> {
    const where = id != null ? ' AND id_proveedor = ?' : '';
    const params = id != null ? [id] : [];
    const proveedores: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM proveedor WHERE deleted_at IS NULL${where}`,
      params,
    );
    for (const p of proveedores) {
      const items: Record<string, unknown>[] = await this.dataSource.query(
        `SELECT ip.* FROM item_proveedor ip WHERE ip.proveedor_id = ? AND ip.deleted_at IS NULL`,
        [p.id_proveedor],
      );
      for (const it of items) {
        it.precio_unitario = Number(it.precio_unitario);
        it.precio_con_iva = Number(it.precio_con_iva);
      }
      p.items = items;
    }
    if (id != null) {
      const first = proveedores[0] ?? null;
      if (!first) throw this.fail(`Proveedor con ID ${id} no encontrado.`, 404);
      return first;
    }
    return proveedores;
  }
}
