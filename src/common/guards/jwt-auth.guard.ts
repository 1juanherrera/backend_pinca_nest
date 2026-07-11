import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global de autenticación. Valida el Bearer vía JwtStrategy.
 *
 * - Respeta @Public() (equivale al `except` del filtro jwt en CI4).
 * - Devuelve los MENSAJES DE ERROR EXACTOS de CI4 para que el frontend no note
 *   la diferencia entre backends:
 *     sin token → "Token no proporcionado"
 *     expirado  → "Token expirado"
 *     inválido / firma mala → "Token inválido"
 *     token_version desfasado → mensaje de JwtStrategy ("Sesión invalidada...")
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
  ): TUser {
    if (err || !user) {
      // Ya venía una UnauthorizedException con mensaje propio (ej. token_version).
      if (err instanceof UnauthorizedException) throw err;

      if (info instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expirado');
      }
      // `info.message === 'No auth token'` cuando falta el header.
      const infoMsg =
        info && typeof info === 'object' && 'message' in info
          ? (info as { message: string }).message
          : '';
      if (infoMsg === 'No auth token') {
        throw new UnauthorizedException('Token no proporcionado');
      }
      throw new UnauthorizedException('Token inválido');
    }
    return user;
  }
}
