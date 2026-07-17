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

export class FacturaLineaDto {
  @IsString() @MaxLength(255)
  descripcion: string;

  @IsNumber() @IsPositive()
  cantidad: number;

  @IsNumber() @Min(0)
  precio_unit: number;
}

export class CreateFacturaDto {
  @IsInt() @IsPositive()
  cliente_id: number;

  @IsOptional() @IsString()
  fecha_emision?: string;

  @IsOptional() @IsString()
  fecha_vencimiento?: string;

  @IsOptional() @IsNumber()
  subtotal?: number;

  @IsOptional() @IsNumber() @Min(0)
  descuento?: number;

  @IsOptional() @IsNumber() @Min(0)
  impuestos?: number;

  @IsOptional() @IsNumber() @Min(0)
  retencion?: number;

  @IsNumber() @Min(0)
  total: number;

  @IsOptional() @IsString() @MaxLength(20)
  numero?: string;

  @IsOptional() @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacturaLineaDto)
  items: FacturaLineaDto[];
}

/** update: edición de cabecera + líneas (opcional). Si vienen `items`, se
 *  reemplaza el detalle completo (DELETE + re-INSERT) dentro de la transacción. */
export class UpdateFacturaDto {
  @IsOptional() @IsString()
  fecha_emision?: string;

  @IsOptional() @IsString()
  fecha_vencimiento?: string;

  @IsOptional() @IsNumber()
  subtotal?: number;

  @IsOptional() @IsNumber() @Min(0)
  descuento?: number;

  @IsOptional() @IsNumber() @Min(0)
  impuestos?: number;

  @IsOptional() @IsNumber() @Min(0)
  retencion?: number;

  @IsOptional() @IsNumber() @Min(0)
  total?: number;

  @IsOptional() @IsString()
  observaciones?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacturaLineaDto)
  items?: FacturaLineaDto[];
}

export class CambiarEstadoFacturaDto {
  @IsString()
  estado: string;
}

export class BulkCambiarEstadoDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];

  @IsString()
  estado: string;
}
