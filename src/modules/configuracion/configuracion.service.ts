import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

type ConfigRow = {
  grupo: string;
  clave: string;
  valor: unknown;
  tipo: string;
  descripcion: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

/**
 * Réplica de ConfiguracionModel (CI4) sobre `configuracion_sistema`.
 * La columna `valor` es JSON → mysql2 la devuelve YA parseada (a diferencia de
 * PHP que hace json_decode); por eso castValue recibe el valor decodificado.
 */
@Injectable()
export class ConfiguracionService {
  constructor(private readonly dataSource: DataSource) {}

  async obtener<T = unknown>(clave: string, def: T = null as unknown as T): Promise<T> {
    const rows: { valor: unknown; tipo: string }[] = await this.dataSource.query(
      `SELECT valor, tipo FROM configuracion_sistema WHERE clave = ? LIMIT 1`,
      [clave],
    );
    if (!rows.length) return def;
    return this.castValue(rows[0].valor, rows[0].tipo) as T;
  }

  /** { grupo: { clave: { valor, tipo, descripcion, updated_at, updated_by } } } */
  async getAllGrouped(): Promise<Record<string, Record<string, unknown>>> {
    const rows: ConfigRow[] = await this.dataSource.query(
      `SELECT * FROM configuracion_sistema ORDER BY grupo, clave`,
    );
    const out: Record<string, Record<string, unknown>> = {};
    for (const r of rows) {
      (out[r.grupo] ??= {})[r.clave] = this.formatRow(r);
    }
    return out;
  }

  /** { clave: { valor, tipo, descripcion, updated_at, updated_by } } */
  async getGrupo(grupo: string): Promise<Record<string, unknown>> {
    const rows: ConfigRow[] = await this.dataSource.query(
      `SELECT * FROM configuracion_sistema WHERE grupo = ? ORDER BY clave`,
      [grupo],
    );
    const out: Record<string, unknown> = {};
    for (const r of rows) out[r.clave] = this.formatRow(r);
    return out;
  }

  /** Guarda o crea la clave. Devuelve true si impactó fila. */
  async guardar(clave: string, valor: unknown, usuario = 'sistema'): Promise<boolean> {
    const existing: { id_configuracion: number }[] = await this.dataSource.query(
      `SELECT id_configuracion FROM configuracion_sistema WHERE clave = ? LIMIT 1`,
      [clave],
    );
    const valorJson = JSON.stringify(valor ?? null);
    if (existing.length) {
      await this.dataSource.query(
        `UPDATE configuracion_sistema SET valor = ?, updated_at = NOW(), updated_by = ? WHERE id_configuracion = ?`,
        [valorJson, usuario, existing[0].id_configuracion],
      );
      return true;
    }
    await this.dataSource.query(
      `INSERT INTO configuracion_sistema (grupo, clave, valor, tipo, descripcion, updated_at, updated_by)
       VALUES ('sistema', ?, ?, ?, NULL, NOW(), ?)`,
      [clave, valorJson, this.detectTipo(valor), usuario],
    );
    return true;
  }

  private formatRow(r: ConfigRow): Record<string, unknown> {
    return {
      valor: this.castValue(r.valor, r.tipo),
      tipo: r.tipo,
      descripcion: r.descripcion,
      updated_at: r.updated_at,
      updated_by: r.updated_by,
    };
  }

  /** `decoded` ya viene parseado desde la columna JSON. */
  private castValue(decoded: unknown, tipo: string): unknown {
    if (decoded === null || decoded === undefined) return null;
    switch (tipo) {
      case 'number': {
        const n = Number(decoded);
        return !Number.isNaN(n) && decoded !== '' ? n : 0;
      }
      case 'boolean':
        return Boolean(decoded);
      case 'json':
        return decoded;
      default:
        return String(decoded);
    }
  }

  /** Réplica de detectTipo: bool→boolean, numérico (incl. string numérica)→number, array/obj→json, else string. */
  private detectTipo(valor: unknown): string {
    if (typeof valor === 'boolean') return 'boolean';
    if (
      typeof valor === 'number' ||
      (typeof valor === 'string' && valor.trim() !== '' && !Number.isNaN(Number(valor)))
    ) {
      return 'number';
    }
    if (valor !== null && typeof valor === 'object') return 'json';
    return 'string';
  }
}
