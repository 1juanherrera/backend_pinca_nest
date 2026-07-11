import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un handler o controller como público (salta el JwtAuthGuard global).
 * Equivalente al `except` del filtro jwt en CI4 (login, crear, health, refresh).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
