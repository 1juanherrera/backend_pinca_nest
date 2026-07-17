import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { NumeracionDocumento } from './entities/numeracion-documento.entity';

/**
 * Réplica fiel de NumeracionModel + NumeracionController (CI4).
 *
 * `reservar()` es la pieza crítica: emite el correlativo DIAN de forma atómica
 * con SELECT ... FOR UPDATE. Se ejecuta DENTRO de la transacción del documento
 * (recibe el EntityManager del create) para preservar la atomicidad correlativa.
 */
@Injectable()
export class NumeracionService {
  constructor(
    @InjectRepository(NumeracionDocumento)
    private readonly repo: Repository<NumeracionDocumento>,
    private readonly dataSource: DataSource,
  ) {}

  /** prefijo con {Y}→año + secuencial con zero-pad. Ej: FAC-{Y}-,4,42 → FAC-2026-0042 */
  private formatear(prefijoTpl: string, padding: number, seq: number): string {
    const prefijo = prefijoTpl.replace('{Y}', String(new Date().getFullYear()));
    return prefijo + String(seq).padStart(padding, '0');
  }

  /**
   * Reserva y devuelve el próximo número correlativo para `tipoDoc`, incrementando
   * la serie. DEBE correr dentro de una transacción (usa FOR UPDATE). Replica
   * NumeracionModel::reservar paso a paso.
   */
  async reservar(tipoDoc: string, manager: EntityManager): Promise<string> {
    const year = new Date().getFullYear();
    const hoy = new Date().toISOString().slice(0, 10);

    const rows: Record<string, unknown>[] = await manager.query(
      `SELECT * FROM numeracion_documentos WHERE tipo_doc = ? AND activo = 1 LIMIT 1 FOR UPDATE`,
      [tipoDoc],
    );
    if (!rows.length) {
      throw new BadRequestException(`No hay serie activa para '${tipoDoc}'.`);
    }
    const row = rows[0];

    const vig = row.fecha_vigencia_hasta
      ? String(row.fecha_vigencia_hasta).slice(0, 10)
      : null;
    if (vig && vig < hoy) {
      throw new BadRequestException(
        `La resolución DIAN del tipo '${tipoDoc}' venció el ${vig}. Cargá una nueva resolución antes de continuar.`,
      );
    }

    let proximo = Number(row.proximo_numero);
    let anio = row.anio_actual != null ? Number(row.anio_actual) : null;
    const reinicia = Number(row.reinicia_anual) === 1;

    if (reinicia && anio !== null && year > anio) {
      proximo = 1;
      anio = year;
    }

    const rangoMax = row.rango_max != null ? Number(row.rango_max) : null;
    if (rangoMax && proximo > rangoMax) {
      throw new BadRequestException(
        `El próximo número (${proximo}) excede el rango DIAN autorizado (${rangoMax}). Cargá una nueva resolución para '${tipoDoc}'.`,
      );
    }

    const numero = this.formatear(
      String(row.prefijo),
      Number(row.padding),
      proximo,
    );

    if (reinicia) {
      await manager.query(
        `UPDATE numeracion_documentos SET proximo_numero = ?, anio_actual = ?, updated_at = NOW() WHERE id_numeracion = ?`,
        [proximo + 1, anio, row.id_numeracion],
      );
    } else {
      await manager.query(
        `UPDATE numeracion_documentos SET proximo_numero = ?, updated_at = NOW() WHERE id_numeracion = ?`,
        [proximo + 1, row.id_numeracion],
      );
    }

    return numero;
  }

  /**
   * GET /numeracion → array con folios_restantes + ejemplo_proximo por serie.
   * Usa raw SQL (no repo.find) para que created_at/updated_at salgan como string
   * "YYYY-MM-DD HH:MM:SS" (formato CI4), no como Date/ISO.
   */
  async findAll(): Promise<Record<string, unknown>[]> {
    const series: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM numeracion_documentos ORDER BY tipo_doc ASC, activo DESC`,
    );
    return series.map((s) => ({
      ...s,
      folios_restantes:
        s.rango_max != null
          ? Math.max(0, Number(s.rango_max) - Number(s.proximo_numero) + 1)
          : null,
      ejemplo_proximo: this.formatear(
        String(s.prefijo),
        Number(s.padding),
        Number(s.proximo_numero),
      ),
    }));
  }

  /** Lee una serie por id como fila cruda (datetime como string, formato CI4). */
  private async rawSerie(id: number): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM numeracion_documentos WHERE id_numeracion = ?`,
      [id],
    );
    return rows[0];
  }

  /** POST /numeracion (admin). Si la nueva queda activa, desactiva las otras del tipo. */
  async create(
    body: Partial<NumeracionDocumento>,
    username: string,
  ): Promise<Record<string, unknown>> {
    if (!body.tipo_doc || !body.prefijo) {
      throw new BadRequestException('tipo_doc y prefijo son obligatorios');
    }
    const saved = await this.dataSource.transaction(async (manager) => {
      const activo = body.activo ?? 1;
      if (Number(activo) === 1) {
        // Lock de todas las series del tipo_doc: serializa activaciones
        // concurrentes (evita que queden DOS series activo=1 → folios duplicados).
        await manager.query(
          `SELECT id_numeracion FROM numeracion_documentos WHERE tipo_doc = ? FOR UPDATE`,
          [body.tipo_doc],
        );
        await manager.query(
          `UPDATE numeracion_documentos SET activo = 0 WHERE tipo_doc = ?`,
          [body.tipo_doc],
        );
      }
      const repo = manager.getRepository(NumeracionDocumento);
      const serie = repo.create({
        ...body,
        activo,
        created_at: new Date(),
        updated_at: new Date(),
        updated_by: username,
      });
      return repo.save(serie);
    });
    return this.rawSerie(saved.id_numeracion);
  }

  /** PUT /numeracion/:id (admin) con validaciones de integridad fiscal. */
  async update(
    id: number,
    body: Partial<NumeracionDocumento>,
    username: string,
  ): Promise<Record<string, unknown>> {
    const serie = await this.repo.findOne({ where: { id_numeracion: id } });
    if (!serie) throw new NotFoundException(`Serie #${id} no encontrada`);

    const proximo =
      body.proximo_numero != null
        ? Number(body.proximo_numero)
        : serie.proximo_numero;
    const rangoMin =
      body.rango_min != null ? Number(body.rango_min) : serie.rango_min;
    const rangoMax =
      body.rango_max != null ? Number(body.rango_max) : serie.rango_max;
    const padding = body.padding != null ? Number(body.padding) : serie.padding;

    if (body.proximo_numero != null && proximo < serie.proximo_numero) {
      throw new BadRequestException(
        'proximo_numero no puede ser menor al actual: generaría folios duplicados.',
      );
    }
    if (rangoMin != null && proximo < Number(rangoMin)) {
      throw new BadRequestException('proximo_numero por debajo de rango_min.');
    }
    if (rangoMax != null && proximo > Number(rangoMax)) {
      throw new BadRequestException('proximo_numero excede rango_max.');
    }
    if (padding < 1) throw new BadRequestException('padding debe ser >= 1.');

    await this.dataSource.transaction(async (manager) => {
      if (body.activo != null && Number(body.activo) === 1) {
        // Lock del tipo_doc (serializa activaciones concurrentes; ver create()).
        await manager.query(
          `SELECT id_numeracion FROM numeracion_documentos WHERE tipo_doc = ? FOR UPDATE`,
          [serie.tipo_doc],
        );
        await manager.query(
          `UPDATE numeracion_documentos SET activo = 0 WHERE tipo_doc = ? AND id_numeracion <> ?`,
          [serie.tipo_doc, id],
        );
      }
      const repo = manager.getRepository(NumeracionDocumento);
      const editable: (keyof NumeracionDocumento)[] = [
        'prefijo',
        'padding',
        'proximo_numero',
        'reinicia_anual',
        'resolucion_dian',
        'fecha_resolucion',
        'rango_min',
        'rango_max',
        'fecha_vigencia_hasta',
        'activo',
      ];
      const patch: Partial<NumeracionDocumento> = {};
      for (const k of editable) {
        if (body[k] !== undefined) (patch as Record<string, unknown>)[k] = body[k];
      }
      patch.updated_at = new Date();
      patch.updated_by = username;
      await repo.update(id, patch);
    });
    return this.rawSerie(id);
  }
}
