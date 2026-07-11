import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** number_format(x,0,',','.'): entero con separador de miles '.'. */
const nfDot = (x: unknown) => Math.round(Number(x ?? 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
/** rawurlencode de PHP: como encodeURIComponent pero además escapa !*'(). */
const rawurlencode = (s: string) =>
  encodeURIComponent(s ?? '').replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
/** trim($s, ' ·'): quita espacios y '·' de ambos extremos. */
const trimSep = (s: string) => s.replace(/^[ ·]+/, '').replace(/[ ·]+$/, '');
const join = (parts: (string | null | undefined)[]) => parts.filter((p) => p != null && p !== '').join(' · ');

/** Réplica fiel de SearchController (CI4). Búsqueda global Cmd+K (read-only). */
@Injectable()
export class SearchService {
  constructor(private readonly dataSource: DataSource) {}

  async search(qRaw?: string, limitRaw?: string): Promise<Record<string, unknown>[]> {
    const q = (qRaw ?? '').trim();
    if (q === '' || [...q].length < 2) return [];
    const limit = Math.max(1, Math.min(10, Math.trunc(Number(limitRaw) || 5)));
    const like = `%${q}%`;
    const out: Record<string, unknown>[] = [];

    // ITEMS
    const items: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo FROM item_general ig
        WHERE (ig.nombre LIKE ? OR ig.codigo LIKE ?) AND (ig.deleted_at IS NULL)
        ORDER BY (ig.nombre = ?) DESC, LENGTH(ig.nombre) ASC LIMIT ${limit}`,
      [like, like, q],
    );
    const tipoLabel: Record<number, string> = { 1: 'Materia prima', 2: 'Insumo', 0: 'Producto' };
    for (const r of items) {
      out.push({
        tipo: 'item',
        id: Number(r.id_item_general),
        label: r.nombre,
        sublabel: trimSep(`${r.codigo ?? ''} · ${tipoLabel[Number(r.tipo)] ?? '—'}`),
        path: '/catalogo?q=' + rawurlencode(String(r.nombre)),
      });
    }

    // CLIENTES
    const clientes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id_clientes, nombre_empresa, nombre_encargado, numero_documento, ciudad FROM clientes
        WHERE (nombre_empresa LIKE ? OR nombre_encargado LIKE ? OR numero_documento LIKE ?) AND deleted_at IS NULL
        ORDER BY (nombre_empresa = ?) DESC, LENGTH(nombre_empresa) ASC LIMIT ${limit}`,
      [like, like, like, q],
    );
    for (const r of clientes) {
      out.push({
        tipo: 'cliente',
        id: Number(r.id_clientes),
        label: r.nombre_empresa ?? '—',
        sublabel: join([r.nombre_encargado as string, r.numero_documento ? `NIT ${r.numero_documento}` : '', r.ciudad as string]),
        path: '/clientes?q=' + rawurlencode(String(r.nombre_empresa ?? '')),
      });
    }

    // PROVEEDORES
    const proveedores: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id_proveedor, nombre_empresa, nombre_encargado, numero_documento FROM proveedor
        WHERE (nombre_empresa LIKE ? OR nombre_encargado LIKE ? OR numero_documento LIKE ?) AND deleted_at IS NULL
        ORDER BY (nombre_empresa = ?) DESC, LENGTH(nombre_empresa) ASC LIMIT ${limit}`,
      [like, like, like, q],
    );
    for (const r of proveedores) {
      out.push({
        tipo: 'proveedor',
        id: Number(r.id_proveedor),
        label: r.nombre_empresa ?? '—',
        sublabel: join([r.nombre_encargado as string, r.numero_documento ? `NIT ${r.numero_documento}` : '']),
        path: '/proveedores?q=' + rawurlencode(String(r.nombre_empresa ?? '')),
      });
    }

    // FACTURAS
    const facturas: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT f.id_facturas, f.numero, f.estado, f.total, f.fecha_emision, c.nombre_empresa AS cliente_nombre
         FROM facturas f LEFT JOIN clientes c ON c.id_clientes = f.cliente_id
        WHERE f.numero LIKE ? AND f.deleted_at IS NULL ORDER BY f.fecha_emision DESC LIMIT ${limit}`,
      [like],
    );
    for (const r of facturas) {
      out.push({
        tipo: 'factura',
        id: Number(r.id_facturas),
        label: r.numero,
        sublabel: join([r.cliente_nombre as string, `$${nfDot(r.total)}`, r.estado as string]),
        path: '/comercial?tab=facturas&q=' + rawurlencode(String(r.numero)),
      });
    }

    // COTIZACIONES
    const cotiz: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT co.id_cotizaciones, co.numero, co.estado, co.total, co.fecha_cotizacion, c.nombre_empresa AS cliente_nombre
         FROM cotizaciones co LEFT JOIN clientes c ON c.id_clientes = co.cliente_id
        WHERE co.numero LIKE ? AND co.deleted_at IS NULL ORDER BY co.fecha_cotizacion DESC LIMIT ${limit}`,
      [like],
    );
    for (const r of cotiz) {
      out.push({
        tipo: 'cotizacion',
        id: Number(r.id_cotizaciones),
        label: r.numero,
        sublabel: join([r.cliente_nombre as string, `$${nfDot(r.total)}`, r.estado as string]),
        path: '/comercial?tab=cotizaciones&q=' + rawurlencode(String(r.numero)),
      });
    }

    // REMISIONES
    const remi: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT r.id_remisiones, r.numero, r.estado, r.fecha_remision, c.nombre_empresa AS cliente_nombre
         FROM remisiones r LEFT JOIN clientes c ON c.id_clientes = r.cliente_id
        WHERE r.numero LIKE ? AND r.deleted_at IS NULL ORDER BY r.fecha_remision DESC LIMIT ${limit}`,
      [like],
    );
    for (const r of remi) {
      out.push({
        tipo: 'remision',
        id: Number(r.id_remisiones),
        label: r.numero,
        sublabel: join([r.cliente_nombre as string, r.estado as string]),
        path: '/comercial?tab=remisiones&q=' + rawurlencode(String(r.numero)),
      });
    }

    // ÓRDENES DE COMPRA
    const ocs: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT oc.id_orden, oc.numero, oc.estado, oc.total, oc.fecha, p.nombre_empresa AS proveedor_nombre
         FROM ordenes_compra oc LEFT JOIN proveedor p ON p.id_proveedor = oc.proveedor_id
        WHERE oc.numero LIKE ? AND oc.deleted_at IS NULL ORDER BY oc.fecha DESC LIMIT ${limit}`,
      [like],
    );
    for (const r of ocs) {
      out.push({
        tipo: 'orden_compra',
        id: Number(r.id_orden),
        label: r.numero,
        sublabel: join([r.proveedor_nombre as string, `$${nfDot(r.total)}`, r.estado as string]),
        path: '/compras?q=' + rawurlencode(String(r.numero)),
      });
    }

    // NOTAS DE CRÉDITO
    const ncs: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT nc.id_nota_credito, nc.numero, nc.estado, nc.monto, nc.fecha, c.nombre_empresa AS cliente_nombre
         FROM notas_credito nc LEFT JOIN clientes c ON c.id_clientes = nc.clientes_id
        WHERE nc.numero LIKE ? ORDER BY nc.fecha DESC LIMIT ${limit}`,
      [like],
    );
    for (const r of ncs) {
      out.push({
        tipo: 'nota_credito',
        id: Number(r.id_nota_credito),
        label: r.numero,
        sublabel: join([r.cliente_nombre as string, `$${nfDot(r.monto)}`, r.estado as string]),
        path: '/cartera?q=' + rawurlencode(String(r.numero)),
      });
    }

    return out;
  }
}
