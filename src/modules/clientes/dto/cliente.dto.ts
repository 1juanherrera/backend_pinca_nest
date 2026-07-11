import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * CI4 ClientesController::create → numero_documento required +
 * (nombre_empresa OR nombre_encargado) required. update → todo permit_empty.
 * ⚠️ limite_credito se VALIDA y se hace eco en `data`, pero NO se persiste
 * (allowedFields de CI4 no lo incluye). Se replica ese comportamiento.
 */
export class CreateClienteDto {
  @ValidateIf((o) => !o.nombre_encargado)
  @IsNotEmpty({ message: 'Se requiere nombre_empresa o nombre_encargado' })
  @IsString() @MaxLength(50)
  nombre_empresa?: string;

  @ValidateIf((o) => !o.nombre_empresa)
  @IsNotEmpty({ message: 'Se requiere nombre_empresa o nombre_encargado' })
  @IsString() @MaxLength(50)
  nombre_encargado?: string;

  @IsString() @IsNotEmpty() @MaxLength(20)
  numero_documento: string;

  @IsOptional() @IsString() @MaxLength(50)
  direccion?: string;

  @IsOptional() @IsString() @MaxLength(100)
  ciudad?: string;

  @IsOptional() @IsString() @MaxLength(20)
  telefono?: string;

  @IsOptional() @IsEmail() @MaxLength(50)
  email?: string;

  @IsOptional() @IsInt() @Min(0) @Max(365)
  plazo_pago?: number;

  @IsOptional() @IsInt() @IsIn([1, 2, 3])
  tipo?: number;

  @IsOptional() @IsInt()
  estado?: number;

  @IsOptional() @IsNumber() @Min(0)
  limite_credito?: number;
}

export class UpdateClienteDto {
  @IsOptional() @IsString() @MaxLength(50)
  nombre_empresa?: string;

  @IsOptional() @IsString() @MaxLength(50)
  nombre_encargado?: string;

  @IsOptional() @IsString() @MaxLength(20)
  numero_documento?: string;

  @IsOptional() @IsString() @MaxLength(50)
  direccion?: string;

  @IsOptional() @IsString() @MaxLength(100)
  ciudad?: string;

  @IsOptional() @IsString() @MaxLength(20)
  telefono?: string;

  @IsOptional() @IsEmail() @MaxLength(50)
  email?: string;

  @IsOptional() @IsInt() @Min(0) @Max(365)
  plazo_pago?: number;

  @IsOptional() @IsInt() @IsIn([1, 2, 3])
  tipo?: number;

  @IsOptional() @IsInt()
  estado?: number;

  @IsOptional() @IsNumber() @Min(0)
  limite_credito?: number;
}
