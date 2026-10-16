import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── costos_indirectos ──

export class CreateCostoIndirectoDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'La categoría es obligatoria.' })
  @IsString()
  categoria: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'valor_mensual debe ser >= 0.' })
  valor_mensual?: number;
}

export class UpdateCostoIndirectoDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'valor_mensual debe ser >= 0.' })
  valor_mensual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  activo?: number;
}

export class AsignarCostoIndirectoItemDto {
  @IsNotEmpty({ message: 'costos_indirectos_id es obligatorio.' })
  @Type(() => Number)
  @IsInt()
  costos_indirectos_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_asignado?: number;
}

// ── costos_item ──

export class UpdateCostosItemDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) envase?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) etiqueta?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) bandeja?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) plastico?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costo_mod?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) porcentaje_utilidad?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) volumen?: number;
}
