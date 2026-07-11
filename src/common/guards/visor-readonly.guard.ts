import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtUser } from '../decorators/current-user.decorator';

/**
 * Réplica de RbacFilter de CI4: el rol `visor` es de SOLO LECTURA global.
 *
 * Corre DESPUÉS de JwtAuthGuard (necesita request.user). Bloquea toda mutación
 * (POST/PUT/PATCH/DELETE) para el visor, excepto acciones sobre su propia cuenta.
 * operador/admin/superadmin no se ven afectados.
 */
@Injectable()
export class VisorReadonlyGuard implements CanActivate {
  private static readonly SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
  /** Rutas que el visor SÍ puede mutar (su propia cuenta). Comparación por sufijo de segmento. */
  private static readonly WHITELIST = ['usuarios/mi-password', 'auth/logout'];

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const method = request.method.toUpperCase();
    if (VisorReadonlyGuard.SAFE_METHODS.includes(method)) return true;

    const rol = request.user?.rol;
    if (rol !== 'visor') return true; // solo restringimos al visor

    // path sin query, sin slashes de borde. request.path incluye el prefijo global /api.
    const path = request.path.replace(/^\/+|\/+$/g, '').replace(/^api\//, '');
    const allowed = VisorReadonlyGuard.WHITELIST.some(
      (w) => path === w || path.endsWith('/' + w),
    );
    if (allowed) return true;

    throw new ForbiddenException(
      'Tu rol (visor) es de solo lectura: no tenés permiso para esta acción.',
    );
  }
}
