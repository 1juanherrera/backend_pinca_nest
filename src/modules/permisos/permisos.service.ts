import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { JwtUser } from '../../common/decorators/current-user.decorator';
import { CambiarRolDto, UpdatePermisosDto } from './dto/permisos.dto';

const VALID_ROLES = ['superadmin', 'admin', 'operador', 'visor'];

/** Réplica fiel de PermisosController (CI4). Shapes: éxito {success:true,data}. */
@Injectable()
export class PermisosService {
  constructor(private readonly dataSource: DataSource) {}

  private fail(message: string, status: number): HttpException {
    return new HttpException({ message }, status);
  }

  private isSuperadmin(user: JwtUser): boolean {
    return user?.rol === 'superadmin';
  }

  // ── GET /roles/permisos ──────────────────────────────────────
  async index(): Promise<Record<string, unknown>> {
    const rows: { rol: string; modulo: string }[] = await this.dataSource.query(
      `SELECT * FROM permisos_rol_modulo WHERE activo = 1 ORDER BY rol`,
    );
    const result: Record<string, string[]> = { superadmin: [], admin: [], operador: [], visor: [] };
    for (const row of rows) {
      if (result[row.rol]) result[row.rol].push(row.modulo);
    }
    return { success: true, data: result };
  }

  // ── GET /roles/permisos/:rol ─────────────────────────────────
  async show(rol: string): Promise<Record<string, unknown>> {
    if (!VALID_ROLES.includes(rol)) throw this.fail('Rol inválido.', 400);
    const rows: { modulo: string }[] = await this.dataSource.query(
      `SELECT modulo FROM permisos_rol_modulo WHERE rol = ? AND activo = 1`,
      [rol],
    );
    return { success: true, data: rows.map((r) => r.modulo) };
  }

  // ── PUT /roles/:rol/permisos (solo superadmin) ───────────────
  async update(user: JwtUser, rol: string, dto: UpdatePermisosDto): Promise<Record<string, unknown>> {
    if (!this.isSuperadmin(user)) {
      throw this.fail('Acceso denegado. Solo el superadmin puede gestionar permisos.', 403);
    }
    if (!VALID_ROLES.includes(rol)) throw this.fail('Rol inválido.', 400);

    const modulos = dto.modulos;
    if (!Array.isArray(modulos)) throw this.fail('El campo modulos debe ser un array.', 400);

    await this.dataSource.transaction(async (m) => {
      await m.query(`DELETE FROM permisos_rol_modulo WHERE rol = ?`, [rol]);
      // dedupe sobre valores crudos, luego trim (igual que array_map(trim, array_unique(...))).
      const unicos = [...new Set(modulos as unknown[])];
      if (unicos.length) {
        const values = unicos.map(() => `(?, ?, 1)`).join(', ');
        const params: unknown[] = [];
        for (const mod of unicos) params.push(rol, String(mod).trim());
        await m.query(`INSERT INTO permisos_rol_modulo (rol, modulo, activo) VALUES ${values}`, params);
      }
    });

    // Devuelve los modulos CRUDOS del body (igual que CI4).
    return { success: true, data: { rol, modulos } };
  }

  // ── GET /roles/usuarios (solo superadmin) ────────────────────
  async listarUsuarios(user: JwtUser): Promise<Record<string, unknown>> {
    if (!this.isSuperadmin(user)) throw this.fail('Acceso denegado.', 403);
    const usuarios = await this.dataSource.query(
      `SELECT id_usuarios, username, nombre, rol FROM usuarios`,
    );
    return { success: true, data: usuarios };
  }

  // ── PATCH /roles/usuarios/:id/rol (solo superadmin) ──────────
  async cambiarRol(user: JwtUser, userId: number, dto: CambiarRolDto): Promise<Record<string, unknown>> {
    if (!this.isSuperadmin(user)) throw this.fail('Acceso denegado.', 403);

    const nuevoRol = dto.rol ?? '';
    if (!VALID_ROLES.includes(nuevoRol)) {
      throw this.fail('Rol inválido. Debe ser: superadmin, admin, operador o visor.', 400);
    }

    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM usuarios WHERE id_usuarios = ?`,
      [userId],
    );
    if (!rows.length) throw this.fail('Usuario no encontrado.', 404);

    // token_version++ invalida cualquier JWT vigente del usuario (degradación inmediata).
    await this.dataSource.query(
      `UPDATE usuarios SET rol = ?, token_version = token_version + 1 WHERE id_usuarios = ?`,
      [nuevoRol, userId],
    );

    return { success: true, data: { id: userId, rol: nuevoRol } };
  }
}
