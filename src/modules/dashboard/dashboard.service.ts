import { HttpException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CarteraService } from '../cartera/cartera.service';
import { SincronizacionService } from '../sincronizacion/sincronizacion.service';

const N = (x: unknown) => Number(x ?? 0);
const round = (x: number, d: number) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};

/**
 * Panel Principal — réplica de DashboardController (CI4). Agrega ~13 KPIs
 * reusando CarteraService (resumen/aging) + SincronizacionService.stats(false)
 * + 9 queries propias, todas O(1)/indexadas. Bounds de mes vía SQL (server TZ).
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger('DashboardController');

  constructor(
    private readonly dataSource: DataSource,
    private readonly cartera: CarteraService,
    private readonly sincronizacion: SincronizacionService,
  ) {}

  async index(): Promise<Record<string, unknown>> {
    try {
      const cartera = await this.cartera.resumen();
      const aging = (await this.cartera.aging()) as {
        total_mora: number;
        grupos: Record<string, { monto: number }>;
      };
      // stats(false): salta duplicados (Levenshtein) — el dashboard debe ser <500ms.
      const sincStats = await this.sincronizacion.stats(false);

      const nowRows: { g: string }[] = await this.dataSource.query(
        `SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS g`,
      );

      return {
        success: true,
        data: {
          cartera,
          aging_resumen: {
            total_mora: aging.total_mora,
            corriente: aging.grupos.corriente.monto,
            d_1_30: aging.grupos.dias_1_30.monto,
            d_31_60: aging.grupos.dias_31_60.monto,
            d_60_mas: aging.grupos.dias_60_mas.monto,
          },
          top_deudores: await this.topDeudores(5),
          sincronizacion: sincStats,
          ventas_mes: await this.ventasMes(),
          cotizaciones: await this.cotizacionesPendientes(),
          ocs_pendientes: await this.ocsPendientes(),
          mp_criticas: await this.mpCriticas(7, 10),
          produccion_curso: await this.produccionEnCurso(),
          movimientos_hoy: await this.movimientosHoy(),
          top_descripciones: await this.topDescripcionesMes(5),
          rentabilidad: await this.rentabilidadMes(),
          generated_at: nowRows[0].g,
        },
      };
    } catch (e) {
      this.logger.error((e as Error).message);
      throw new HttpException({ success: false, message: 'Error al consolidar el dashboard.' }, 500);
    }
  }

  private topDeudores(limit = 5): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT f.cliente_id, c.nombre_empresa, c.nombre_encargado,
              SUM(f.saldo_pendiente) AS total_deuda,
              COUNT(f.id_facturas)   AS facturas_count,
              MAX(DATEDIFF(CURDATE(), f.fecha_vencimiento)) AS max_dias_mora
         FROM facturas f
         LEFT JOIN clientes c ON c.id_clientes = f.cliente_id
        WHERE f.estado IN ('Pendiente','Parcial','Vencida')
          AND f.saldo_pendiente > 0 AND f.deleted_at IS NULL
        GROUP BY f.cliente_id, c.nombre_empresa, c.nombre_encargado
        ORDER BY total_deuda DESC LIMIT ?`,
      [limit],
    );
  }

  private async ventasMes(): Promise<Record<string, number>> {
    const r = (await this.dataSource.query(
      `SELECT COUNT(*) AS facturas_count,
              COALESCE(SUM(total),0) AS total_facturado,
              COALESCE(SUM(saldo_pendiente),0) AS saldo_pendiente_mes,
              SUM(CASE WHEN estado='Pagada' THEN 1 ELSE 0 END) AS pagadas,
              SUM(CASE WHEN estado='Pendiente' THEN 1 ELSE 0 END) AS pendientes,
              SUM(CASE WHEN estado='Anulada' THEN 1 ELSE 0 END) AS anuladas
         FROM facturas
        WHERE DATE(fecha_emision) BETWEEN DATE_FORMAT(CURDATE(),'%Y-%m-01') AND LAST_DAY(CURDATE())
          AND deleted_at IS NULL`,
    ))[0] ?? {};
    return {
      facturas_count: N(r.facturas_count),
      total_facturado: N(r.total_facturado),
      saldo_pendiente: N(r.saldo_pendiente_mes),
      pagadas: N(r.pagadas),
      pendientes: N(r.pendientes),
      anuladas: N(r.anuladas),
    };
  }

  private async cotizacionesPendientes(): Promise<Record<string, number>> {
    const r = (await this.dataSource.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN estado='Borrador' THEN 1 ELSE 0 END) AS borradores,
              SUM(CASE WHEN estado='Enviada' THEN 1 ELSE 0 END) AS enviadas,
              COALESCE(SUM(CASE WHEN estado IN ('Borrador','Enviada') THEN total ELSE 0 END),0) AS valor_total
         FROM cotizaciones
        WHERE estado IN ('Borrador','Enviada') AND deleted_at IS NULL`,
    ))[0] ?? {};
    return {
      total: N(r.total),
      borradores: N(r.borradores),
      enviadas: N(r.enviadas),
      valor_total: N(r.valor_total),
    };
  }

  private async ocsPendientes(): Promise<Record<string, number>> {
    const r = (await this.dataSource.query(
      `SELECT COUNT(DISTINCT oc.id_orden) AS total,
              COALESCE(SUM(oc.total),0) AS valor_total,
              COALESCE(SUM(oc.total * (1 + COALESCE(oc.iva_pct,0)/100)),0) AS valor_total_con_iva,
              COUNT(DISTINCT CASE WHEN oc.fecha_esperada < CURDATE() THEN oc.id_orden END) AS retrasadas
         FROM ordenes_compra oc
        WHERE oc.estado='Enviada' AND oc.deleted_at IS NULL`,
    ))[0] ?? {};
    return {
      total: N(r.total),
      valor_total: N(r.valor_total),
      valor_total_con_iva: N(r.valor_total_con_iva),
      retrasadas: N(r.retrasadas),
    };
  }

  private async mpCriticas(umbralDias = 7, limit = 10): Promise<Record<string, unknown>> {
    const items: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre, ig.codigo,
              COALESCE(SUM(ic.cantidad_disponible),0) AS stock_total
         FROM item_general ig
         LEFT JOIN inventario_capas ic ON ic.item_general_id = ig.id_item_general AND ic.estado = 1
        WHERE ig.tipo = 1
        GROUP BY ig.id_item_general, ig.nombre, ig.codigo`,
    );
    const consumo: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pid.item_general_id, SUM(pid.cantidad) AS consumo_30d
         FROM produccion_insumos_detalle pid
         JOIN preparaciones p ON p.id_preparaciones = pid.preparacion_id
        WHERE p.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND p.estado != 3
        GROUP BY pid.item_general_id`,
    );
    const consumoMap = new Map<number, number>();
    for (const c of consumo) consumoMap.set(N(c.item_general_id), N(c.consumo_30d));

    const criticas: Record<string, unknown>[] = [];
    for (const it of items) {
      const stock = N(it.stock_total);
      const consumo30 = consumoMap.get(N(it.id_item_general)) ?? 0;
      const diario = consumo30 > 0 ? consumo30 / 30 : 0;
      const dias = diario > 0 ? Math.round(stock / diario) : null;
      if (dias !== null && dias < umbralDias) {
        criticas.push({
          id_item_general: N(it.id_item_general),
          nombre: it.nombre,
          codigo: it.codigo,
          stock_total: stock,
          consumo_diario: round(diario, 4),
          dias_restantes: dias,
        });
      }
    }
    criticas.sort((a, b) => (a.dias_restantes as number) - (b.dias_restantes as number));
    return { total: criticas.length, top: criticas.slice(0, limit) };
  }

  private async produccionEnCurso(): Promise<Record<string, number>> {
    const r = (await this.dataSource.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(cantidad),0) AS volumen_kg
         FROM preparaciones WHERE estado = 1`,
    ))[0] ?? {};
    return { total: N(r.total), volumen_kg: N(r.volumen_kg) };
  }

  private async movimientosHoy(): Promise<Record<string, number>> {
    const r = (await this.dataSource.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN tipo_movimiento='ENTRADA' THEN 1 ELSE 0 END) AS entradas,
              SUM(CASE WHEN tipo_movimiento='SALIDA' THEN 1 ELSE 0 END) AS salidas,
              SUM(CASE WHEN tipo_movimiento='TRASPASO' THEN 1 ELSE 0 END) AS traspasos,
              SUM(CASE WHEN tipo_movimiento='AJUSTE' THEN 1 ELSE 0 END) AS ajustes
         FROM movimiento_inventario WHERE DATE(fecha_movimiento) = CURDATE()`,
    ))[0] ?? {};
    return {
      total: N(r.total),
      entradas: N(r.entradas),
      salidas: N(r.salidas),
      traspasos: N(r.traspasos),
      ajustes: N(r.ajustes),
    };
  }

  private topDescripcionesMes(limit = 5): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT fd.descripcion, SUM(fd.cantidad) AS unidades, SUM(fd.subtotal) AS monto_total
         FROM facturas_detalle fd
         JOIN facturas f ON f.id_facturas = fd.facturas_id
        WHERE DATE(f.fecha_emision) BETWEEN DATE_FORMAT(CURDATE(),'%Y-%m-01') AND LAST_DAY(CURDATE())
          AND f.estado != 'Anulada' AND f.deleted_at IS NULL
        GROUP BY fd.descripcion ORDER BY monto_total DESC LIMIT ?`,
      [limit],
    );
  }

  private async rentabilidadMes(): Promise<Record<string, number>> {
    const ing = (await this.dataSource.query(
      `SELECT COALESCE(SUM(subtotal),0) AS total FROM facturas
        WHERE DATE(fecha_emision) BETWEEN DATE_FORMAT(CURDATE(),'%Y-%m-01') AND LAST_DAY(CURDATE())
          AND estado != 'Anulada' AND deleted_at IS NULL`,
    ))[0];
    const cos = (await this.dataSource.query(
      `SELECT COALESCE(SUM(pid.subtotal),0) AS total
         FROM produccion_insumos_detalle pid
         JOIN preparaciones p ON p.id_preparaciones = pid.preparacion_id
        WHERE DATE(p.fecha_creacion) BETWEEN DATE_FORMAT(CURDATE(),'%Y-%m-01') AND LAST_DAY(CURDATE())
          AND p.estado != 3`,
    ))[0];
    const ingresos = N(ing.total);
    const costos = N(cos.total);
    const utilidad = ingresos - costos;
    const margen_pct = ingresos > 0 ? round((utilidad / ingresos) * 100, 2) : 0;
    return { ingresos, costos, utilidad, margen_pct };
  }
}
