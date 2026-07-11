import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type Rol = 'superadmin' | 'admin' | 'operador' | 'visor';

/**
 * Exige uno de los roles indicados para acceder al handler.
 * Ej: @Roles('admin', 'superadmin') sobre endpoints de configuración sensible.
 * `superadmin` se trata como acceso total en RolesGuard.
 */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
