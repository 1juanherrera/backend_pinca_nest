import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { ConfiguracionService } from '../configuracion/configuracion.service';

const N = (x: unknown) => Number(x ?? 0);
/** number_format(x, 0, ',', '.') de PHP: entero con separador de miles '.'. */
const nfDot = (n: unknown) => Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Tipos de notificación (réplica de las constantes de NotificacionModel). */
export const TIPO = {
  FACTURA_VENCIMIENTO: 'factura_vencimiento',
  OC_RETRASADA: 'oc_retrasada',
  MP_CRITICA: 'mp_critica',
  REQUISICION_NUEVA: 'requisicion_nueva',
  ITEM_HUERFANO: 'item_huerfano',
  INFO: 'info',
} as const;

interface CrearNotif {
  tipo: string;
  titulo: string;
  mensaje?: string | null;
  link?: string | null;
  user_id?: number | null;
  rol_target?: string | null;
  metadata?: Record<string, unknown>;
  dedup_key?: string;
}

/**
 * Réplica de NotificacionModel::crear (CI4). Dedup opcional por `dedup_key`
 * (ignora si ya existe una con la misma clave en las últimas 24h). Es un
 * side-effect best-effort; devuelve el id creado o false.
 */
@Injectable()
export class NotificacionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cfg: ConfiguracionService,
  ) {}

  /** WHERE group: (user_id=? OR rol_target=? OR rol_target IS NULL). */
  private readonly SCOPE = '(user_id = ? OR rol_target = ? OR rol_target IS NULL)';

  // ── listarPara ──
  async listarPara(
    userId: number,
    rol: string,
    opts: { solo_no_leidas?: unknown; limit?: unknown; offset?: unknown } = {},
  ): Promise<Record<string, unknown>[]> {
    const soloNoLeidas = !!opts.solo_no_leidas;
    const defLim = N(await this.cfg.obtener('limit_default', 30));
    const maxLim = N(await this.cfg.obtener('limit_maximo', 100));
    const limit = Math.min(opts.limit != null ? Math.trunc(Number(opts.limit)) : defLim, maxLim);
    const offset = Math.max(0, opts.offset != null ? Math.trunc(Number(opts.offset)) : 0);
    // limit/offset son enteros validados → inline (evita el quoting de mysql2 en LIMIT).
    const lim = Number.isFinite(limit) ? limit : defLim;
    const off = Number.isFinite(offset) ? offset : 0;

    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM notificaciones
        WHERE ${this.SCOPE} ${soloNoLeidas ? 'AND leida = 0' : ''}
        ORDER BY id DESC LIMIT ${lim} OFFSET ${off}`,
      [userId, rol],
    );
    return rows.map((r) => ({
      ...r,
      id: N(r.id),
      leida: N(r.leida),
      user_id: r.user_id !== null && r.user_id !== undefined ? N(r.user_id) : null,
      metadata: r.metadata && typeof r.metadata === 'object' ? r.metadata : r.metadata ?? null,
    }));
  }

  async contarNoLeidas(userId: number, rol: string): Promise<number> {
    const rows: { n: number }[] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM notificaciones WHERE ${this.SCOPE} AND leida = 0`,
      [userId, rol],
    );
    return N(rows[0].n);
  }

  async marcarLeida(id: number, userId: number, rol: string): Promise<boolean> {
    await this.dataSource.query(
      `UPDATE notificaciones SET leida = 1, leida_at = NOW() WHERE id = ? AND ${this.SCOPE}`,
      [id, userId, rol],
    );
    // CI4 `->update()` devuelve un BOOL (true en éxito), no affectedRows; su `$affected > 0`
    // es siempre true → marcarLeida NUNCA da 404 (el 404 del controller está muerto). Se replica.
    return true;
  }

  async marcarTodasLeidas(userId: number, rol: string): Promise<number> {
    const res: { affectedRows: number } = await this.dataSource.query(
      `UPDATE notificaciones SET leida = 1, leida_at = NOW() WHERE leida = 0 AND ${this.SCOPE}`,
      [userId, rol],
    );
    return res.affectedRows;
  }

  /**
   * Lazy-cron: escanea el estado del sistema y genera notificaciones automáticas
   * (stock crítico, OCs retrasadas, facturas en mora). Dedup por día vía crear().
   */
  async generarAutomaticas(): Promise<void> {
    const day = (await this.dataSource.query(`SELECT DATE_FORMAT(CURDATE(),'%Y-%m-%d') AS d`))[0].d;

    // 1. Stock crítico
    const criticoDias = N(await this.cfg.obtener('stock_critico_dias', 7));
    const criticas: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre,
              COALESCE(SUM(ic.cantidad_disponible), 0) AS stock,
              (SELECT SUM(pid.cantidad) FROM produccion_insumos_detalle pid
                 JOIN preparaciones p ON p.id_preparaciones = pid.preparacion_id
                WHERE pid.item_general_id = ig.id_item_general
                  AND p.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND p.estado != 3) AS consumo_30d
         FROM item_general ig
         LEFT JOIN inventario_capas ic ON ic.item_general_id = ig.id_item_general AND ic.estado = 1
        WHERE ig.deleted_at IS NULL AND ig.tipo = 1
        GROUP BY ig.id_item_general, ig.nombre
       HAVING consumo_30d > 0`,
    );
    for (const mp of criticas) {
      const stock = N(mp.stock);
      const cons30 = N(mp.consumo_30d);
      const diario = cons30 > 0 ? cons30 / 30 : 0;
      const diasRest = diario > 0 ? Math.round(stock / diario) : null;
      if (diasRest !== null && diasRest < criticoDias) {
        await this.crear({
          tipo: TIPO.MP_CRITICA,
          titulo: `Stock crítico: ${mp.nombre}`,
          mensaje: `Quedan ~${diasRest} días al ritmo actual (${cons30} kg consumidos en 30d).`,
          rol_target: 'admin',
          link: '/inventario-global',
          metadata: { item_general_id: N(mp.id_item_general), dias_restantes: diasRest },
          dedup_key: `mp-critica-${mp.id_item_general}-${day}`,
        });
      }
    }

    // 2. OCs Enviadas sin recibir hace >14 días
    const ocs: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT oc.id_orden, oc.numero, oc.fecha, p.nombre_empresa AS proveedor_nombre,
              DATEDIFF(NOW(), oc.fecha) AS dias
         FROM ordenes_compra oc
         LEFT JOIN proveedor p ON p.id_proveedor = oc.proveedor_id
        WHERE oc.estado = 'Enviada' AND oc.deleted_at IS NULL AND oc.fecha < DATE_SUB(NOW(), INTERVAL 14 DAY)
        ORDER BY oc.fecha ASC LIMIT 20`,
    );
    for (const oc of ocs) {
      await this.crear({
        tipo: TIPO.OC_RETRASADA,
        titulo: `OC ${oc.numero} sin recibir`,
        mensaje: `Enviada hace ${oc.dias} días${oc.proveedor_nombre ? ` a ${oc.proveedor_nombre}` : ''}.`,
        rol_target: 'admin',
        link: '/compras',
        metadata: { id_orden: N(oc.id_orden), dias: N(oc.dias) },
        dedup_key: `oc-retrasada-${oc.id_orden}-${day}`,
      });
    }

    // 3. Facturas en mora
    const moraCritica = N(await this.cfg.obtener('mora_critica_dias', 60));
    const facts: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT f.id_facturas, f.numero, f.saldo_pendiente, c.nombre_empresa AS cliente_nombre,
              DATEDIFF(NOW(), f.fecha_vencimiento) AS dias_mora
         FROM facturas f
         LEFT JOIN clientes c ON c.id_clientes = f.cliente_id
        WHERE f.estado IN ('Pendiente','Parcial','Vencida') AND f.deleted_at IS NULL
          AND f.saldo_pendiente > 0 AND f.fecha_vencimiento < DATE_SUB(NOW(), INTERVAL ${moraCritica} DAY)
        ORDER BY f.fecha_vencimiento ASC LIMIT 20`,
    );
    for (const f of facts) {
      const monto = nfDot(f.saldo_pendiente);
      await this.crear({
        tipo: TIPO.FACTURA_VENCIMIENTO,
        titulo: `Factura ${f.numero} en mora`,
        mensaje: `${f.cliente_nombre ? `${f.cliente_nombre} · ` : ''}${f.dias_mora} días vencida · saldo $${monto}`,
        rol_target: 'admin',
        link: '/cartera',
        metadata: { id_facturas: N(f.id_facturas), dias_mora: N(f.dias_mora), saldo: N(f.saldo_pendiente) },
        dedup_key: `factura-mora-${f.id_facturas}-${day}`,
      });
    }
  }

  async crear(data: CrearNotif, m?: EntityManager): Promise<number | false> {
    const runner = m ?? this.dataSource;
    if (!data.tipo || !data.titulo) return false;

    const dedupKey = data.dedup_key ?? null;
    if (dedupKey) {
      const rows: { n: number }[] = await runner.query(
        `SELECT COUNT(*) AS n FROM notificaciones
          WHERE tipo = ? AND JSON_EXTRACT(metadata, '$.dedup_key') = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [data.tipo, dedupKey],
      );
      if (Number(rows[0].n) > 0) return false;
    }

    const metadata: Record<string, unknown> = { ...(data.metadata ?? {}) };
    if (dedupKey) metadata.dedup_key = dedupKey;

    const res: { insertId: number } = await runner.query(
      `INSERT INTO notificaciones (user_id, rol_target, tipo, titulo, mensaje, link, leida, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW())`,
      [
        data.user_id ?? null,
        data.rol_target ?? null,
        data.tipo,
        String(data.titulo).slice(0, 150),
        data.mensaje ?? null,
        data.link ?? null,
        Object.keys(metadata).length ? JSON.stringify(metadata) : null,
      ],
    );
    return res.insertId || false;
  }
}
