import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Datos del usuario autenticado, tal como vienen en el payload JWT de CI4 (`data`).
 * Es lo que JwtStrategy.validate() devuelve y se adjunta a request.user.
 */
export interface JwtUser {
  id: number;
  username: string;
  nombre: string | null;
  rol: 'superadmin' | 'admin' | 'operador' | 'visor';
  modulos: string[];
  token_version: number;
}

/**
 * @CurrentUser() en un handler → inyecta el JwtUser.
 * @CurrentUser('rol') → inyecta solo esa propiedad.
 * Reemplaza el trait JwtUserAware de CI4 ($this->getUsername(), getUserRol(), ...).
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
