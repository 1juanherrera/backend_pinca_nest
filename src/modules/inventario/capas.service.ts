import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';

/** Tipos y referencias de movimiento (valores string EXACTOS de CI4). */
export const MOV = {
  TIPO_ENTRADA: 'ENTRADA',
  TIPO_SALIDA: 'SALIDA',
  TIPO_TRASPASO: 'TRASPASO',
  TIPO_AJUSTE: 'AJUSTE',
  REF_OC: 'ORDEN_COMPRA',
  REF_FACTURA: 'FACTURA_VENTA',
  REF_REMISION: 'REMISION',
  REF_PRODUCCION: 'ORDEN_PRODUCCION',
  REF_TRASPASO: 'TRASPASO_BODEGA',
  REF_AJUSTE: 'AJUSTE_MANUAL',
  REF_ANULACION: 'ANULACION',
} as const;

export interface CrearCapaData {
  item_general_id: number;
  bodegas_id: number;
  proveedor_id: number | null;
  item_proveedor_id: number | null;
  orden_compra_id: number | null;
  cantidad_original: number;
  cantidad_disponible: number;
  costo_unitario: number;
  unidad_compra_id: number | null;
  factor_conversion: number;
  precio_compra: number;
  lote_proveedor: string;
}

export interface Consumo {
  capa_id: number;
  item_general_id: number;
  proveedor_id: number | null;
  cantidad_consumida: number;
  costo_unitario: number;
  costo_total: number;
  bodegas_id: number;
}

export interface RegistrarMovData {
  tipo: string;
  item_general_id: number;
  bodega_id: number | null;
  cantidad: number;
  referencia_tipo?: string;
  referencia_id?: number | null;
  descripcion?: string;
  costo_unitario?: number;
  responsable?: string;
  metadata?: Record<string, unknown>;
  saldo_nuevo?: number;
  saldo_anterior?: number;
}

/**
 * MOTOR DE ESCRITURA DE CAPAS DE COSTO — réplica byte-por-byte de
 * InventarioCapasModel + InventarioModel::ingresarABodega + MovimientoInventarioModel
 * (CI4). Todos los métodos operan sobre el EntityManager de la transacción del caller.
 *
 * ⚠️ CÓDIGO DE COSTEO (dinero): las fórmulas y redondeos (round a 4 decimales,
 * epsilon 0.0001) son idénticos a CI4 — verificado con golden harness de costeo.
 */
@Injectable()
export class CapasService {
  private readonly logger = new Logger('capas');

  private round4(n: number): number {
    return Math.round(n * 10000) / 10000;
  }

  /** INSERT en inventario_capas (fecha_ingreso=NOW(), estado=1). Devuelve id_capa. */
  async crearCapa(m: EntityManager, d: CrearCapaData): Promise<number> {
    const res: { insertId: number } = await m.query(
      `INSERT INTO inventario_capas
         (item_general_id, bodegas_id, proveedor_id, item_proveedor_id, orden_compra_id,
          cantidad_original, cantidad_disponible, costo_unitario, unidad_compra_id,
          factor_conversion, precio_compra, lote_proveedor, fecha_ingreso, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [
        d.item_general_id,
        d.bodegas_id,
        d.proveedor_id,
        d.item_proveedor_id,
        d.orden_compra_id,
        d.cantidad_original,
        d.cantidad_disponible,
        d.costo_unitario,
        d.unidad_compra_id,
        d.factor_conversion,
        d.precio_compra,
        d.lote_proveedor,
      ],
    );
    return res.insertId;
  }

  /**
   * Promedio ponderado sobre capas activas + UPSERT en costos_item. Devuelve el costo.
   * costo = round( Σ(cantidad_disponible × costo_unitario) / Σ(cantidad_disponible), 4 )
   */
  async recalcularPromedioPonderado(
    m: EntityManager,
    itemId: number,
  ): Promise<number> {
    const capas: { cantidad_disponible: string; costo_unitario: string }[] =
      await m.query(
        `SELECT cantidad_disponible, costo_unitario FROM inventario_capas
          WHERE item_general_id = ? AND estado = 1 AND cantidad_disponible > 0
          ORDER BY fecha_ingreso ASC`,
        [itemId],
      );
    let totalDisp = 0;
    let totalPond = 0;
    for (const c of capas) {
      const qty = Number(c.cantidad_disponible);
      totalDisp += qty;
      totalPond += qty * Number(c.costo_unitario);
    }
    const costo = totalDisp > 0 ? this.round4(totalPond / totalDisp) : 0;

    const existe: { n: number }[] = await m.query(
      `SELECT COUNT(*) AS n FROM costos_item WHERE item_general_id = ?`,
      [itemId],
    );
    if (Number(existe[0].n)) {
      await m.query(
        `UPDATE costos_item SET costo_unitario = ?, metodo_calculo = 'PROMEDIO_PONDERADO', fecha_calculo = NOW()
          WHERE item_general_id = ?`,
        [costo, itemId],
      );
    } else {
      await m.query(
        `INSERT INTO costos_item (item_general_id, costo_unitario, metodo_calculo, fecha_calculo, volumen)
         VALUES (?, ?, 'PROMEDIO_PONDERADO', NOW(), 1)`,
        [itemId, costo],
      );
    }
    return costo;
  }

  /** Suma a la tabla `inventario` legacy (UPSERT). Réplica de ingresarABodega. */
  async ingresarABodega(
    m: EntityManager,
    itemId: number,
    bodegaId: number,
    cantidad: number,
  ): Promise<void> {
    const existe: { n: number }[] = await m.query(
      `SELECT COUNT(*) AS n FROM inventario WHERE item_general_id = ? AND bodegas_id = ?`,
      [itemId, bodegaId],
    );
    if (Number(existe[0].n)) {
      await m.query(
        `UPDATE inventario SET cantidad = cantidad + ? WHERE item_general_id = ? AND bodegas_id = ?`,
        [cantidad, itemId, bodegaId],
      );
    } else {
      await m.query(
        `INSERT INTO inventario (item_general_id, bodegas_id, cantidad, estado, tipo, fecha_update)
         VALUES (?, ?, ?, 1, 1, CURDATE())`,
        [itemId, bodegaId, cantidad],
      );
    }
  }

  /** Saldo actual = suma de capas activas (después del movimiento). */
  async saldoActual(
    m: EntityManager,
    itemId: number,
    bodegaId: number | null,
  ): Promise<number> {
    const rows: { t: string | null }[] = await m.query(
      `SELECT SUM(cantidad_disponible) AS t FROM inventario_capas
        WHERE item_general_id = ? AND estado = 1 AND cantidad_disponible > 0
        ${bodegaId !== null ? 'AND bodegas_id = ?' : ''}`,
      bodegaId !== null ? [itemId, bodegaId] : [itemId],
    );
    return Number(rows[0].t ?? 0);
  }

  /** INSERT en movimiento_inventario (audit log). Réplica de registrar(). */
  async registrarMovimiento(
    m: EntityManager,
    d: RegistrarMovData,
  ): Promise<void> {
    if (!d.tipo || !d.item_general_id || d.cantidad == null) {
      this.logger.warn('[MovimientoInventario] registrar() sin datos mínimos');
      return;
    }
    const cantidad = Math.abs(Number(d.cantidad));
    const saldoNuevo =
      d.saldo_nuevo ?? (await this.saldoActual(m, d.item_general_id, d.bodega_id));
    let saldoAnterior: number;
    if (d.saldo_anterior == null) {
      if (d.tipo === MOV.TIPO_ENTRADA) saldoAnterior = saldoNuevo - cantidad;
      else if (d.tipo === MOV.TIPO_SALIDA) saldoAnterior = saldoNuevo + cantidad;
      else {
        this.logger.warn(
          `[MovimientoInventario] tipo ${d.tipo} sin saldo_anterior explícito`,
        );
        saldoAnterior = saldoNuevo;
      }
    } else {
      saldoAnterior = d.saldo_anterior;
    }

    await m.query(
      `INSERT INTO movimiento_inventario
         (tipo_movimiento, cantidad, fecha_movimiento, descripcion, referencia_tipo,
          referencia_id, item_general_id, bodega_id, costo_unitario, saldo_anterior,
          saldo_nuevo, responsable, metadata, created_at)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        d.tipo,
        cantidad,
        d.descripcion ? d.descripcion.substring(0, 255) : null,
        d.referencia_tipo ?? null,
        d.referencia_id ?? null,
        d.item_general_id,
        d.bodega_id,
        d.costo_unitario != null ? Number(d.costo_unitario) : null,
        this.round4(saldoAnterior),
        this.round4(saldoNuevo),
        d.responsable ?? 'sistema',
        d.metadata ? JSON.stringify(d.metadata) : null,
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // CONSUMO FIFO DE CAPAS (réplica de InventarioCapasModel consumir*)
  // ─────────────────────────────────────────────────────────────────────

  /** Lee capas para consumo con SELECT … FOR UPDATE (orden FIFO). */
  private async obtenerCapasParaConsumo(
    m: EntityManager,
    itemId: number,
    bodegaId: number | null,
    proveedorId: number | null,
  ): Promise<Record<string, unknown>[]> {
    let sql = `SELECT id_capa, item_general_id, proveedor_id, bodegas_id,
                      cantidad_disponible, costo_unitario
                 FROM inventario_capas
                WHERE item_general_id = ? AND estado = 1 AND cantidad_disponible > 0`;
    const params: unknown[] = [itemId];
    if (bodegaId !== null) {
      sql += ' AND bodegas_id = ?';
      params.push(bodegaId);
    }
    if (proveedorId !== null) {
      sql += ' AND proveedor_id = ?';
      params.push(proveedorId);
    }
    sql += ' ORDER BY fecha_ingreso ASC FOR UPDATE';
    return m.query(sql, params);
  }

  /** Núcleo de descuento FIFO. Agota capas en orden; lanza si falta stock. */
  private async consumirDeCapas(
    m: EntityManager,
    capas: Record<string, unknown>[],
    cantidadRequerida: number,
  ): Promise<Consumo[]> {
    const consumos: Consumo[] = [];
    let pendiente = cantidadRequerida;

    for (const capa of capas) {
      if (pendiente <= 0.0001) break;
      const disponible = Number(capa.cantidad_disponible);
      const consumir = Math.min(disponible, pendiente);
      const nuevoDisponible = this.round4(disponible - consumir);
      const capaId = Number(capa.id_capa);

      if (nuevoDisponible <= 0.0001) {
        await m.query(
          `UPDATE inventario_capas SET cantidad_disponible = 0, estado = 0 WHERE id_capa = ?`,
          [capaId],
        );
      } else {
        await m.query(
          `UPDATE inventario_capas SET cantidad_disponible = ? WHERE id_capa = ?`,
          [Math.max(nuevoDisponible, 0), capaId],
        );
      }

      const costo = Number(capa.costo_unitario);
      consumos.push({
        capa_id: capaId,
        item_general_id: Number(capa.item_general_id),
        proveedor_id: capa.proveedor_id ? Number(capa.proveedor_id) : null,
        cantidad_consumida: this.round4(consumir),
        costo_unitario: costo,
        costo_total: this.round4(consumir * costo),
        bodegas_id: Number(capa.bodegas_id),
      });
      pendiente -= consumir;
    }

    if (pendiente > 0.0001) {
      const consumido = this.round4(cantidadRequerida - pendiente);
      throw new Error(
        `Stock insuficiente. Requerido: ${cantidadRequerida}, Disponible: ${consumido}, Faltante: ${this.round4(pendiente)}.`,
      );
    }
    return consumos;
  }

  /** FIFO global (opcionalmente por bodega). */
  async consumirCapasFIFO(
    m: EntityManager,
    itemId: number,
    cantidad: number,
    bodegaId: number | null = null,
  ): Promise<Consumo[]> {
    const capas = await this.obtenerCapasParaConsumo(m, itemId, bodegaId, null);
    return this.consumirDeCapas(m, capas, cantidad);
  }

  /** FIFO restringido a un proveedor. */
  async consumirCapasPorProveedor(
    m: EntityManager,
    itemId: number,
    cantidad: number,
    proveedorId: number,
    bodegaId: number | null = null,
  ): Promise<Consumo[]> {
    const capas = await this.obtenerCapasParaConsumo(
      m,
      itemId,
      bodegaId,
      proveedorId,
    );
    return this.consumirDeCapas(m, capas, cantidad);
  }

  /** ¿el item tiene capas activas con stock? */
  async tieneCapas(m: EntityManager, itemId: number): Promise<boolean> {
    const rows: { n: number }[] = await m.query(
      `SELECT COUNT(*) AS n FROM inventario_capas WHERE item_general_id = ? AND estado = 1 AND cantidad_disponible > 0`,
      [itemId],
    );
    return Number(rows[0].n) > 0;
  }

  /** Consumo MANUAL: descuenta cantidades exactas de capas específicas (con FOR UPDATE). */
  async consumirCapasManual(
    m: EntityManager,
    seleccion: { capa_id: number; cantidad: number }[],
    expectedItemId: number | null = null,
  ): Promise<Consumo[]> {
    const consumos: Consumo[] = [];
    for (const sel of seleccion) {
      const capaId = Number(sel.capa_id);
      const cantidad = Number(sel.cantidad);
      if (cantidad <= 0) continue;

      const rows: Record<string, unknown>[] = await m.query(
        `SELECT id_capa, item_general_id, proveedor_id, bodegas_id, cantidad_disponible, costo_unitario, estado
           FROM inventario_capas WHERE id_capa = ? AND estado = 1 FOR UPDATE`,
        [capaId],
      );
      const capa = rows[0];
      if (!capa) throw new Error(`La capa #${capaId} no existe o está agotada.`);
      if (
        expectedItemId !== null &&
        Number(capa.item_general_id) !== expectedItemId
      ) {
        throw new Error(
          `La capa #${capaId} pertenece al item #${capa.item_general_id}, no al item #${expectedItemId}.`,
        );
      }
      const disponible = Number(capa.cantidad_disponible);
      if (cantidad > disponible + 0.0001) {
        throw new Error(
          `La cantidad solicitada de la capa #${capaId} (${cantidad}) supera su disponibilidad (${disponible}).`,
        );
      }
      const consumir = Math.min(cantidad, disponible);
      const nuevoDisponible = this.round4(disponible - consumir);
      if (nuevoDisponible <= 0.0001) {
        await m.query(
          `UPDATE inventario_capas SET cantidad_disponible = 0, estado = 0 WHERE id_capa = ?`,
          [capaId],
        );
      } else {
        await m.query(
          `UPDATE inventario_capas SET cantidad_disponible = ? WHERE id_capa = ?`,
          [Math.max(nuevoDisponible, 0), capaId],
        );
      }
      const costo = Number(capa.costo_unitario);
      consumos.push({
        capa_id: capaId,
        item_general_id: Number(capa.item_general_id),
        proveedor_id: capa.proveedor_id ? Number(capa.proveedor_id) : null,
        cantidad_consumida: this.round4(consumir),
        costo_unitario: costo,
        costo_total: this.round4(consumir * costo),
        bodegas_id: Number(capa.bodegas_id),
      });
    }
    return consumos;
  }

  /** Escribe los consumos de una preparación (preparacion_consumo_capas). */
  async registrarConsumos(
    m: EntityManager,
    preparacionId: number,
    consumos: Consumo[],
  ): Promise<void> {
    for (const c of consumos) {
      await m.query(
        `INSERT INTO preparacion_consumo_capas
           (preparacion_id, capa_id, item_general_id, cantidad_consumida, costo_unitario, costo_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          preparacionId,
          c.capa_id,
          c.item_general_id,
          c.cantidad_consumida,
          c.costo_unitario,
          c.costo_total,
        ],
      );
    }
  }

  /** Restaura las capas consumidas por una preparación (al cancelar). */
  async restaurarCapas(m: EntityManager, preparacionId: number): Promise<void> {
    const consumos: { capa_id: number; cantidad_consumida: string }[] =
      await m.query(
        `SELECT capa_id, cantidad_consumida FROM preparacion_consumo_capas WHERE preparacion_id = ?`,
        [preparacionId],
      );
    for (const c of consumos) {
      await m.query(
        `UPDATE inventario_capas SET cantidad_disponible = cantidad_disponible + ?, estado = 1 WHERE id_capa = ?`,
        [Number(c.cantidad_consumida), c.capa_id],
      );
    }
    await m.query(
      `DELETE FROM preparacion_consumo_capas WHERE preparacion_id = ?`,
      [preparacionId],
    );
  }

  /** Resuelve el código de lote de una OC (manual → reusar → generar). */
  async resolverLoteProveedor(
    m: EntityManager,
    idOrden: number,
    loteInput?: string | null,
  ): Promise<string> {
    const manual = String(loteInput ?? '').trim();
    if (manual !== '') return manual;

    const rows: { lote_proveedor: string }[] = await m.query(
      `SELECT lote_proveedor FROM inventario_capas
        WHERE orden_compra_id = ? AND lote_proveedor IS NOT NULL AND TRIM(lote_proveedor) != ''
        ORDER BY fecha_ingreso ASC LIMIT 1`,
      [idOrden],
    );
    if (rows.length && rows[0].lote_proveedor) return rows[0].lote_proveedor;

    // date('Ymd') del server (UTC, como la BD)
    const d = new Date();
    const ymd =
      d.getUTCFullYear().toString() +
      String(d.getUTCMonth() + 1).padStart(2, '0') +
      String(d.getUTCDate()).padStart(2, '0');
    return `LOT-OC${idOrden}-${ymd}`;
  }
}
