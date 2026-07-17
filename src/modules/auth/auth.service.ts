import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';

import { ConfiguracionService } from '../configuracion/configuracion.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import {
  ActualizarPerfilDto,
  CambiarPasswordDto,
  CrearUsuarioDto,
  LoginDto,
  RefreshDto,
} from './dto/auth.dto';

type UsuarioRow = Record<string, unknown>;

/** Réplica fiel de UsuarioController (CI4): login/refresh/logout/me/crear/perfil/password. */
@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly cfg: ConfiguracionService,
  ) {}

  private fail(msg: string, status: number, errors?: Record<string, string>): HttpException {
    return new HttpException(errors ? { msg, errors } : { msg }, status);
  }

  private secret(): string {
    return this.config.get<string>('jwt.secret') as string;
  }

  private async modulosDeRol(rol: string): Promise<string[]> {
    const rows: { modulo: string }[] = await this.dataSource.query(
      `SELECT modulo FROM permisos_rol_modulo WHERE rol = ? AND activo = 1`,
      [rol],
    );
    return rows.map((r) => r.modulo);
  }

  private async generarJwt(usuario: UsuarioRow, modulos: string[]): Promise<string> {
    const jwtHoras = Number(await this.cfg.obtener('jwt_expiracion_horas', 8));
    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      iat,
      exp: iat + jwtHoras * 3600,
      data: {
        id: Number(usuario.id_usuarios),
        username: usuario.username,
        nombre: usuario.nombre ?? null,
        rol: usuario.rol ?? 'operador',
        modulos,
        token_version: Number(usuario.token_version ?? 1),
      },
    };
    // iat/exp van en el payload (igual que Firebase\JWT::encode). jsonwebtoken respeta
    // el iat provisto (`payload.iat || now`) y no toca exp si no se pasa expiresIn.
    return jwt.sign(payload, this.secret(), { algorithm: 'HS256' });
  }

  private async crearRefreshToken(usuarioId: number): Promise<string> {
    const plain = crypto.randomBytes(32).toString('hex');
    await this.dataSource.query(
      `INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at, created_at, revoked)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), 0)`,
      [usuarioId, crypto.createHash('sha256').update(plain).digest('hex')],
    );
    return plain;
  }

  private async findByUsername(username: string): Promise<UsuarioRow | null> {
    const rows: UsuarioRow[] = await this.dataSource.query(
      `SELECT * FROM usuarios WHERE username = ? LIMIT 1`,
      [username],
    );
    return rows[0] ?? null;
  }

  private async findById(id: number): Promise<UsuarioRow | null> {
    const rows: UsuarioRow[] = await this.dataSource.query(
      `SELECT * FROM usuarios WHERE id_usuarios = ? LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  // ── POST /login ──────────────────────────────────────────────
  async login(dto: LoginDto, ip: string): Promise<Record<string, unknown>> {
    const username = (dto.username ?? '').trim();
    const password = dto.password ?? '';

    if (username === '') throw this.fail('El campo username es requerido.', 400);
    if (password === '') throw this.fail('El campo password es requerido.', 400);

    const maxIntentos = Number(await this.cfg.obtener('max_intentos_login', 5));
    const ventanaSeg = Number(await this.cfg.obtener('ventana_intentos_segundos', 900));

    const attemptsRows: { n: number }[] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM login_attempts
        WHERE ip_address = ? AND created_at > (NOW() - INTERVAL ? SECOND)`,
      [ip, ventanaSeg],
    );
    if (Number(attemptsRows[0].n) >= maxIntentos) {
      const minutos = Math.ceil(ventanaSeg / 60);
      throw this.fail(`Demasiados intentos fallidos. Espera ${minutos} minutos.`, 429);
    }

    const usuario = await this.findByUsername(username);
    const registrarFallo = () =>
      this.dataSource.query(
        `INSERT INTO login_attempts (ip_address, username_attempt) VALUES (?, ?)`,
        [ip, username],
      );

    // Credenciales inválidas → HTTP 200 con ok:false (igual que CI4 apiFail(...,200)).
    if (!usuario) {
      await registrarFallo();
      return { ok: false, msg: 'Usuario o contraseña incorrectos.' };
    }
    if (!bcrypt.compareSync(password, String(usuario.password))) {
      await registrarFallo();
      return { ok: false, msg: 'Usuario o contraseña incorrectos.' };
    }

    // Login OK → limpiar intentos de esta IP.
    await this.dataSource.query(`DELETE FROM login_attempts WHERE ip_address = ?`, [ip]);

    const rol = String(usuario.rol ?? 'operador');
    const modulos = await this.modulosDeRol(rol);
    const token = await this.generarJwt(usuario, modulos);
    const refreshToken = await this.crearRefreshToken(Number(usuario.id_usuarios));

    return {
      ok: true,
      msg: 'Login exitoso',
      token,
      refresh_token: refreshToken,
      usuario: {
        id: usuario.id_usuarios,
        username: usuario.username,
        nombre: usuario.nombre ?? null,
        rol,
        modulos,
        password_must_change: Number(usuario.password_must_change ?? 0),
      },
    };
  }

  // ── GET /auth/me ─────────────────────────────────────────────
  async me(user: JwtUser): Promise<Record<string, unknown>> {
    const usuario = await this.findById(user.id);
    if (!usuario) throw this.fail('Usuario inexistente.', 401);
    const rol = String(usuario.rol);
    const modulos = await this.modulosDeRol(rol);
    return {
      ok: true,
      msg: '',
      usuario: {
        id: Number(usuario.id_usuarios),
        username: usuario.username,
        nombre: usuario.nombre ?? null,
        rol,
        modulos,
        password_must_change: Number(usuario.password_must_change ?? 0),
      },
    };
  }

  // ── GET /usuarios/mi-actividad ───────────────────────────────
  async miActividad(user: JwtUser): Promise<Record<string, unknown>> {
    const intentos = await this.dataSource.query(
      `SELECT * FROM login_attempts WHERE username_attempt = ? ORDER BY created_at DESC LIMIT 10`,
      [user.username],
    );
    return { ok: true, msg: '', data: intentos };
  }

  // ── PATCH /usuarios/mi-perfil ────────────────────────────────
  async actualizarPerfil(user: JwtUser, dto: ActualizarPerfilDto): Promise<Record<string, unknown>> {
    const nombre = dto.nombre !== undefined && dto.nombre !== null ? String(dto.nombre).trim() : null;
    if (nombre !== null && nombre.length > 100) {
      throw this.fail('El nombre no puede superar 100 caracteres.', 400);
    }
    const nombreFinal = nombre ? nombre : null;
    await this.dataSource.query(`UPDATE usuarios SET nombre = ? WHERE id_usuarios = ?`, [
      nombreFinal,
      user.id,
    ]);

    const modulos = await this.modulosDeRol(user.rol);
    // token_version FRESCO de BD (no el del payload viejo).
    const tvRows: { token_version: number }[] = await this.dataSource.query(
      `SELECT token_version FROM usuarios WHERE id_usuarios = ?`,
      [user.id],
    );
    const tokenVersion = Number(tvRows[0]?.token_version ?? 1);
    const token = await this.generarJwt(
      { id_usuarios: user.id, username: user.username, nombre: nombreFinal, rol: user.rol, token_version: tokenVersion },
      modulos,
    );
    return {
      ok: true,
      msg: 'Perfil actualizado.',
      token,
      usuario: {
        id: user.id,
        username: user.username,
        nombre: nombreFinal,
        rol: user.rol,
        modulos,
      },
    };
  }

  // ── PATCH /usuarios/mi-password ──────────────────────────────
  async cambiarPassword(user: JwtUser, dto: CambiarPasswordDto): Promise<Record<string, unknown>> {
    const currentPassword = dto.currentPassword ?? '';
    const newPassword = dto.newPassword ?? '';

    const minPwd = Number(await this.cfg.obtener('password_min_caracteres', 8));
    if (newPassword.length < minPwd) {
      throw this.fail(`La nueva contraseña debe tener al menos ${minPwd} caracteres.`, 400);
    }

    const usuario = await this.findById(user.id);
    if (!usuario || !bcrypt.compareSync(currentPassword, String(usuario.password))) {
      throw this.fail('La contraseña actual es incorrecta.', 400);
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await this.dataSource.query(
      `UPDATE usuarios SET password = ?, password_must_change = 0 WHERE id_usuarios = ?`,
      [hash, user.id],
    );
    await this.dataSource.query(
      `UPDATE usuarios SET token_version = token_version + 1 WHERE id_usuarios = ?`,
      [user.id],
    );
    const tvRows: { token_version: number }[] = await this.dataSource.query(
      `SELECT token_version FROM usuarios WHERE id_usuarios = ?`,
      [user.id],
    );
    const nuevoTokenVersion = Number(tvRows[0].token_version);

    let nuevoToken: string | null = null;
    try {
      const modulos = await this.modulosDeRol(String(usuario.rol));
      nuevoToken = await this.generarJwt(
        { ...usuario, token_version: nuevoTokenVersion },
        modulos,
      );
    } catch {
      nuevoToken = null;
    }
    return { ok: true, msg: 'Contraseña actualizada correctamente.', token: nuevoToken };
  }

  // ── POST /auth/logout ────────────────────────────────────────
  async logout(user: JwtUser): Promise<Record<string, unknown>> {
    await this.dataSource.query(
      `UPDATE usuarios SET token_version = token_version + 1 WHERE id_usuarios = ?`,
      [user.id],
    );
    await this.dataSource.query(
      `UPDATE refresh_tokens SET revoked = 1 WHERE usuario_id = ? AND revoked = 0`,
      [user.id],
    );
    return { ok: true, msg: 'Sesión cerrada correctamente' };
  }

  // ── POST /auth/refresh (público) ─────────────────────────────
  async refresh(dto: RefreshDto): Promise<Record<string, unknown>> {
    const refreshToken = dto.refresh_token ?? '';
    if (typeof refreshToken !== 'string' || refreshToken === '') {
      throw this.fail('Refresh token inválido o expirado', 401);
    }
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const rows: UsuarioRow[] = await this.dataSource.query(
      `SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > NOW() LIMIT 1`,
      [hash],
    );
    const row = rows[0];
    if (!row) throw this.fail('Refresh token inválido o expirado', 401);

    // Rotación ATÓMICA primero: dos requests concurrentes con el MISMO refresh
    // (reintento de red / doble pestaña) leerían ambos revoked=0; con la guarda
    // `AND revoked=0` solo UNO gana la revocación → solo uno emite par nuevo.
    const revoke: { affectedRows: number } = await this.dataSource.query(
      `UPDATE refresh_tokens SET revoked = 1 WHERE id = ? AND revoked = 0`,
      [row.id],
    );
    if (!revoke.affectedRows) throw this.fail('Refresh token ya fue usado', 401);

    const usuario = await this.findById(Number(row.usuario_id));
    if (!usuario) throw this.fail('Refresh token inválido o expirado', 401);

    const modulos = await this.modulosDeRol(String(usuario.rol ?? 'operador'));
    const token = await this.generarJwt(usuario, modulos);
    const nuevoRefresh = await this.crearRefreshToken(Number(row.usuario_id));

    return { ok: true, msg: '', token, refresh_token: nuevoRefresh };
  }

  // ── POST /crear (solo rol admin) ─────────────────────────────
  async crear(user: JwtUser, dto: CrearUsuarioDto): Promise<Record<string, unknown>> {
    if (user.rol !== 'admin') {
      throw this.fail('Solo administradores pueden crear usuarios.', 403);
    }

    const minPwd = Number(await this.cfg.obtener('password_min_caracteres', 8));
    const username = (dto.username ?? '').trim();
    const password = dto.password ?? '';
    const nombre = (dto.nombre ?? '').trim();
    const rolIn = (dto.rol ?? '').trim();

    // Validación estilo CI4 (una regla por campo, primer fallo gana) → 422.
    const errors: Record<string, string> = {};
    if (username === '') errors.username = 'The username field is required.';
    else if (username.length < 3) errors.username = 'The username field must be at least 3 characters in length.';
    else if (username.length > 50) errors.username = 'The username field cannot exceed 50 characters in length.';
    if (password === '') errors.password = 'The password field is required.';
    else if (password.length < minPwd) errors.password = `The password field must be at least ${minPwd} characters in length.`;
    if (nombre === '') errors.nombre = 'The nombre field is required.';
    else if (nombre.length > 100) errors.nombre = 'The nombre field cannot exceed 100 characters in length.';
    if (rolIn !== '' && !['admin', 'operador', 'visor'].includes(rolIn)) {
      errors.rol = 'The rol field must be one of: admin,operador,visor.';
    }
    if (Object.keys(errors).length) {
      throw this.fail('Datos inválidos', 422, errors);
    }

    const rol = rolIn || 'operador';
    const nombreFinal = nombre || null;

    const existing = await this.findByUsername(username);
    if (existing) throw this.fail('El username ya existe.', 409);

    const hash = bcrypt.hashSync(password, 10);
    await this.dataSource.query(
      `INSERT INTO usuarios (username, nombre, password, rol) VALUES (?, ?, ?, ?)`,
      [username, nombreFinal, hash, rol],
    );

    return { ok: true, msg: 'Usuario creado correctamente' };
  }
}
