import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { JwtUser } from '../../common/decorators/current-user.decorator';

/** Archivo subido vía Multer (memoria). Tipado mínimo (sin @types/multer). */
interface UploadedFileLike {
  originalname: string;
  size: number;
  buffer: Buffer;
}

/**
 * Réplica de EmpresaController (CI4), incluidos los endpoints de LOGO.
 * Los archivos se escriben bajo PINCA_PUBLIC_DIR (equivalente a FCPATH de CI4) en
 * `uploads/empresa/`; en el cutover nginx debe servir /uploads desde ese mismo dir
 * (o Nest vía ServeStatic). `logo_path` NO está en el whitelist de update (path traversal).
 */
const PUBLIC_DIR = process.env.PINCA_PUBLIC_DIR ?? path.join(process.cwd(), 'public');
const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
};
const ALLOWED = [
  'nit', 'razon_social', 'descripcion', 'ciudad', 'direccion',
  'telefono', 'celular', 'pagina_web', 'email', 'locale', 'moneda',
];

@Injectable()
export class EmpresaService {
  constructor(private readonly dataSource: DataSource) {}

  private fail(msg: string, status: number): HttpException {
    return new HttpException({ msg }, status);
  }

  private async getEmpresa(): Promise<Record<string, unknown> | null> {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM empresa`,
    );
    return rows[0] ?? null;
  }

  // GET /api/empresa
  async empresa(): Promise<Record<string, unknown> | null> {
    return this.getEmpresa();
  }

  // PUT /api/empresa (solo admin/superadmin)
  async update(user: JwtUser, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!['admin', 'superadmin'].includes(user.rol)) {
      throw this.fail('Solo administradores pueden modificar la empresa.', 403);
    }
    // getJSON(true) ?? getPost(): body vacío → 'Datos inválidos' (array vacío es falsy en CI4).
    if (!body || Object.keys(body).length === 0) {
      throw this.fail('Datos inválidos', 400);
    }

    const empresa = await this.getEmpresa();
    if (!empresa) throw this.fail('No se encontró el registro de empresa.', 404);

    // array_intersect_key(data, flip(allowed)): conserva las claves permitidas presentes.
    const cols: string[] = [];
    const vals: unknown[] = [];
    for (const k of ALLOWED) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        cols.push(`${k} = ?`);
        vals.push(body[k]);
      }
    }
    if (!cols.length) throw this.fail('No se enviaron campos válidos.', 400);

    await this.dataSource.query(
      `UPDATE empresa SET ${cols.join(', ')} WHERE id_empresa = ?`,
      [...vals, empresa.id_empresa],
    );

    return {
      ok: true,
      msg: 'Empresa actualizada correctamente.',
      data: await this.getEmpresa(),
    };
  }

  private requireAdmin(user: JwtUser, msg: string): void {
    if (!['admin', 'superadmin'].includes(user.rol)) throw this.fail(msg, 403);
  }
  private absPath(logoPath: string): string {
    return path.join(PUBLIC_DIR, logoPath.replace(/^\/+/, ''));
  }

  // POST /api/empresa/logo (multipart 'logo')
  async uploadLogo(user: JwtUser, file?: UploadedFileLike): Promise<Record<string, unknown>> {
    this.requireAdmin(user, 'Solo administradores pueden cambiar el logo.');
    if (!file || !file.buffer) throw this.fail('No se recibió un archivo válido.', 422);
    const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      throw this.fail('Formato no soportado. Usa PNG, JPG o WEBP.', 422);
    }
    if (file.size > 2 * 1024 * 1024) throw this.fail('El archivo excede 2 MB.', 422);

    const empresa = await this.getEmpresa();
    if (!empresa) throw this.fail('No hay registro de empresa.', 404);

    const dir = path.join(PUBLIC_DIR, 'uploads', 'empresa');
    fs.mkdirSync(dir, { recursive: true });

    const previo = (empresa.logo_path as string) ?? null;
    if (previo) {
      const rutaPrevia = this.absPath(previo);
      try { if (fs.existsSync(rutaPrevia)) fs.unlinkSync(rutaPrevia); } catch { /* best-effort */ }
    }

    const nombre = `logo_${Math.floor(Date.now() / 1000)}.${ext}`;
    try {
      fs.writeFileSync(path.join(dir, nombre), file.buffer);
    } catch {
      throw this.fail('No se pudo guardar el archivo.', 400);
    }
    const logoPath = `/uploads/empresa/${nombre}`;
    await this.dataSource.query(`UPDATE empresa SET logo_path = ? WHERE id_empresa = ?`, [logoPath, empresa.id_empresa]);
    return { ok: true, msg: 'Logo actualizado correctamente.', logo_path: logoPath };
  }

  // DELETE /api/empresa/logo
  async deleteLogo(user: JwtUser): Promise<Record<string, unknown>> {
    this.requireAdmin(user, 'Solo administradores pueden eliminar el logo.');
    const empresa = await this.getEmpresa();
    if (!empresa) throw this.fail('No hay registro de empresa.', 404);
    const previo = (empresa.logo_path as string) ?? null;
    if (previo) {
      const rutaPrevia = this.absPath(previo);
      try { if (fs.existsSync(rutaPrevia)) fs.unlinkSync(rutaPrevia); } catch { /* best-effort */ }
    }
    await this.dataSource.query(`UPDATE empresa SET logo_path = NULL WHERE id_empresa = ?`, [empresa.id_empresa]);
    return { ok: true, msg: 'Logo eliminado.' };
  }

  // GET /api/empresa/logo-base64
  async logoBase64(): Promise<Record<string, unknown>> {
    const empresa = await this.getEmpresa();
    const logoPath = (empresa?.logo_path as string) ?? null;
    if (!logoPath) return { ok: true, logo: null };
    const abs = this.absPath(logoPath);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return { ok: true, logo: null };
    const ext = (logoPath.split('.').pop() ?? '').toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? 'image/png';
    const b64 = fs.readFileSync(abs).toString('base64');
    return { ok: true, logo: `data:${mime};base64,${b64}`, path: logoPath };
  }
}
