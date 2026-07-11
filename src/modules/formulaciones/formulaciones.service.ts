import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import {
  CreateFormulacionDto,
  MateriaPrimaLineaDto,
  UpdateFormulacionDto,
} from './dto/formulacion.dto';

const TIPOS: Record<number, string> = {
  0: 'PRODUCTO',
  1: 'MATERIA PRIMA',
  2: 'INSUMO',
};

/**
 * Réplica fiel de FormulacionesController + FormulacionesModel (CRUD-CORE, CI4).
 * Diferido a CI4: simulaciones de costo por proveedor (opciones-ingredientes,
 * proveedores, costos por volumen), detalle de versión y restaurar versión.
 * ⚠️ El BOM que se escribe acá lo consume producción — verificado con golden.
 */
@Injectable()
export class FormulacionesService {
  constructor(private readonly dataSource: DataSource) {}

  private async margenDefault(): Promise<number> {
    try {
      const rows: { valor: unknown }[] = await this.dataSource.query(
        `SELECT valor FROM configuracion_sistema WHERE clave = 'margen_utilidad_default_pct' LIMIT 1`,
      );
      if (rows.length) return Number(rows[0].valor) || 50;
    } catch {
      /* default */
    }
    return 50;
  }

  // ── LIST — GET /formulaciones → array crudo ──
  async getItemsFormulaciones(): Promise<Record<string, unknown>[]> {
    const data: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT f.*, ig.nombre AS item_general, ig.tipo, ig.codigo AS codigo_item_general,
              ig.id_item_general AS id_item_general
         FROM formulaciones f
         LEFT JOIN item_general ig ON ig.id_item_general = f.item_general_id
        WHERE f.estado = 1`,
    );
    const out: Record<string, unknown>[] = [];
    for (const item of data) {
      const items: Record<string, unknown>[] = await this.dataSource.query(
        `SELECT ig.nombre, ig.codigo AS codigo_item_general, ig.*, ci.*, igf.cantidad, igf.porcentaje
           FROM item_general_formulaciones igf
           LEFT JOIN item_general ig ON ig.id_item_general = igf.item_general_id
           LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
          WHERE igf.formulaciones_id = ?`,
        [item.id_formulaciones],
      );
      out.push({
        id_formulacion: Number(item.id_formulaciones),
        id_item_general: item.id_item_general,
        codigo_item_general: item.codigo_item_general,
        nombre_item_general: item.item_general,
        nombre: item.nombre,
        tipo: TIPOS[Number(item.tipo)] ?? 'Otro',
        descripcion: item.descripcion,
        items,
      });
    }
    return out;
  }

  // ── DETAIL por id — GET /formulaciones/:id → { status:200, success:true, data } ──
  async getItemFormulacionById(id: number): Promise<Record<string, unknown>> {
    const headRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT f.*, ig.nombre AS item_general, ig.tipo, ig.codigo AS codigo_item_general,
              ig.id_item_general AS id_item_general
         FROM formulaciones f
         LEFT JOIN item_general ig ON ig.id_item_general = f.item_general_id
        WHERE f.estado = 1 AND f.id_formulaciones = ?`,
      [id],
    );
    if (!headRows.length) {
      throw new NotFoundException(`Formulación con ID ${id} no encontrada.`);
    }
    const item = headRows[0];
    const items: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.nombre, ig.codigo AS codigo_item_general, ig.*, ci.*, igf.cantidad,
              igf.porcentaje, igf.orden, igf.tipo, igf.texto, igf.nota
         FROM item_general_formulaciones igf
         LEFT JOIN item_general ig ON ig.id_item_general = igf.item_general_id
         LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        WHERE igf.formulaciones_id = ?
        ORDER BY igf.orden ASC, igf.id_item_general_formulaciones ASC`,
      [item.id_formulaciones],
    );
    return {
      id_formulacion: item.id_formulaciones,
      id_item_general: item.id_item_general,
      codigo_item_general: item.codigo_item_general,
      nombre_item_general: item.item_general,
      nombre: item.nombre,
      tipo: TIPOS[Number(item.tipo)] ?? 'Otro',
      descripcion: item.descripcion,
      items,
    };
  }

  // ── DETAIL por item — GET /formulacion_item/:itemId → { status:'success', data } ──
  async getFormulacionConMateriasPrimas(
    itemId: number,
  ): Promise<Record<string, unknown>> {
    const margen = await this.margenDefault();
    const itemRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo, ig.viscosidad, ig.p_g,
              ig.color, ig.secado, ig.cubrimiento, ig.brillo_60,
              i.cantidad AS inventario_cantidad,
              COALESCE(NULLIF(ci.volumen, 0), 1) AS volumen_base,
              COALESCE(ci.envase, 0) AS envase, COALESCE(ci.etiqueta, 0) AS etiqueta,
              COALESCE(ci.bandeja, 0) AS bandeja, COALESCE(ci.plastico, 0) AS plastico,
              COALESCE(ci.costo_mod, 0) AS costo_mod,
              COALESCE(ci.porcentaje_utilidad, ${margen}) AS porcentaje_utilidad
         FROM item_general ig
         LEFT JOIN inventario i ON i.item_general_id = ig.id_item_general
         LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        WHERE ig.id_item_general = ?`,
      [itemId],
    );
    if (!itemRows.length) {
      throw new NotFoundException(`Item con ID ${itemId} no encontrado.`);
    }
    const item = itemRows[0];

    const formRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id_formulaciones, nombre, descripcion FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`,
      [itemId],
    );
    if (!formRows.length) {
      throw new NotFoundException(
        `El item '${String(item.nombre)}' no tiene una formulación activa.`,
      );
    }
    const formulacion = formRows[0];

    const mps: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.id_item_general_formulaciones, igf.formulaciones_id,
              igf.item_general_id AS materia_prima_id, igf.cantidad, igf.orden, igf.tipo,
              igf.texto, igf.nota, ig.nombre AS materia_prima_nombre, ig.codigo AS materia_prima_codigo,
              COALESCE(NULLIF(ci.costo_unitario, 0),
                (SELECT MIN(ip2.precio_unitario / GREATEST(ip2.factor_conversion, 1))
                   FROM item_proveedor ip2 WHERE ip2.item_general_id = ig.id_item_general AND ip2.deleted_at IS NULL),
                0) AS costo_unitario,
              COALESCE(i.cantidad, 0) AS inventario_cantidad,
              igf.cantidad * COALESCE(NULLIF(ci.costo_unitario, 0),
                (SELECT MIN(ip2.precio_unitario / GREATEST(ip2.factor_conversion, 1))
                   FROM item_proveedor ip2 WHERE ip2.item_general_id = ig.id_item_general AND ip2.deleted_at IS NULL),
                0) AS costo_total
         FROM item_general_formulaciones igf
         LEFT JOIN item_general ig ON igf.item_general_id = ig.id_item_general
         LEFT JOIN costos_item ci ON ig.id_item_general = ci.item_general_id
         LEFT JOIN inventario i ON ig.id_item_general = i.item_general_id
        WHERE igf.formulaciones_id = ?
        ORDER BY igf.orden ASC, ig.nombre ASC`,
      [formulacion.id_formulaciones],
    );
    if (!mps.length) {
      throw new NotFoundException(
        `La formulación del item '${String(item.nombre)}' no tiene materias primas asignadas.`,
      );
    }

    return {
      item: {
        id: Number(item.id_item_general),
        nombre: item.nombre,
        codigo: item.codigo,
        tipo: item.tipo,
        viscosidad: item.viscosidad,
        p_g: item.p_g,
        color: item.color,
        secado: item.secado,
        cubrimiento: item.cubrimiento,
        brillo_60: item.brillo_60,
        inventario_cantidad: Number(item.inventario_cantidad),
        volumen_base: Number(item.volumen_base),
        envase: Number(item.envase),
        etiqueta: Number(item.etiqueta),
        bandeja: Number(item.bandeja),
        plastico: Number(item.plastico),
        costo_mod: Number(item.costo_mod),
        porcentaje_utilidad: Number(item.porcentaje_utilidad),
      },
      formulacion_id: Number(formulacion.id_formulaciones),
      nombre: formulacion.nombre,
      descripcion: formulacion.descripcion,
      materias_primas: mps.map((mp) => ({
        id: Number(mp.id_item_general_formulaciones),
        formulaciones_id: Number(mp.formulaciones_id),
        materia_prima_id: Number(mp.materia_prima_id),
        orden: Number(mp.orden),
        tipo: mp.tipo ?? 'ingrediente',
        texto: mp.texto ?? null,
        nota: mp.nota ?? null,
        nombre: mp.materia_prima_nombre,
        codigo: mp.materia_prima_codigo,
        cantidad: Number(mp.cantidad),
        costo_unitario: Number(mp.costo_unitario),
        costo_total: Number(mp.costo_total),
        inventario_cantidad: Number(mp.inventario_cantidad),
      })),
    };
  }

  // ── insertarLineas (BOM) — réplica literal ──
  private async insertarLineas(
    m: EntityManager,
    formulacionId: number,
    lineas: MateriaPrimaLineaDto[],
  ): Promise<void> {
    let orden = 0;
    for (const mp of lineas) {
      let tipo = mp.tipo ?? 'ingrediente';
      if (!['ingrediente', 'instruccion', 'fase'].includes(tipo)) {
        tipo = 'ingrediente';
      }
      if (tipo === 'ingrediente') {
        if (!mp.materia_prima_id) continue;
        orden++;
        const nota = String(mp.nota ?? '').trim();
        await m.query(
          `INSERT INTO item_general_formulaciones
             (formulaciones_id, item_general_id, cantidad, porcentaje, orden, tipo, nota)
           VALUES (?, ?, ?, ?, ?, 'ingrediente', ?)`,
          [
            formulacionId,
            Number(mp.materia_prima_id),
            mp.cantidad ?? 0,
            mp.porcentaje ?? 0,
            Number(mp.orden ?? orden),
            nota !== '' ? nota : null,
          ],
        );
      } else {
        const texto = String(mp.texto ?? '').trim();
        if (texto === '') continue;
        orden++;
        await m.query(
          `INSERT INTO item_general_formulaciones
             (formulaciones_id, item_general_id, cantidad, porcentaje, orden, tipo, texto)
           VALUES (?, NULL, 0, 0, ?, ?, ?)`,
          [formulacionId, Number(mp.orden ?? orden), tipo, texto],
        );
      }
    }
  }

  // ── crearVersion — snapshot inmutable ──
  private async crearVersion(
    m: EntityManager,
    formulacionId: number,
    createdBy: string | null,
    notas: string | null,
  ): Promise<number> {
    const formRows: Record<string, unknown>[] = await m.query(
      `SELECT nombre, descripcion FROM formulaciones WHERE id_formulaciones = ?`,
      [formulacionId],
    );
    if (!formRows.length) {
      throw new BadRequestException(
        `Formulación #${formulacionId} no encontrada para versionar.`,
      );
    }
    const form = formRows[0];
    const ingredientes: Record<string, unknown>[] = await m.query(
      `SELECT igf.item_general_id, igf.cantidad, igf.porcentaje, igf.orden, igf.tipo,
              igf.texto, igf.nota, ig.nombre AS item_nombre, ig.codigo AS item_codigo
         FROM item_general_formulaciones igf
         LEFT JOIN item_general ig ON ig.id_item_general = igf.item_general_id
        WHERE igf.formulaciones_id = ?
        ORDER BY igf.orden ASC, igf.id_item_general_formulaciones ASC`,
      [formulacionId],
    );
    const maxRows: { m: number | null }[] = await m.query(
      `SELECT MAX(version_num) AS m FROM formulaciones_versiones WHERE formulacion_id = ?`,
      [formulacionId],
    );
    const nextVer = Number(maxRows[0].m ?? 0) + 1;
    const ins: { insertId: number } = await m.query(
      `INSERT INTO formulaciones_versiones
         (formulacion_id, version_num, nombre, descripcion, ingredientes, notas, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        formulacionId,
        nextVer,
        form.nombre,
        form.descripcion,
        JSON.stringify(ingredientes),
        notas,
        createdBy ?? 'sistema',
      ],
    );
    await m.query(
      `UPDATE formulaciones SET version_actual = ? WHERE id_formulaciones = ?`,
      [nextVer, formulacionId],
    );
    return ins.insertId;
  }

  // ── CREATE ──
  async crearFormulacion(
    data: CreateFormulacionDto,
    responsable: string,
  ): Promise<Record<string, unknown>> {
    if (!data.materias_primas?.length) {
      throw new BadRequestException('Debe agregar al menos una materia prima.');
    }
    return this.dataSource.transaction(async (m) => {
      await m.query(`UPDATE formulaciones SET estado = 0 WHERE item_general_id = ?`, [
        data.item_general_id,
      ]);
      const ins: { insertId: number } = await m.query(
        `INSERT INTO formulaciones (item_general_id, nombre, descripcion, estado, defecto) VALUES (?, ?, ?, 1, 1)`,
        [data.item_general_id, data.nombre ?? 'PREPARACION', data.descripcion ?? null],
      );
      const formulacionId = ins.insertId;
      await this.insertarLineas(m, formulacionId, data.materias_primas);
      await this.upsertVolumen(m, data.item_general_id, data.volumen);
      const versionId = await this.crearVersion(
        m,
        formulacionId,
        responsable,
        'Versión inicial',
      );
      return {
        success: true,
        message: 'Formulación creada correctamente.',
        formulacion_id: formulacionId,
        version_id: versionId,
        version_num: 1,
      };
    });
  }

  private async upsertVolumen(
    m: EntityManager,
    itemGeneralId: number,
    volumen?: number,
  ): Promise<void> {
    if (volumen == null || !(volumen > 0)) return;
    const exists: unknown[] = await m.query(
      `SELECT id_costos_item FROM costos_item WHERE item_general_id = ? LIMIT 1`,
      [itemGeneralId],
    );
    if (exists.length) {
      await m.query(`UPDATE costos_item SET volumen = ? WHERE item_general_id = ?`, [
        volumen,
        itemGeneralId,
      ]);
    } else {
      await m.query(`INSERT INTO costos_item (item_general_id, volumen) VALUES (?, ?)`, [
        itemGeneralId,
        volumen,
      ]);
    }
  }

  // ── UPDATE ──
  async actualizarFormulacion(
    formulacionId: number,
    data: UpdateFormulacionDto,
    responsable: string,
  ): Promise<Record<string, unknown>> {
    if (!data.materias_primas?.length) {
      throw new BadRequestException('Debe agregar al menos una materia prima.');
    }
    return this.dataSource.transaction(async (m) => {
      await m.query(
        `UPDATE formulaciones SET nombre = ?, descripcion = ? WHERE id_formulaciones = ?`,
        [data.nombre ?? 'PREPARACION', data.descripcion ?? null, formulacionId],
      );
      await m.query(`DELETE FROM item_general_formulaciones WHERE formulaciones_id = ?`, [
        formulacionId,
      ]);
      await this.insertarLineas(m, formulacionId, data.materias_primas);

      let itemIdCostos = data.item_general_id;
      if (!itemIdCostos) {
        const r: { item_general_id: number }[] = await m.query(
          `SELECT item_general_id FROM formulaciones WHERE id_formulaciones = ?`,
          [formulacionId],
        );
        itemIdCostos = r[0]?.item_general_id;
      }
      if (itemIdCostos) await this.upsertVolumen(m, itemIdCostos, data.volumen);

      const versionId = await this.crearVersion(
        m,
        formulacionId,
        responsable,
        data.notas_version ?? 'Edición de formulación',
      );
      const verRows: { version_actual: number }[] = await m.query(
        `SELECT version_actual FROM formulaciones WHERE id_formulaciones = ?`,
        [formulacionId],
      );
      return {
        success: true,
        message: 'Formulación actualizada correctamente.',
        version_id: versionId,
        version_num: Number(verRows[0].version_actual),
      };
    });
  }

  // ── CLONAR ──
  async clonarFormulacion(
    fromItemId: number,
    toItemId: number,
    nombre: string | null,
    responsable: string,
    force: boolean,
  ): Promise<Record<string, unknown>> {
    if (fromItemId === toItemId) {
      throw new BadRequestException(
        'El producto origen y destino no pueden ser el mismo.',
      );
    }
    const destino: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id_item_general, nombre FROM item_general WHERE id_item_general = ? AND deleted_at IS NULL LIMIT 1`,
      [toItemId],
    );
    if (!destino.length) {
      throw new BadRequestException('Producto destino no existe o está archivado.');
    }
    if (!force) {
      const ex: unknown[] = await this.dataSource.query(
        `SELECT id_formulaciones FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`,
        [toItemId],
      );
      if (ex.length) {
        throw new BadRequestException(
          'El producto destino ya tiene una fórmula activa. Confirmá el reemplazo enviando force=true (la fórmula anterior se conservará como versión histórica).',
        );
      }
    }
    const origenRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id_formulaciones, nombre, descripcion FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`,
      [fromItemId],
    );
    if (!origenRows.length) {
      throw new BadRequestException('La fórmula origen no está activa o no existe.');
    }
    const origen = origenRows[0];

    const ingredientes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.item_general_id, igf.cantidad, igf.porcentaje, igf.orden, igf.tipo, igf.texto, igf.nota
         FROM item_general_formulaciones igf
         LEFT JOIN item_general ig ON ig.id_item_general = igf.item_general_id
        WHERE igf.formulaciones_id = ? AND (ig.deleted_at IS NULL OR igf.tipo <> 'ingrediente')
        ORDER BY igf.orden ASC, igf.id_item_general_formulaciones ASC`,
      [origen.id_formulaciones],
    );
    if (!ingredientes.length) {
      throw new BadRequestException('La fórmula origen no tiene ingredientes activos.');
    }
    const materias_primas: MateriaPrimaLineaDto[] = ingredientes.map((i) => ({
      materia_prima_id: Number(i.item_general_id),
      cantidad: Number(i.cantidad),
      porcentaje: Number(i.porcentaje),
      orden: Number(i.orden),
      tipo: (i.tipo as string) ?? 'ingrediente',
      texto: (i.texto as string) ?? undefined,
      nota: (i.nota as string) ?? undefined,
    }));

    return this.crearFormulacion(
      {
        item_general_id: toItemId,
        nombre: nombre || `${String(origen.nombre)} (clonada)`,
        descripcion: (origen.descripcion as string) ?? undefined,
        materias_primas,
      },
      responsable,
    );
  }

  // ── VERSIÓN detalle (snapshot + diff vs anterior) ──
  async detalleVersion(versionId: number): Promise<Record<string, unknown> | null> {
    const verRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM formulaciones_versiones WHERE id = ?`,
      [versionId],
    );
    if (!verRows.length) return null;
    const ver = verRows[0];
    const ingredientes = this.parseIngredientes(ver.ingredientes);
    ver.ingredientes = ingredientes;

    const antRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM formulaciones_versiones WHERE formulacion_id = ? AND version_num < ? ORDER BY version_num DESC LIMIT 1`,
      [ver.formulacion_id, ver.version_num],
    );
    const diff: Record<string, unknown[]> = {
      agregados: [],
      removidos: [],
      modificados: [],
    };
    let versionAnterior: Record<string, unknown> | null = null;
    if (antRows.length) {
      const anterior = antRows[0];
      const ingAnterior = this.parseIngredientes(anterior.ingredientes);
      const mapAnt = new Map<number, Record<string, unknown>>();
      for (const i of ingAnterior) mapAnt.set(Number(i.item_general_id), i);
      const mapNew = new Map<number, Record<string, unknown>>();
      for (const i of ingredientes) mapNew.set(Number(i.item_general_id), i);
      for (const [id, cur] of mapNew) {
        if (!mapAnt.has(id)) diff.agregados.push(cur);
        else if (Number(mapAnt.get(id)!.cantidad) !== Number(cur.cantidad)) {
          diff.modificados.push({
            item_general_id: id,
            item_nombre: cur.item_nombre ?? null,
            item_codigo: cur.item_codigo ?? null,
            cantidad_antes: Number(mapAnt.get(id)!.cantidad),
            cantidad_despues: Number(cur.cantidad),
          });
        }
      }
      for (const [id, prev] of mapAnt) if (!mapNew.has(id)) diff.removidos.push(prev);
      versionAnterior = {
        id: Number(anterior.id),
        version_num: Number(anterior.version_num),
        created_at: anterior.created_at,
      };
    }
    ver.version_anterior = versionAnterior;
    ver.diff = diff;
    return ver;
  }

  private parseIngredientes(raw: unknown): Record<string, unknown>[] {
    if (Array.isArray(raw)) return raw as Record<string, unknown>[];
    if (typeof raw === 'string') {
      try {
        const p = JSON.parse(raw || '[]');
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  // ── RESTAURAR versión (crea nueva versión con el snapshot histórico) ──
  async restaurarVersion(
    versionId: number,
    responsable: string,
    notas: string | null,
  ): Promise<Record<string, unknown>> {
    const verRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM formulaciones_versiones WHERE id = ?`,
      [versionId],
    );
    if (!verRows.length) {
      throw new BadRequestException(`Versión #${versionId} no encontrada.`);
    }
    const ver = verRows[0];
    const formulacionId = Number(ver.formulacion_id);
    const formRows: { version_actual: number }[] = await this.dataSource.query(
      `SELECT version_actual FROM formulaciones WHERE id_formulaciones = ?`,
      [formulacionId],
    );
    if (!formRows.length) {
      throw new BadRequestException(`Formulación #${formulacionId} no encontrada.`);
    }
    if (Number(formRows[0].version_actual) === Number(ver.version_num)) {
      throw new BadRequestException(
        `La versión #${ver.version_num} ya es la actual de la formulación.`,
      );
    }
    const ingredientes = this.parseIngredientes(ver.ingredientes);
    if (!ingredientes.length) {
      throw new BadRequestException(
        `La versión #${ver.version_num} no tiene ingredientes para restaurar.`,
      );
    }
    const ids = [
      ...new Set(
        ingredientes.map((i) => Number(i.item_general_id || 0)).filter(Boolean),
      ),
    ];
    if (ids.length) {
      const activos: { id_item_general: number }[] = await this.dataSource.query(
        `SELECT id_item_general FROM item_general WHERE id_item_general IN (${ids.map(() => '?').join(',')}) AND deleted_at IS NULL`,
        ids,
      );
      const setAct = new Set(activos.map((a) => Number(a.id_item_general)));
      const faltantes = ids.filter((x) => !setAct.has(x));
      if (faltantes.length) {
        throw new BadRequestException(
          `No se puede restaurar: los siguientes items ya no están disponibles: ${faltantes.join(', ')}.`,
        );
      }
    }

    const lineas: MateriaPrimaLineaDto[] = ingredientes.map((ing) => ({
      tipo: (ing.tipo as string) ?? 'ingrediente',
      materia_prima_id: ing.item_general_id
        ? Number(ing.item_general_id)
        : undefined,
      cantidad: Number(ing.cantidad ?? 0),
      porcentaje: Number(ing.porcentaje ?? 0),
      orden: ing.orden != null ? Number(ing.orden) : undefined,
      texto: (ing.texto as string) ?? undefined,
      nota: (ing.nota as string) ?? undefined,
    }));

    const versionId2 = await this.dataSource.transaction(async (m) => {
      await m.query(
        `DELETE FROM item_general_formulaciones WHERE formulaciones_id = ?`,
        [formulacionId],
      );
      await this.insertarLineas(m, formulacionId, lineas);
      return this.crearVersion(
        m,
        formulacionId,
        responsable,
        notas || `Restaurado desde v.${ver.version_num}`,
      );
    });

    const nuevaRows: { version_actual: number }[] = await this.dataSource.query(
      `SELECT version_actual FROM formulaciones WHERE id_formulaciones = ?`,
      [formulacionId],
    );
    const nuevaVer = Number(nuevaRows[0].version_actual);
    return {
      success: true,
      message: `Versión ${ver.version_num} restaurada como v.${nuevaVer}.`,
      formulacion_id: formulacionId,
      restaurada_de: Number(ver.version_num),
      version_id: versionId2,
      version_num: nuevaVer,
    };
  }

  // ── VERSIONES (list) ──
  listarVersiones(formulacionId: number): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT fv.id, fv.version_num, fv.notas, fv.created_by, fv.created_at,
              f.version_actual, (fv.version_num = f.version_actual) AS es_actual
         FROM formulaciones_versiones fv
         JOIN formulaciones f ON f.id_formulaciones = fv.formulacion_id
        WHERE fv.formulacion_id = ?
        ORDER BY fv.version_num DESC`,
      [formulacionId],
    );
  }
}
