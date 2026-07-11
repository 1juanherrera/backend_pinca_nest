import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * CI4 ProveedorController::create:
 *   numero_documento required; nombre_empresa/nombre_encargado required_without mutuo.
 * update: todos permit_empty (parcial). Longitudes = tamaño real de columna
 * (la validación CI4 tenía límites más chicos/desactualizados; usar el de BD es
 * un superconjunto seguro que no rechaza nada que CI4 aceptaba).
 */
export class CreateProveedorDto {
  @ValidateIf((o) => !o.nombre_encargado)
  @IsNotEmpty({ message: 'Se requiere nombre_empresa o nombre_encargado' })
  @IsString()
  @MaxLength(60)
  nombre_empresa?: string;

  @ValidateIf((o) => !o.nombre_empresa)
  @IsNotEmpty({ message: 'Se requiere nombre_empresa o nombre_encargado' })
  @IsString()
  @MaxLength(60)
  nombre_encargado?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  numero_documento: string;

  @IsOptional() @IsString() @MaxLength(100)
  direccion?: string;

  @IsOptional() @IsString() @MaxLength(30)
  telefono?: string;

  @IsOptional() @IsEmail() @MaxLength(60)
  email?: string;
}

export class UpdateProveedorDto {
  @IsOptional() @IsString() @MaxLength(60)
  nombre_empresa?: string;

  @IsOptional() @IsString() @MaxLength(60)
  nombre_encargado?: string;

  @IsOptional() @IsString() @MaxLength(15)
  numero_documento?: string;

  @IsOptional() @IsString() @MaxLength(100)
  direccion?: string;

  @IsOptional() @IsString() @MaxLength(30)
  telefono?: string;

  @IsOptional() @IsEmail() @MaxLength(60)
  email?: string;
}
