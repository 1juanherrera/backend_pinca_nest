import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ConfiguracionService } from '../configuracion/configuracion.service';

const N = (x: unknown) => Number(x ?? 0);

/** Réplica fiel de SaludSistemaController (CI4). Dashboard de calidad de datos (read-only). */
@Injectable()
export class SaludSistemaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cfg: ConfiguracionService,
  ) {}

  private async scalar(sql: string): Promise<number> {
    return N((await this.dataSource.query(sql))[0].n);
  }

  /** 1. Cobertura de proveedores sobre materias primas usadas en fórmulas activas. */
  private async calcularCobertura(): Promise<{ mps_totales: number; mps_cubiertas: number; pct: number }> {
    const [mpsEnFormulas, mpsCubiertas] = await Promise.all([
      this.scalar(`
        SELECT COUNT(DISTINCT igf.item_general_id) AS n
          FROM item_general_formulaciones igf
          INNER JOIN formulaciones f ON f.id_formulaciones = igf.formulaciones_id AND f.estado = 1
          INNER JOIN item_general ig ON ig.id_item_general = igf.item_general_id AND ig.deleted_at IS NULL`),
      this.scalar(`
        SELECT COUNT(DISTINCT igf.item_general_id) AS n
          FROM item_general_formulaciones igf
          INNER JOIN formulaciones f ON f.id_formulaciones = igf.formulaciones_id AND f.estado = 1
          INNER JOIN item_general ig ON ig.id_item_general = igf.item_general_id AND ig.deleted_at IS NULL
          INNER JOIN item_proveedor ip ON ip.item_general_id = igf.item_general_id
            AND ip.disponible = 1 AND ip.deleted_at IS NULL`),
    ]);
    return {
      mps_totales: mpsEnFormulas,
      mps_cubiertas: mpsCubiertas,
      pct: mpsEnFormulas > 0 ? Math.round((mpsCubiertas / mpsEnFormulas) * 100 * 10) / 10 : 0,
    };
  }

  /** 2. MPs con stock pero sin ningún movimiento en los últimos 90 días. */
  private async fetchMpsSinMovimiento(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`
      SELECT ig.id_item_general, ig.nombre, ig.codigo, COALESCE(SUM(ic.cantidad_disponible), 0) AS stock_kg
        FROM item_general ig
        LEFT JOIN inventario_capas ic ON ic.item_general_id = ig.id_item_general AND ic.estado = 1
       WHERE ig.tipo = 1 AND ig.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM movimiento_inventario mi
                          WHERE mi.item_general_id = ig.id_item_general
                            AND mi.fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 90 DAY))
       GROUP BY ig.id_item_general, ig.nombre, ig.codigo
      HAVING stock_kg > 0 ORDER BY stock_kg DESC LIMIT 50`);
  }

  /** 3. Productos (tipo=0) sin ninguna fórmula activa vinculada. */
  private async fetchProductosSinFormula(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`
      SELECT ig.id_item_general, ig.nombre, ig.codigo
        FROM item_general ig
        LEFT JOIN formulaciones f ON f.item_general_id = ig.id_item_general AND f.estado = 1
       WHERE ig.tipo = 0 AND ig.deleted_at IS NULL AND f.id_formulaciones IS NULL
       ORDER BY ig.nombre LIMIT 50`);
  }

  /** 4. OCs en estado Enviada hace más de N días sin recibir (umbral configurable). */
  private async fetchOcsRetrasadas(ocDemora: number): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`
      SELECT oc.id_orden, oc.numero, oc.fecha, oc.fecha_esperada, oc.total, p.nombre_empresa,
             DATEDIFF(NOW(), oc.fecha) AS dias_pendiente
        FROM ordenes_compra oc
        LEFT JOIN proveedor p ON p.id_proveedor = oc.proveedor_id
       WHERE oc.estado = 'Enviada' AND oc.deleted_at IS NULL AND oc.fecha < DATE_SUB(CURDATE(), INTERVAL ${ocDemora} DAY)
       ORDER BY oc.fecha ASC LIMIT 30`);
  }

  /** 5. Facturas con saldo pendiente en mora crítica (umbral configurable). */
  private async fetchFacturasEnMora(moraCriticaDias: number): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`
      SELECT f.id_facturas, f.numero, f.fecha_emision, f.total, f.saldo_pendiente,
             c.nombre_empresa, c.nombre_encargado, DATEDIFF(NOW(), f.fecha_emision) AS dias_mora
        FROM facturas f
        LEFT JOIN clientes c ON c.id_clientes = f.cliente_id
       WHERE f.deleted_at IS NULL AND f.estado IN ('Pendiente','Parcial','Vencida')
         AND f.saldo_pendiente > 0 AND f.fecha_emision < DATE_SUB(CURDATE(), INTERVAL ${moraCriticaDias} DAY)
       ORDER BY f.fecha_emision ASC LIMIT 30`);
  }

  /** 6. Ítems archivados (soft-deleted) que todavía tienen stock activo en capas. */
  private async fetchArchivadosConStock(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`
      SELECT ig.id_item_general, ig.nombre, ig.codigo, SUM(ic.cantidad_disponible) AS stock_kg
        FROM item_general ig
        INNER JOIN inventario_capas ic ON ic.item_general_id = ig.id_item_general AND ic.estado = 1
       WHERE ig.deleted_at IS NOT NULL AND ic.cantidad_disponible > 0
       GROUP BY ig.id_item_general, ig.nombre, ig.codigo ORDER BY stock_kg DESC LIMIT 20`);
  }

  /** Score global 0-100: % de los 6 checks que NO tienen issues activos. */
  private calcularScore(issues: Record<string, number>): { score: number; issuesActivos: number; totalChecks: number } {
    const totalChecks = Object.keys(issues).length;
    const issuesActivos = Object.values(issues).reduce((a, b) => a + b, 0);
    const score = totalChecks > 0 ? Math.round(((totalChecks - issuesActivos) / totalChecks) * 100) : 100;
    return { score, issuesActivos, totalChecks };
  }

  async index(): Promise<Record<string, unknown>> {
    const ocDemora = Math.max(1, N(await this.cfg.obtener('oc_demora_dias', 14)));
    const moraCriticaDias = N(await this.cfg.obtener('mora_critica_dias', 60));

    const [
      cobertura, mpsSinMovimiento, productosSinFormula,
      ocsRetrasadas, facturasEnMora, archivadosConStock,
    ] = await Promise.all([
      this.calcularCobertura(),
      this.fetchMpsSinMovimiento(),
      this.fetchProductosSinFormula(),
      this.fetchOcsRetrasadas(ocDemora),
      this.fetchFacturasEnMora(moraCriticaDias),
      this.fetchArchivadosConStock(),
    ]);

    const { score, issuesActivos, totalChecks } = this.calcularScore({
      cobertura_baja: cobertura.pct < 80 ? 1 : 0,
      mps_sin_movimiento: mpsSinMovimiento.length > 0 ? 1 : 0,
      productos_sin_formula: productosSinFormula.length > 0 ? 1 : 0,
      ocs_retrasadas: ocsRetrasadas.length > 0 ? 1 : 0,
      facturas_en_mora: facturasEnMora.length > 0 ? 1 : 0,
      archivados_con_stock: archivadosConStock.length > 0 ? 1 : 0,
    });

    return {
      score,
      issues_activos: issuesActivos,
      total_checks: totalChecks,
      cobertura,
      mps_sin_movimiento_90d: mpsSinMovimiento.map((r) => ({
        id: N(r.id_item_general), nombre: r.nombre, codigo: r.codigo, stock_kg: N(r.stock_kg),
      })),
      productos_sin_formula: productosSinFormula.map((r) => ({
        id: N(r.id_item_general), nombre: r.nombre, codigo: r.codigo,
      })),
      ocs_retrasadas: ocsRetrasadas.map((r) => ({
        id: N(r.id_orden), numero: r.numero, fecha: r.fecha, fecha_esperada: r.fecha_esperada,
        total: N(r.total), proveedor: r.nombre_empresa, dias_pendiente: N(r.dias_pendiente),
      })),
      facturas_en_mora: facturasEnMora.map((r) => ({
        id: N(r.id_facturas), numero: r.numero, fecha_emision: r.fecha_emision, total: N(r.total),
        saldo_pendiente: N(r.saldo_pendiente),
        cliente: r.nombre_empresa || r.nombre_encargado || '—',
        dias_mora: N(r.dias_mora),
      })),
      archivados_con_stock: archivadosConStock.map((r) => ({
        id: N(r.id_item_general), nombre: r.nombre, codigo: r.codigo, stock_kg: N(r.stock_kg),
      })),
      umbral_mora_dias: moraCriticaDias,
    };
  }
}
