import { Allow } from 'class-validator';

/**
 * DTOs de Auth: usan @Allow() (sin constraints) para que el ValidationPipe global
 * con `whitelist:true` NO borre las props (whitelist elimina toda propiedad sin
 * decoradores de validación). La validación real es MANUAL en el service, para
 * reproducir exactamente mensajes, códigos HTTP y el orden de chequeos de
 * UsuarioController (CI4).
 */

export class LoginDto {
  @Allow() username?: string;
  @Allow() password?: string;
}

export class RefreshDto {
  @Allow() refresh_token?: string;
}

export class CrearUsuarioDto {
  @Allow() username?: string;
  @Allow() password?: string;
  @Allow() nombre?: string;
  @Allow() rol?: string;
}

export class CambiarPasswordDto {
  @Allow() currentPassword?: string;
  @Allow() newPassword?: string;
}

export class ActualizarPerfilDto {
  @Allow() nombre?: string;
}
