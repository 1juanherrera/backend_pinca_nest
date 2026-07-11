import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

const ALLOWED = ['envase', 'etiqueta', 'bandeja', 'plastico', 'costo_mod', 'porcentaje_utilidad', 'volumen'];

/** Réplica fiel de CostosItemController (CI4). Solo PUT /costos_item/:id. */
@Injectable()
export class CostosItemService {
  constructor(private readonly dataSource: DataSource) {}

  async update(id: number, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!body || Object.keys(body).length === 0) {
      throw new HttpException({ msg: 'No se recibieron datos válidos.' }, 422);
    }
    const row = (await this.dataSource.query(`SELECT id_costos_item FROM costos_item WHERE id_costos_item = ?`, [id]))[0];
    if (!row) throw new HttpException({ msg: `costos_item con ID ${id} no encontrada.` }, 404);

    const dataToSave: Record<string, unknown> = {};
    for (const k of ALLOWED) if (Object.prototype.hasOwnProperty.call(body, k)) dataToSave[k] = body[k];
    const cols = Object.keys(dataToSave);
    if (!cols.length) throw new HttpException({ msg: 'No hay campos válidos para actualizar.' }, 422);

    await this.dataSource.query(
      `UPDATE costos_item SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id_costos_item = ?`,
      [...cols.map((c) => dataToSave[c]), id],
    );
    return { success: true, mensaje: `costos_item con ID ${id} actualizada correctamente`, data: dataToSave };
  }
}
