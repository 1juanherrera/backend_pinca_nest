import { HttpException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { NumeracionService } from '../numeracion/numeracion.service';

const round = (x: number, d: number) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};
/** number_format(n, 2) de PHP: 2 decimales + separador de miles con coma. */
const numberFormat = (n: number, dec: number): string => {
  const parts = Number(n).toFixed(dec).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

/** Réplica fiel de RequisicionesCompraModel + Controller (CI4). MRP + convertir a OC. */
@Injectable()
export class RequisicionesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly numeracion: NumeracionService,
  ) {}

  private fail(message: string, status: number): HttpException {
    return new HttpException({ message }, status);
  }

  // ── verificarDisponibilidad ──
  async verificarDisponibilidad(
    itemId: number,
    volumenGalones: number,
    unidadId: number,
  ): Promise<Record<string, unknown>> {
    const unidad = (await this.dataSource.query(
      `SELECT escala FROM unidad WHERE id_unidad = ? AND estados = 1`,
      [unidadId],
    ))[0];
    if (!unidad) throw this.fail(`Unidad con ID ${unidadId} no encontrada o inactiva.`, 422);

    const formulacion = (await this.dataSource.query(
      `SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`,
      [itemId],
    ))[0];
    if (!formulacion) throw this.fail('El item no tiene una formulación activa.', 422);

    const ingredientes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.item_general_id, igf.cantidad AS cantidad_base, ig.nombre, ig.codigo
         FROM item_general_formulaciones igf
         INNER JOIN item_general ig ON ig.id_item_general = igf.item_general_id
        WHERE igf.formulaciones_id = ?`,
      [formulacion.id_formulaciones],
    );
    if (!ingredientes.length) throw this.fail('La formulación no tiene ingredientes.', 422);

    const itemCosto = (await this.dataSource.query(
      `SELECT COALESCE(NULLIF(volumen, 0), 1) AS volumen_base FROM costos_item WHERE item_general_id = ? LIMIT 1`,
      [itemId],
    ))[0];
    const volumenBase = Number(itemCosto?.volumen_base ?? 1);
    const factorVolumen = volumenBase > 0 ? volumenGalones / volumenBase : 1;

    const materiales: Record<string, unknown>[] = [];
    let todosDisponibles = true;

    for (const ing of ingredientes) {
      const ingId = Number(ing.item_general_id);
      const cantidadNecesaria = round(Number(ing.cantidad_base) * factorVolumen, 4);
      const stock = (await this.dataSource.query(
        `SELECT COALESCE(SUM(cantidad_disponible), 0) AS total
           FROM inventario_capas WHERE item_general_id = ? AND estado = 1`,
        [ingId],
      ))[0];
      const cantidadDisponible = Number(stock?.total ?? 0);
      const deficit = Math.max(0, cantidadNecesaria - cantidadDisponible);
      const tieneDeficit = deficit > 0;
      if (tieneDeficit) todosDisponibles = false;

      materiales.push({
        item_general_id: ingId,
        nombre: ing.nombre,
        codigo: ing.codigo,
        cantidad_necesaria: cantidadNecesaria,
        cantidad_disponible: cantidadDisponible,
        deficit: round(deficit, 4),
        tiene_deficit: tieneDeficit,
        proveedores: tieneDeficit ? await this.getProveedoresPorItem(ingId) : [],
      });
    }

    return { todos_disponibles: todosDisponibles, materiales };
  }

  private async getProveedoresPorItem(itemGeneralId: number): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ip.id_item_proveedor, ip.nombre AS item_proveedor_nombre,
              uc.nombre AS unidad_empaque, ip.precio_unitario, ip.precio_con_iva,
              p.id_proveedor, p.nombre_empresa, p.nombre_encargado, p.telefono, p.email
         FROM item_proveedor ip
         INNER JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
         LEFT  JOIN unidad uc ON uc.id_unidad = ip.unidad_compra_id
        WHERE ip.item_general_id = ? AND ip.disponible = 1 AND ip.deleted_at IS NULL
        ORDER BY ip.precio_unitario ASC`,
      [itemGeneralId],
    );
    return rows.map((r) => ({
      id_item_proveedor: r.id_item_proveedor,
      item_proveedor_nombre: r.item_proveedor_nombre,
      unidad_empaque: r.unidad_empaque,
      precio_unitario: Number(r.precio_unitario),
      precio_con_iva: Number(r.precio_con_iva),
      id_proveedor: r.id_proveedor,
      nombre_empresa: r.nombre_empresa,
      nombre_encargado: r.nombre_encargado,
      telefono: r.telefono,
      email: r.email,
    }));
  }

  private async pickMejorProveedor(itemGeneralId: number): Promise<Record<string, number | string> | null> {
    const row = (await this.dataSource.query(
      `SELECT ip.id_item_proveedor, ip.precio_unitario, ip.factor_conversion,
              p.id_proveedor, p.nombre_empresa,
              CASE WHEN ip.factor_conversion > 0 THEN ip.precio_unitario / ip.factor_conversion
                   ELSE ip.precio_unitario END AS precio_kg
         FROM item_proveedor ip
         JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
        WHERE ip.item_general_id = ? AND ip.disponible = 1 AND ip.deleted_at IS NULL
        ORDER BY precio_kg ASC LIMIT 1`,
      [itemGeneralId],
    ))[0];
    if (!row) return null;
    return {
      id_item_proveedor: Number(row.id_item_proveedor),
      id_proveedor: Number(row.id_proveedor),
      nombre_empresa: row.nombre_empresa,
      precio_unitario: Number(row.precio_unitario),
      factor_conversion: Number(row.factor_conversion),
      precio_kg: Number(row.precio_kg),
    };
  }

  // ── crearRequisiciones (batch, transaccional) ──
  async crearRequisiciones(
    items: Record<string, unknown>[],
    estadoInicial = 'PENDIENTE',
  ): Promise<Record<string, unknown>[]> {
    if (!items.length) throw this.fail('Debe enviar al menos una requisición.', 422);
    const estado = ['SUGERIDA', 'PENDIENTE', 'APROBADA'].includes(estadoInicial) ? estadoInicial : 'PENDIENTE';

    const created = await this.dataSource.transaction(async (m) => {
      const now = (await m.query(`SELECT DATE_FORMAT(NOW(),'%Y-%m-%d %H:%i:%s') AS n`))[0].n;
      const ids: number[] = [];
      for (const item of items) {
        for (const f of ['preparacion_id', 'item_general_id', 'cantidad_solicitada']) {
          if (!item[f]) throw this.fail(`Campo requerido faltante: ${f}`, 422);
        }
        const res: { insertId: number } = await m.query(
          `INSERT INTO requisiciones_compra
             (preparacion_id, item_general_id, item_proveedor_id, proveedor_id,
              cantidad_necesaria, cantidad_disponible, cantidad_solicitada,
              precio_unitario, estado, observaciones, fecha_creacion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            Number(item.preparacion_id),
            Number(item.item_general_id),
            item.item_proveedor_id != null ? Number(item.item_proveedor_id) : null,
            item.proveedor_id != null ? Number(item.proveedor_id) : null,
            Number(item.cantidad_necesaria ?? 0),
            Number(item.cantidad_disponible ?? 0),
            Number(item.cantidad_solicitada),
            item.precio_unitario != null ? Number(item.precio_unitario) : null,
            estado,
            item.observaciones ?? null,
            now,
          ],
        );
        ids.push(res.insertId);
      }
      return ids;
    });

    return this.listarPorIds(created);
  }

  // ── sugerirRequisicionesMRP ──
  async sugerirRequisicionesMRP(
    itemId: number,
    volumenGalones: number,
    unidadId: number,
    preparacionId: number | null = null,
  ): Promise<Record<string, unknown>> {
    const disp = await this.verificarDisponibilidad(itemId, volumenGalones, unidadId);
    if (disp.todos_disponibles) return { creadas: [], sin_proveedor: [], sin_deficit: true };

    const items: Record<string, unknown>[] = [];
    const sinProveedor: Record<string, unknown>[] = [];

    for (const mat of disp.materiales as Record<string, unknown>[]) {
      if (!mat.tiene_deficit) continue;
      const mejor = await this.pickMejorProveedor(Number(mat.item_general_id));
      if (!mejor) {
        sinProveedor.push({
          item_general_id: mat.item_general_id,
          nombre: mat.nombre,
          codigo: mat.codigo,
          deficit: mat.deficit,
        });
        continue;
      }
      items.push({
        preparacion_id: preparacionId ?? 0,
        item_general_id: mat.item_general_id,
        item_proveedor_id: mejor.id_item_proveedor,
        proveedor_id: mejor.id_proveedor,
        cantidad_necesaria: mat.cantidad_necesaria,
        cantidad_disponible: mat.cantidad_disponible,
        cantidad_solicitada: mat.deficit,
        precio_unitario: mejor.precio_unitario,
        observaciones: `Sugerida automáticamente por MRP. Mejor precio/kg: $${numberFormat(Number(mejor.precio_kg), 2)}`,
      });
    }

    const creadas = items.length ? await this.crearRequisiciones(items, 'SUGERIDA') : [];
    return { creadas, sin_proveedor: sinProveedor, sin_deficit: false };
  }

  // ── listar / listarPorPreparacion / listarPorIds ──
  private readonly SELECT_BASE = `
    SELECT rc.*, ig.nombre AS item_nombre, ig.codigo AS item_codigo,
           ip.nombre AS item_proveedor_nombre, uc.nombre AS unidad_empaque,
           p.nombre_empresa, p.nombre_encargado`;
  private readonly JOINS = `
      FROM requisiciones_compra rc
      INNER JOIN item_general ig   ON ig.id_item_general   = rc.item_general_id
      LEFT  JOIN item_proveedor ip ON ip.id_item_proveedor = rc.item_proveedor_id
      LEFT  JOIN proveedor p       ON p.id_proveedor        = rc.proveedor_id
      LEFT  JOIN unidad uc         ON uc.id_unidad          = ip.unidad_compra_id`;

  async listar(estado?: string | null): Promise<Record<string, unknown>[]> {
    let sql = `
      SELECT rc.*, ig.nombre AS item_nombre, ig.codigo AS item_codigo,
             ip.nombre AS item_proveedor_nombre, uc.nombre AS unidad_empaque,
             p.nombre_empresa, p.nombre_encargado,
             prep.item_general_id AS prep_item_id, prod.nombre AS prep_item_nombre
      ${this.JOINS}
      LEFT  JOIN preparaciones prep ON prep.id_preparaciones = rc.preparacion_id
      LEFT  JOIN item_general prod  ON prod.id_item_general  = prep.item_general_id`;
    const params: unknown[] = [];
    if (estado) { sql += ' WHERE rc.estado = ?'; params.push(estado); }
    sql += ' ORDER BY rc.fecha_creacion DESC';
    const rows: Record<string, unknown>[] = await this.dataSource.query(sql, params);
    return rows.map((r) => this.formatRow(r));
  }

  async listarPorPreparacion(prepId: number): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `${this.SELECT_BASE} ${this.JOINS} WHERE rc.preparacion_id = ? ORDER BY rc.fecha_creacion ASC`,
      [prepId],
    );
    return rows.map((r) => this.formatRow(r));
  }

  private async listarPorIds(ids: number[]): Promise<Record<string, unknown>[]> {
    if (!ids.length) return [];
    const ph = ids.map(() => '?').join(',');
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `${this.SELECT_BASE} ${this.JOINS} WHERE rc.id_requisicion IN (${ph})`,
      ids,
    );
    return rows.map((r) => this.formatRow(r));
  }

  // ── actualizarEstado ──
  async actualizarEstado(id: number, estado: string): Promise<Record<string, unknown>> {
    const validos = ['SUGERIDA', 'PENDIENTE', 'APROBADA', 'CANCELADA'];
    if (!validos.includes(estado)) {
      throw this.fail(`Estado inválido. Valores permitidos: ${validos.join(', ')}`, 422);
    }
    const req = (await this.dataSource.query(
      `SELECT * FROM requisiciones_compra WHERE id_requisicion = ?`,
      [id],
    ))[0];
    if (!req) throw this.fail(`Requisición con ID ${id} no encontrada.`, 422);
    if (req.estado === 'CONVERTIDA') {
      throw this.fail('No se puede modificar una requisición ya convertida a OC.', 422);
    }
    await this.dataSource.query(
      `UPDATE requisiciones_compra SET estado = ? WHERE id_requisicion = ?`,
      [estado, id],
    );
    const row = (await this.dataSource.query(
      `${this.SELECT_BASE} ${this.JOINS} WHERE rc.id_requisicion = ?`,
      [id],
    ))[0];
    return this.formatRow(row);
  }

  // ── convertirAOC ──
  async convertirAOC(ids: number[], bodegaId: number, observaciones: string | null = null): Promise<number[]> {
    if (!ids.length) throw this.fail('Debe enviar al menos una requisición.', 422);
    const ph = ids.map(() => '?').join(',');
    const requisiciones: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT rc.*, ip.precio_unitario AS precio_ip, ip.nombre AS item_proveedor_nombre
         FROM requisiciones_compra rc
         LEFT JOIN item_proveedor ip ON ip.id_item_proveedor = rc.item_proveedor_id
        WHERE rc.id_requisicion IN (${ph})`,
      ids,
    );
    if (requisiciones.length !== ids.length) {
      throw this.fail('Una o más requisiciones no fueron encontradas.', 422);
    }
    for (const r of requisiciones) {
      if (r.estado !== 'APROBADA') {
        throw this.fail(`La requisición #${r.id_requisicion} debe estar en estado APROBADA para convertir.`, 422);
      }
      if (!r.proveedor_id) {
        throw this.fail(`La requisición #${r.id_requisicion} no tiene proveedor asignado.`, 422);
      }
    }
    const grupos = new Map<number, Record<string, unknown>[]>();
    for (const r of requisiciones) {
      const pid = Number(r.proveedor_id);
      if (!grupos.has(pid)) grupos.set(pid, []);
      grupos.get(pid)!.push(r);
    }

    return this.dataSource.transaction(async (m) => {
      // Anti doble-conversión concurrente (misma clase de bug ya arreglada en
      // cotización/remisión): re-lock + re-valida DENTRO de la tx. El FOR UPDATE
      // serializa; si otra request ya las convirtió, acá se ven CONVERTIDA.
      const locked: { id_requisicion: number; estado: string }[] = await m.query(
        `SELECT id_requisicion, estado FROM requisiciones_compra WHERE id_requisicion IN (${ph}) FOR UPDATE`,
        ids,
      );
      for (const r of locked) {
        if (r.estado !== 'APROBADA') {
          throw this.fail(`La requisición #${r.id_requisicion} ya no está APROBADA (¿ya se convirtió?).`, 409);
        }
      }

      const ocCreadas: number[] = [];
      for (const [proveedorId, reqs] of grupos) {
        const numOC = await this.numeracion.reservar('orden_compra', m as EntityManager);
        const insOc: { insertId: number } = await m.query(
          `INSERT INTO ordenes_compra (numero, proveedor_id, bodegas_id, fecha, estado, total, observaciones)
           VALUES (?, ?, ?, NOW(), 'Borrador', 0, ?)`,
          [numOC, proveedorId, bodegaId, observaciones],
        );
        const ocId = insOc.insertId;
        let total = 0;
        for (const r of reqs) {
          const precioReq = Number(r.precio_unitario ?? 0);
          const precio = precioReq > 0 ? precioReq : Number(r.precio_ip ?? 0);
          const subtotal = round(Number(r.cantidad_solicitada) * precio, 2);
          total += subtotal;
          await m.query(
            `INSERT INTO ordenes_compra_detalle
               (ordenes_compra_id, item_proveedor_id, item_general_id, cantidad, precio_unit, subtotal)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ocId, r.item_proveedor_id, r.item_general_id, r.cantidad_solicitada, precio, subtotal],
          );
          const upd: { affectedRows: number } = await m.query(
            `UPDATE requisiciones_compra SET estado = 'CONVERTIDA', orden_compra_id = ?
              WHERE id_requisicion = ? AND estado = 'APROBADA'`,
            [ocId, r.id_requisicion],
          );
          if (!upd.affectedRows) {
            // Otra transacción la convirtió entre el lock y este UPDATE → aborta todo.
            throw this.fail(`La requisición #${r.id_requisicion} ya fue convertida.`, 409);
          }
        }
        await m.query(`UPDATE ordenes_compra SET total = ? WHERE id_orden = ?`, [total, ocId]);
        ocCreadas.push(ocId);
      }
      return ocCreadas;
    });
  }

  private formatRow(r: Record<string, unknown>): Record<string, unknown> {
    return {
      id_requisicion: Number(r.id_requisicion),
      preparacion_id: Number(r.preparacion_id),
      item_general_id: Number(r.item_general_id),
      item_nombre: r.item_nombre ?? null,
      item_codigo: r.item_codigo ?? null,
      item_proveedor_id: r.item_proveedor_id ? Number(r.item_proveedor_id) : null,
      item_proveedor_nombre: r.item_proveedor_nombre ?? null,
      unidad_empaque: r.unidad_empaque ?? null,
      proveedor_id: r.proveedor_id ? Number(r.proveedor_id) : null,
      nombre_empresa: r.nombre_empresa ?? null,
      nombre_encargado: r.nombre_encargado ?? null,
      cantidad_necesaria: Number(r.cantidad_necesaria),
      cantidad_disponible: Number(r.cantidad_disponible),
      cantidad_solicitada: Number(r.cantidad_solicitada),
      precio_unitario: r.precio_unitario !== null && r.precio_unitario !== undefined ? Number(r.precio_unitario) : null,
      estado: r.estado,
      observaciones: r.observaciones,
      orden_compra_id: r.orden_compra_id ? Number(r.orden_compra_id) : null,
      fecha_creacion: r.fecha_creacion,
    };
  }
}
