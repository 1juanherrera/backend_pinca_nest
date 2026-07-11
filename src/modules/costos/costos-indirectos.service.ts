import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

const N = (x: unknown) => Number(x ?? 0);
const isNum = (x: unknown) => x !== '' && x !== null && !Number.isNaN(Number(x));

/** Réplica fiel de CostosIndirectosController + Model (CI4). CRUD + resumen + asignación a ítem. */
@Injectable()
export class CostosIndirectosService {
  constructor(private readonly dataSource: DataSource) {}

  private fail(msg: string, status: number): HttpException {
    return new HttpException({ msg }, status);
  }

  private async find(id: number): Promise<Record<string, unknown> | null> {
    const rows = await this.dataSource.query(`SELECT * FROM costos_indirectos WHERE id_costos_indirectos = ?`, [id]);
    return rows[0] ?? null;
  }

  // GET /costos_indirectos
  listar(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`SELECT * FROM costos_indirectos ORDER BY categoria ASC, nombre ASC`);
  }

  // GET /costos_indirectos/resumen
  async resumen(): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT categoria, SUM(valor_mensual) AS total, COUNT(*) AS cantidad
         FROM costos_indirectos WHERE activo = 1 GROUP BY categoria ORDER BY categoria ASC`,
    );
    const totalGeneral = rows.reduce((a, r) => a + N(r.total), 0);
    return { por_categoria: rows, total_mensual: totalGeneral };
  }

  // GET /costos_indirectos/:id
  async show(id: number): Promise<Record<string, unknown>> {
    const row = await this.find(id);
    if (!row) throw this.fail(`Costo indirecto #${id} no encontrado.`, 404);
    return row;
  }

  // POST /costos_indirectos
  async create(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!data?.nombre || !data?.categoria) throw this.fail('nombre y categoria son obligatorios.', 422);
    if (data.valor_mensual !== undefined && (!isNum(data.valor_mensual) || N(data.valor_mensual) < 0)) {
      throw this.fail('valor_mensual debe ser un número mayor o igual a 0.', 422);
    }
    const cols = ['nombre', 'categoria'];
    const vals: unknown[] = [data.nombre, data.categoria];
    if (data.valor_mensual !== undefined) { cols.push('valor_mensual'); vals.push(data.valor_mensual); }
    cols.push('activo', 'fecha_actualizacion');
    const res: { insertId: number } = await this.dataSource.query(
      `INSERT INTO costos_indirectos (${cols.join(', ')}) VALUES (${cols.slice(0, -1).map(() => '?').join(', ')}, CURDATE())`,
      [...vals, 1],
    );
    return { mensaje: 'Costo indirecto creado', id: res.insertId };
  }

  // PUT /costos_indirectos/:id
  async update(id: number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const row = await this.find(id);
    if (!row) throw this.fail(`Costo indirecto #${id} no encontrado.`, 404);
    if (data?.valor_mensual !== undefined && (!isNum(data.valor_mensual) || N(data.valor_mensual) < 0)) {
      throw this.fail('valor_mensual debe ser un número mayor o igual a 0.', 422);
    }
    const allowed = ['nombre', 'categoria', 'valor_mensual', 'activo'];
    const cols: string[] = [];
    const vals: unknown[] = [];
    for (const k of allowed) if (data && Object.prototype.hasOwnProperty.call(data, k)) { cols.push(`${k} = ?`); vals.push(data[k]); }
    cols.push('fecha_actualizacion = CURDATE()');
    await this.dataSource.query(`UPDATE costos_indirectos SET ${cols.join(', ')} WHERE id_costos_indirectos = ?`, [...vals, id]);
    return { mensaje: `Costo indirecto #${id} actualizado` };
  }

  // DELETE /costos_indirectos/:id
  async remove(id: number): Promise<Record<string, unknown>> {
    const row = await this.find(id);
    if (!row) throw this.fail(`Costo indirecto #${id} no encontrado.`, 404);
    await this.dataSource.query(`DELETE FROM costos_indirectos WHERE id_costos_indirectos = ?`, [id]);
    return { mensaje: `Costo indirecto #${id} eliminado` };
  }

  // GET /costos_indirectos/item/:itemId
  async costosItem(itemId: number): Promise<Record<string, unknown>> {
    if (!itemId) throw this.fail('item_id requerido', 400);
    const costos = await this.dataSource.query(
      `SELECT ci.id_costos_indirectos, ci.nombre, ci.categoria, ci.valor_mensual,
              COALESCE(cii.valor_asignado, 0) AS valor_asignado
         FROM costos_indirectos ci
         LEFT JOIN costos_indirectos_item cii
           ON cii.costos_indirectos_id = ci.id_costos_indirectos AND cii.item_general_id = ?
        WHERE ci.activo = 1 ORDER BY ci.categoria ASC, ci.nombre ASC`,
      [itemId],
    );
    const totalRow = (await this.dataSource.query(
      `SELECT COALESCE(SUM(cii.valor_asignado), 0) AS total
         FROM costos_indirectos_item cii
         INNER JOIN costos_indirectos ci ON ci.id_costos_indirectos = cii.costos_indirectos_id
        WHERE cii.item_general_id = ? AND ci.activo = 1`,
      [itemId],
    ))[0];
    return { costos, total_asignado: N(totalRow.total) };
  }

  // POST /costos_indirectos/item/:itemId
  async asignarItem(itemId: number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!itemId) throw this.fail('item_id requerido', 400);
    if (!data?.costos_indirectos_id) throw this.fail('costos_indirectos_id es obligatorio.', 422);
    const costoId = Number(data.costos_indirectos_id);
    const valor = N(data.valor_asignado);
    const existe = (await this.dataSource.query(
      `SELECT id FROM costos_indirectos_item WHERE item_general_id = ? AND costos_indirectos_id = ?`,
      [itemId, costoId],
    ))[0];
    if (existe) {
      await this.dataSource.query(
        `UPDATE costos_indirectos_item SET valor_asignado = ? WHERE item_general_id = ? AND costos_indirectos_id = ?`,
        [valor, itemId, costoId],
      );
    } else {
      await this.dataSource.query(
        `INSERT INTO costos_indirectos_item (item_general_id, costos_indirectos_id, valor_asignado) VALUES (?, ?, ?)`,
        [itemId, costoId, valor],
      );
    }
    return { mensaje: 'Costo asignado correctamente' };
  }
}
