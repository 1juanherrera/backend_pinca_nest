import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * CI4 InstalacionesController NO valida campos (solo body no vacío).
 * allowedFields: nombre, descripcion, ciudad, direccion, telefono, id_empresa.
 * El whitelist del ValidationPipe replica ese filtrado de mass-assignment.
 */
export class CreateInstalacionDto {
  @IsOptional() @IsString() @MaxLength(45)
  nombre?: string;

  @IsOptional() @IsString() @MaxLength(500)
  descripcion?: string;

  @IsOptional() @IsString() @MaxLength(45)
  ciudad?: string;

  @IsOptional() @IsString() @MaxLength(100)
  direccion?: string;

  @IsOptional() @IsString() @MaxLength(45)
  telefono?: string;

  @IsOptional() @IsInt()
  id_empresa?: number;
}

export class UpdateInstalacionDto extends CreateInstalacionDto {}
