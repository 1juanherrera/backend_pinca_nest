import { Allow } from 'class-validator';

/** @Allow() para que el ValidationPipe (whitelist) no borre las props. Validación manual en el service. */
export class UpdatePermisosDto {
  @Allow() modulos?: unknown;
}

export class CambiarRolDto {
  @Allow() rol?: string;
}
