import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ConfiguracionService } from '../configuracion/configuracion.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';

interface Filtros {
  page?: string;
  per_page?: string;
  ip?: string;
  usuario?: string;
  desde?: string;
  hasta?: string;
  tipo?: string;
  referencia_tipo?: string;
  item?: string;
  responsable?: string;
}

/** Réplica fiel de AuditoriaController (CI4). Solo lectura, admin/superadmin, paginado. */
@Injectable()
export class AuditoriaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cfg: ConfiguracionService,
  ) {}

  private requireAdmin(user: JwtUser): void {
    if (!['admin', 'superadmin'].includes(user.rol)) {
      throw new HttpException({ msg: 'Solo administradores pueden ver el log de auditoría.' }, 403);
    }
  }

  private async paginacion(f: Filtros): Promise<{ page: number; per: number; offset: number }> {
    const maxPer = Number(await this.cfg.obtener('max_per_page', 200));
    const defPer = Number(await this.cfg.obtener('page_size_default', 50));
    const page = Math.max(1, Math.trunc(Number(f.page) || 0));
    const rawPer = Math.trunc(Number(f.per_page) || 0) || defPer;
    const per = Math.min(maxPer, Math.max(10, rawPer));
    return { page, per, offset: (page - 1) * per };
  }

  // ── GET /auditoria/login-attempts ──
  async loginAttempts(user: JwtUser, f: Filtros): Promise<Record<string, unknown>> {
    this.requireAdmin(user);
    const { page, per, offset } = await this.paginacion(f);

    const where: string[] = [];
    const params: unknown[] = [];
    const ip = (f.ip ?? '').trim();
    const usr = (f.usuario ?? '').trim();
    const desde = (f.desde ?? '').trim();
    const hasta = (f.hasta ?? '').trim();
    if (ip) { where.push('ip_address LIKE ?'); params.push(`%${ip}%`); }
    if (usr) { where.push('username_attempt LIKE ?'); params.push(`%${usr}%`); }
    if (desde) { where.push('created_at >= ?'); params.push(`${desde} 00:00:00`); }
    if (hasta) { where.push('created_at <= ?'); params.push(`${hasta} 23:59:59`); }
    const wsql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const total = Number(
      (await this.dataSource.query(`SELECT COUNT(*) AS n FROM login_attempts ${wsql}`, params))[0].n,
    );
    const rows = await this.dataSource.query(
      `SELECT * FROM login_attempts ${wsql} ORDER BY created_at DESC LIMIT ${per} OFFSET ${offset}`,
      params,
    );
    return { data: rows, meta: { page, per_page: per, total, pages: Math.ceil(total / per) } };
  }

  // ── GET /auditoria/movimientos ──
  async movimientos(user: JwtUser, f: Filtros): Promise<Record<string, unknown>> {
    this.requireAdmin(user);
    const { page, per, offset } = await this.paginacion(f);

    const where: string[] = [];
    const params: unknown[] = [];
    const tipo = (f.tipo ?? '').trim();
    const ref = (f.referencia_tipo ?? '').trim();
    const item = (f.item ?? '').trim();
    const resp = (f.responsable ?? '').trim();
    const desde = (f.desde ?? '').trim();
    const hasta = (f.hasta ?? '').trim();
    if (tipo) { where.push('mi.tipo_movimiento = ?'); params.push(tipo); }
    if (ref) { where.push('mi.referencia_tipo = ?'); params.push(ref); }
    if (item) { where.push('(ig.nombre LIKE ? OR ig.codigo LIKE ?)'); params.push(`%${item}%`, `%${item}%`); }
    if (resp) { where.push('mi.responsable LIKE ?'); params.push(`%${resp}%`); }
    if (desde) { where.push('mi.fecha_movimiento >= ?'); params.push(`${desde} 00:00:00`); }
    if (hasta) { where.push('mi.fecha_movimiento <= ?'); params.push(`${hasta} 23:59:59`); }
    const wsql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const from = `
      FROM movimiento_inventario mi
      LEFT JOIN item_general ig ON ig.id_item_general = mi.item_general_id
      LEFT JOIN bodegas b       ON b.id_bodegas       = mi.bodega_id
      ${wsql}`;

    const total = Number((await this.dataSource.query(`SELECT COUNT(*) AS n ${from}`, params))[0].n);
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT mi.*, ig.nombre AS item_nombre, ig.codigo AS item_codigo, b.nombre AS bodega_nombre
       ${from} ORDER BY mi.fecha_movimiento DESC LIMIT ${per} OFFSET ${offset}`,
      params,
    );
    for (const r of rows) {
      if (r.metadata && typeof r.metadata === 'string') {
        try { r.metadata = JSON.parse(r.metadata as string); } catch { r.metadata = null; }
      }
    }
    return { data: rows, meta: { page, per_page: per, total, pages: Math.ceil(total / per) } };
  }
}
