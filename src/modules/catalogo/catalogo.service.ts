import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';

import { ItemGeneral } from './entities/item-general.entity';
import { CatalogoItemDto } from './dto/catalogo.dto';

const TIPO_MAP: Record<string, number> = {
  'MATERIA PRIMA': 1,
  INSUMO: 2,
  'PRODUCTO TERMINADO': 0,
  PRODUCTO: 0,
};

function normalizarTipo(tipo: unknown): number {
  if (tipo === undefined || tipo === null || tipo === '') return 0;
  if (typeof tipo === 'number') return Math.trunc(tipo);
  if (/^\d+$/.test(String(tipo))) return parseInt(String(tipo), 10);
  return TIPO_MAP[String(tipo).toUpperCase()] ?? 0;
}

/**
 * Réplica fiel de CatalogoController + CatalogoModel (CI4).
 * Las lecturas de stock (stock_total, stock_por_bodega) leen `inventario_capas`
 * por raw SQL — no requieren migrar la lógica de escritura de capas (Fase 3).
 */
@Injectable()
export class CatalogoService {
  constructor(
    @InjectRepository(ItemGeneral)
    private readonly repo: Repository<ItemGeneral>,
    private readonly dataSource: DataSource,
  ) {}

  /** GET /catalogo → array crudo (query idéntica a CatalogoModel::listar; NO filtra deleted_at, como CI4). */
  listar(
    tipo?: number,
    categoriaId?: number,
    busqueda?: string,
  ): Promise<Record<string, unknown>[]> {
    let sql = `
      SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo, ig.categoria_id,
             ig.unidad_id, ig.unidad_almacenaje_id,
             ig.viscosidad, ig.p_g, ig.color, ig.brillo_60,
             ig.secado, ig.cubrimiento, ig.molienda, ig.ph, ig.poder_tintoreo,
             ig.precio_venta_manual, ig.precio_manual_activo,
             c.nombre AS categoria_nombre, u.nombre AS unidad_nombre,
             ua.nombre AS unidad_almacenaje_nombre,
             ci.costo_unitario, ci.precio_venta,
             COALESCE(stock.stock_total, 0) AS stock_total,
             COALESCE(prov.total_proveedores, 0) AS total_proveedores
        FROM item_general ig
        LEFT JOIN categoria   c  ON c.id_categoria      = ig.categoria_id
        LEFT JOIN unidad      u  ON u.id_unidad         = ig.unidad_id
        LEFT JOIN unidad      ua ON ua.id_unidad        = ig.unidad_almacenaje_id
        LEFT JOIN costos_item ci ON ci.item_general_id  = ig.id_item_general
        LEFT JOIN (
          SELECT item_general_id, SUM(cantidad_disponible) AS stock_total
            FROM inventario_capas WHERE estado = 1 AND cantidad_disponible > 0
           GROUP BY item_general_id
        ) stock ON stock.item_general_id = ig.id_item_general
        LEFT JOIN (
          SELECT item_general_id, COUNT(*) AS total_proveedores
            FROM item_proveedor WHERE disponible = 1
           GROUP BY item_general_id
        ) prov ON prov.item_general_id = ig.id_item_general
       WHERE 1=1`;
    const params: unknown[] = [];
    if (tipo !== undefined) {
      sql += ' AND ig.tipo = ?';
      params.push(tipo);
    }
    if (categoriaId !== undefined) {
      sql += ' AND ig.categoria_id = ?';
      params.push(categoriaId);
    }
    if (busqueda) {
      sql += ' AND (UPPER(ig.nombre) LIKE ? OR UPPER(ig.codigo) LIKE ?)';
      const t = '%' + busqueda.toUpperCase() + '%';
      params.push(t, t);
    }
    sql += ' ORDER BY ig.nombre ASC';
    return this.dataSource.query(sql, params);
  }

  /** GET /catalogo/:id → objeto con proveedores[] + stock_por_bodega[] + stock_total. */
  async detalle(id: number): Promise<Record<string, unknown>> {
    const items: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.*, c.nombre AS categoria_nombre, u.nombre AS unidad_nombre,
              ua.nombre AS unidad_almacenaje_nombre,
              ci.costo_unitario, ci.precio_venta, ci.envase, ci.etiqueta,
              ci.plastico, ci.volumen, ci.costo_mp_galon, ci.costo_mp_kg,
              ci.costo_cunete, ci.costo_tambor
         FROM item_general ig
         LEFT JOIN categoria   c  ON c.id_categoria     = ig.categoria_id
         LEFT JOIN unidad      u  ON u.id_unidad        = ig.unidad_id
         LEFT JOIN unidad      ua ON ua.id_unidad       = ig.unidad_almacenaje_id
         LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        WHERE ig.id_item_general = ?`,
      [id],
    );
    if (!items.length) throw new NotFoundException('Ítem no encontrado.');
    const item = items[0];

    item.proveedores = await this.proveedoresDeItem(id);

    const stockBodega: { cantidad: string }[] = await this.dataSource.query(
      `SELECT ic.bodegas_id, b.nombre AS bodega_nombre,
              SUM(ic.cantidad_disponible) AS cantidad, COUNT(*) AS capas_activas
         FROM inventario_capas ic
         LEFT JOIN bodegas b ON b.id_bodegas = ic.bodegas_id
        WHERE ic.item_general_id = ? AND ic.estado = 1 AND ic.cantidad_disponible > 0
        GROUP BY ic.bodegas_id, b.nombre
        ORDER BY b.nombre`,
      [id],
    );
    item.stock_por_bodega = stockBodega;
    const stockTotal = stockBodega.reduce((a, s) => a + Number(s.cantidad), 0);
    item.stock_total = Math.round(stockTotal * 10000) / 10000;

    return item;
  }

  /** GET /catalogo/:id/proveedores → array crudo (versión con telefono/email). */
  proveedoresDeItem(id: number): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT ip.id_item_proveedor, ip.nombre, ip.codigo, ip.tipo,
              ip.precio_unitario, ip.precio_con_iva, ip.disponible, ip.descripcion,
              ip.proveedor_id, ip.unidad_compra_id, ip.factor_conversion,
              p.nombre_empresa, p.nombre_encargado, p.telefono, p.email,
              uc.nombre AS unidad_compra_nombre
         FROM item_proveedor ip
         LEFT JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
         LEFT JOIN unidad uc   ON uc.id_unidad   = ip.unidad_compra_id
        WHERE ip.item_general_id = ?
        ORDER BY ip.disponible DESC, ip.precio_unitario ASC`,
      [id],
    );
  }

  /** POST /catalogo → transacción: item_general + costos_item (costos en 0). */
  async create(dto: CatalogoItemDto): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const tipo = normalizarTipo(dto.tipo);
      const codigo = (dto.codigo ?? '').substring(0, 10);
      const unidadId =
        dto.unidad_id !== undefined && dto.unidad_id !== null
          ? Number(dto.unidad_id)
          : null;
      const unidadAlm =
        dto.unidad_almacenaje_id !== undefined && dto.unidad_almacenaje_id !== null
          ? Number(dto.unidad_almacenaje_id)
          : null;

      const res: { insertId: number } = await manager.query(
        `INSERT INTO item_general
           (nombre, codigo, tipo, categoria_id, viscosidad, p_g, p_kg, color,
            brillo_60, secado, cubrimiento, molienda, ph, poder_tintoreo,
            unidad_id, unidad_almacenaje_id, costo_produccion)
         VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          dto.nombre,
          codigo,
          tipo,
          dto.categoria_id ?? null,
          dto.viscosidad ?? null,
          dto.p_g ?? null,
          dto.color ?? null,
          dto.brillo_60 ?? null,
          dto.secado ?? null,
          dto.cubrimiento ?? null,
          dto.molienda ?? null,
          dto.ph ?? null,
          dto.poder_tintoreo ?? null,
          unidadId,
          unidadAlm,
        ],
      );
      const newId = res.insertId;

      const periodo = new Date().toISOString().slice(0, 7);
      const fecha = new Date().toISOString().slice(0, 10);
      await manager.query(
        `INSERT INTO costos_item
           (item_general_id, costo_unitario, costo_mp_galon, costo_mp_kg,
            costo_cunete, costo_tambor, periodo, metodo_calculo, fecha_calculo,
            envase, etiqueta, bandeja, plastico, precio_venta, costo_mod, volumen, estado)
         VALUES (?, 0, 0, 0, 0, 0, ?, 'Catál', ?, 0, 0, 0, 0, 0, 0, 1, 1)`,
        [newId, periodo, fecha],
      );

      return newId;
    });
  }

  /** PUT /catalogo/:id → actualiza item_general. id inexistente → 400 (como CI4). */
  async update(id: number, dto: CatalogoItemDto): Promise<void> {
    const exists: { n: number }[] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM item_general WHERE id_item_general = ?`,
      [id],
    );
    if (!Number(exists[0].n)) {
      throw new BadRequestException(`Ítem con ID ${id} no encontrado.`);
    }
    const tipo = normalizarTipo(dto.tipo);
    const codigo = (dto.codigo ?? '').substring(0, 10);
    await this.dataSource.query(
      `UPDATE item_general SET nombre=?, codigo=?, tipo=?, categoria_id=?,
              viscosidad=?, p_g=?, color=?, brillo_60=?, secado=?, cubrimiento=?,
              molienda=?, ph=?, poder_tintoreo=?, unidad_id=?, unidad_almacenaje_id=?
        WHERE id_item_general=?`,
      [
        dto.nombre,
        codigo,
        tipo,
        dto.categoria_id ?? null,
        dto.viscosidad ?? null,
        dto.p_g ?? null,
        dto.color ?? null,
        dto.brillo_60 ?? null,
        dto.secado ?? null,
        dto.cubrimiento ?? null,
        dto.molienda ?? null,
        dto.ph ?? null,
        dto.poder_tintoreo ?? null,
        dto.unidad_id != null ? Number(dto.unidad_id) : null,
        dto.unidad_almacenaje_id != null ? Number(dto.unidad_almacenaje_id) : null,
        id,
      ],
    );
  }

  /** DELETE /catalogo/:id → soft-delete con guard 409 si tiene stock activo. */
  async remove(id: number): Promise<void> {
    const item = await this.repo.findOne({ where: { id_item_general: id } });
    if (!item) throw new NotFoundException(`Ítem con ID ${id} no encontrado.`);

    const stock: { total: string | null }[] = await this.dataSource.query(
      `SELECT SUM(cantidad_disponible) AS total FROM inventario_capas
        WHERE item_general_id = ? AND estado = 1`,
      [id],
    );
    if (Number(stock[0].total ?? 0) > 0.0001) {
      throw new ConflictException(
        `No se puede archivar el ítem #${id}: tiene ${stock[0].total} unidades de stock activo. Ajustá el stock a 0 (Inventario → AjusteManual) o usá Sincronización → Merge.`,
      );
    }
    await this.repo.softDelete(id);
  }

  /** POST /catalogo/:id/restore. */
  async restore(id: number): Promise<void> {
    const existe = await this.repo.findOne({
      where: { id_item_general: id },
      withDeleted: true,
    });
    if (!existe) throw new NotFoundException(`Ítem con ID ${id} no encontrado.`);
    const archivado = await this.repo.findOne({
      where: { id_item_general: id, deleted_at: Not(IsNull()) },
      withDeleted: true,
    });
    if (!archivado) throw new BadRequestException('El ítem no está archivado.');
    await this.repo.restore(id);
  }
}
