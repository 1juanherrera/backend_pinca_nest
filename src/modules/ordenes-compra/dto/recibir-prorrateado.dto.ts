import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecibirProrrateadoDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0.01, { message: 'El precio total pagado debe ser mayor a 0.' })
  precio_total_pagado: number;

  @IsOptional()
  @IsString()
  lote_proveedor?: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'El prorrateo necesita al menos 2 líneas.' })
  lineas: Record<string, unknown>[];
}
