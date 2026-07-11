import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RemisionLineaDto {
  @IsString() @MaxLength(255)
  descripcion: string;

  @IsNumber() @IsPositive()
  cantidad: number;

  @IsNumber() @Min(0)
  precio_unit: number;

  @IsOptional() @IsInt() @IsPositive()
  item_general_id?: number;

  @IsOptional() @IsInt() @IsPositive()
  bodega_id?: number;

  @IsOptional() @IsNumber()
  subtotal?: number;
}

export class CreateRemisionDto {
  @IsInt() @IsPositive()
  cliente_id: number;

  @IsOptional() @IsString()
  fecha_remision?: string;

  @IsOptional() @IsString() @MaxLength(255)
  direccion_entrega?: string;

  @IsOptional() @IsString()
  observaciones?: string;

  @IsOptional() @IsString()
  numero?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RemisionLineaDto)
  items: RemisionLineaDto[];
}

/** update: whitelist estricta de CI4 (solo estos 4 campos). */
export class UpdateRemisionDto {
  @IsOptional() @IsInt() @IsPositive()
  cliente_id?: number;

  @IsOptional() @IsString()
  fecha_remision?: string;

  @IsOptional() @IsString() @MaxLength(255)
  direccion_entrega?: string;

  @IsOptional() @IsString()
  observaciones?: string;
}
