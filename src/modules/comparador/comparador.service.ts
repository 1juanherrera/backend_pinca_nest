import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

const N = (x: unknown) => Number(x ?? 0);

/** Réplica fiel de ComparadorController + ComparadorModel (CI4). Read-only. */
@Injectable()
export class ComparadorService {
  constructor(private readonly dataSource: DataSource) {}

  // ── GET /comparador/por_item ── mismo producto por distintos proveedores, agrupado ──
  async porItem(): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ip.nombre, ip.tipo, uc.nombre AS unidad_empaque, ip.id_item_proveedor, ip.codigo,
              ip.precio_unitario, ip.precio_con_iva, ip.disponible, ip.item_general_id,
              ig.nombre AS item_general_nombre, p.id_proveedor, p.nombre_empresa, p.nombre_encargado
         FROM item_proveedor ip
         LEFT JOIN proveedor    p  ON p.id_proveedor     = ip.proveedor_id
         LEFT JOIN item_general ig ON ig.id_item_general = ip.item_general_id
         LEFT JOIN unidad       uc ON uc.id_unidad       = ip.unidad_compra_id
        ORDER BY ip.nombre ASC, ip.precio_unitario ASC`,
    );

    const grouped = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const key = String(row.nombre ?? '').trim().toLowerCase();
      const precio = N(row.precio_unitario);
      if (!grouped.has(key)) {
        grouped.set(key, {
          nombre: row.nombre,
          tipo: row.tipo,
          unidad_empaque: row.unidad_empaque,
          item_general_id: row.item_general_id,
          item_general_nombre: row.item_general_nombre,
          precio_min: precio,
          precio_max: precio,
          proveedores: [],
        });
      }
      const g = grouped.get(key)!;
      if (precio < (g.precio_min as number)) g.precio_min = precio;
      if (precio > (g.precio_max as number)) g.precio_max = precio;
      (g.proveedores as Record<string, unknown>[]).push({
        id_item_proveedor: row.id_item_proveedor,
        codigo: row.codigo,
        precio_unitario: precio,
        precio_con_iva: N(row.precio_con_iva),
        disponible: row.disponible,
        id_proveedor: row.id_proveedor,
        nombre_empresa: row.nombre_empresa,
        nombre_encargado: row.nombre_encargado,
      });
    }
    return [...grouped.values()];
  }

  // ── GET /comparador/por_proveedor/:id ──
  async porProveedor(proveedorId: number): Promise<Record<string, unknown>[]> {
    if (!proveedorId) throw new HttpException({ msg: 'Se requiere el ID del proveedor.' }, 422);
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ip.*, p.nombre_empresa, p.nombre_encargado,
              ig.nombre AS item_general_nombre, ig.codigo AS item_general_codigo
         FROM item_proveedor ip
         LEFT JOIN proveedor    p  ON p.id_proveedor     = ip.proveedor_id
         LEFT JOIN item_general ig ON ig.id_item_general = ip.item_general_id
        WHERE ip.proveedor_id = ? ORDER BY ip.precio_unitario ASC`,
      [proveedorId],
    );
    return rows.map((r) => ({ ...r, precio_unitario: N(r.precio_unitario), precio_con_iva: N(r.precio_con_iva) }));
  }

  // ── GET /comparador/historial/:id ──
  async historial(itemProveedorId: number): Promise<Record<string, unknown>[]> {
    if (!itemProveedorId) throw new HttpException({ msg: 'Se requiere el ID del item proveedor.' }, 422);
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT hp.id_historial, hp.precio_unitario, hp.precio_con_iva, hp.fecha, hp.observacion, hp.creado_en,
              ip.nombre AS nombre_producto, ip.codigo AS codigo_producto, p.nombre_empresa
         FROM historial_precios hp
         JOIN item_proveedor ip ON ip.id_item_proveedor = hp.item_proveedor_id
         JOIN proveedor      p  ON p.id_proveedor       = ip.proveedor_id
        WHERE hp.item_proveedor_id = ? ORDER BY hp.fecha ASC`,
      [itemProveedorId],
    );
    return rows.map((r) => ({ ...r, precio_unitario: N(r.precio_unitario), precio_con_iva: N(r.precio_con_iva) }));
  }
}
