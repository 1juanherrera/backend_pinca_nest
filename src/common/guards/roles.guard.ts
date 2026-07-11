import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY, Rol } from '../decorators/roles.decorator';
import { JwtUser } from '../decorators/current-user.decorator';

/**
 * Exige @Roles(...) en el handler/controller. Sin @Roles → no hace nada (pasa).
 * Se usa en endpoints de configuración sensible (Auditoría, Configuración,
 * Empresa, Numeración → admin/superadmin; Roles → superadmin).
 *
 * `superadmin` tiene acceso total: si el handler exige `admin`, superadmin también pasa.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const rol = request.user?.rol;
    if (!rol) throw new ForbiddenException('No autorizado');

    // superadmin siempre pasa; sino, el rol debe estar en la lista requerida.
    if (rol === 'superadmin' || required.includes(rol)) return true;

    throw new ForbiddenException('No tenés permiso para esta acción.');
  }
}
