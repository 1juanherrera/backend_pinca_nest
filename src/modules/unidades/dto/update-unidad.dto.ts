import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Actualización parcial de una unidad (PUT/PATCH). Todos los campos opcionales.
 * (Se escribe explícito para no depender de @nestjs/mapped-types.)
 */
export class UpdateUnidadDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsInt()
  estados?: number;

  @IsOptional()
  @IsNumber()
  escala?: number;
}
