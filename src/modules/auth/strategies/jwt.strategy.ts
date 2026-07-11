import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { Usuario } from '../../usuarios/entities/usuario.entity';
import { JwtUser } from '../../../common/decorators/current-user.decorator';

/**
 * Payload de los JWT que emite CI4 (UsuarioController::generarJwt).
 * El usuario va anidado bajo `data`, NO en el root del token.
 */
interface CiJwtPayload {
  iat: number;
  exp: number;
  data: JwtUser;
}

/**
 * Valida los tokens emitidos por CodeIgniter 4 (compatibilidad total).
 *
 * Replica JwtFilter::before de CI4:
 *  1. Extrae "Authorization: Bearer <token>".
 *  2. Verifica firma HS256 con TOKEN_SECRET (passport valida `exp` automáticamente).
 *  3. Compara `data.token_version` contra usuarios.token_version en BD.
 *     Si difiere → 401 (sesión invalidada por cambio de rol/password/logout).
 *  4. Devuelve `data` → queda en request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') as string,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: CiJwtPayload): Promise<JwtUser> {
    const data = payload?.data;
    if (!data || !data.id) {
      throw new UnauthorizedException('Token inválido');
    }

    // Validación de token_version contra BD (invalidación instantánea de sesión).
    const tokenVersion = Number(data.token_version ?? 1);
    const row = await this.usuariosRepo.findOne({
      where: { id_usuarios: data.id },
      select: { token_version: true },
    });

    if (row && Number(row.token_version) !== tokenVersion) {
      throw new UnauthorizedException('Sesión invalidada. Iniciá sesión de nuevo.');
    }

    // Lo que se devuelve acá es request.user (accesible con @CurrentUser()).
    return {
      id: Number(data.id),
      username: data.username,
      nombre: data.nombre ?? null,
      rol: data.rol,
      modulos: Array.isArray(data.modulos) ? data.modulos : [],
      token_version: tokenVersion,
    };
  }
}
