import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

/** Línea del BOM: ingrediente | instruccion | fase. */
export class MateriaPrimaLineaDto {
  @IsOptional() @IsInt()
  materia_prima_id?: number;

  @IsOptional() @IsNumber()
  cantidad?: number;

  @IsOptional() @IsNumber()
  porcentaje?: number;

  @IsOptional() @IsString()
  tipo?: string;

  @IsOptional() @IsString()
  texto?: string;

  @IsOptional() @IsString()
  nota?: string;

  @IsOptional() @IsInt()
  orden?: number;
}

export class CreateFormulacionDto {
  @IsInt() @IsPositive()
  item_general_id: number;

  @IsOptional() @IsString() @MaxLength(100)
  nombre?: string;

  @IsOptional() @IsString() @MaxLength(500)
  descripcion?: string;

  @IsOptional() @IsNumber()
  volumen?: number;

  @IsArray()
  @Type(() => MateriaPrimaLineaDto)
  materias_primas: MateriaPrimaLineaDto[];
}

export class UpdateFormulacionDto {
  @IsOptional() @IsInt() @IsPositive()
  item_general_id?: number;

  @IsOptional() @IsString() @MaxLength(100)
  nombre?: string;

  @IsOptional() @IsString() @MaxLength(500)
  descripcion?: string;

  @IsOptional() @IsNumber()
  volumen?: number;

  @IsOptional() @IsString()
  notas_version?: string;

  @IsArray()
  @Type(() => MateriaPrimaLineaDto)
  materias_primas: MateriaPrimaLineaDto[];
}

export class ClonarFormulacionDto {
  @IsInt() @IsPositive()
  from_item_id: number;

  @IsInt() @IsPositive()
  to_item_id: number;

  @IsOptional() @IsString()
  nombre?: string;

  @IsOptional() @IsBoolean()
  force?: boolean;
}
