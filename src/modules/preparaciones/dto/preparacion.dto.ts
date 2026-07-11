import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PrepDetalleDto {
  @IsInt() @IsPositive()
  item_general_id: number;

  @IsNumber()
  cantidad: number;

  @IsOptional() @IsString()
  modo_consumo?: string;

  @IsOptional() @IsArray()
  capas?: { capa_id: number; cantidad: number }[];

  @IsOptional() @IsInt()
  bodega_id?: number;

  @IsOptional() @IsInt()
  proveedor_id?: number;
}

export class PrepCostoIndirectoDto {
  @IsString()
  nombre: string;

  @IsOptional() @IsString()
  categoria?: string;

  @IsNumber()
  valor_aplicado: number;
}

export class CreatePreparacionDto {
  @IsInt() @IsPositive()
  item_general_id: number;

  @IsNumber() @IsPositive()
  cantidad: number;

  @IsInt() @IsPositive()
  unidad_id: number;

  @IsOptional() @IsString()
  fecha_inicio?: string;

  @IsOptional() @IsString()
  fecha_fin?: string;

  @IsOptional() @IsString() @MaxLength(500)
  observaciones?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrepDetalleDto)
  detalle?: PrepDetalleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrepCostoIndirectoDto)
  costos_indirectos?: PrepCostoIndirectoDto[];
}

export class UpdatePreparacionDto {
  @IsOptional()
  estado?: string | number;

  @IsOptional() @IsString() @MaxLength(500)
  observaciones?: string;

  @IsOptional() @IsString()
  fecha_inicio?: string;

  @IsOptional() @IsString()
  fecha_fin?: string;
}
