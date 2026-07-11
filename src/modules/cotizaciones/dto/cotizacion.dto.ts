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

export class CotizacionLineaDto {
  @IsString()
  @MaxLength(255)
  descripcion: string;

  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsNumber()
  @Min(0)
  precio_unit: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento_pct?: number;
}

export class CreateCotizacionDto {
  @IsInt()
  @IsPositive()
  cliente_id: number;

  @IsString()
  fecha_cotizacion: string;

  @IsString()
  fecha_vencimiento: string;

  @IsOptional() @IsNumber() @Min(0)
  descuento?: number;

  @IsOptional() @IsNumber() @Min(0)
  impuestos?: number;

  @IsOptional() @IsNumber() @Min(0)
  retencion?: number;

  @IsOptional() @IsString()
  observaciones?: string;

  @IsOptional() @IsString() @MaxLength(20)
  numero?: string;

  @IsOptional() @IsString()
  estado?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CotizacionLineaDto)
  items: CotizacionLineaDto[];
}

/** update: edición de cabecera, sin items (CI4 hace unset de items). */
export class UpdateCotizacionDto {
  @IsOptional() @IsInt() @IsPositive()
  cliente_id?: number;

  @IsOptional() @IsString()
  fecha_cotizacion?: string;

  @IsOptional() @IsString()
  fecha_vencimiento?: string;

  @IsOptional() @IsNumber() @Min(0)
  descuento?: number;

  @IsOptional() @IsNumber() @Min(0)
  impuestos?: number;

  @IsOptional() @IsNumber() @Min(0)
  retencion?: number;

  @IsOptional() @IsString()
  observaciones?: string;
}

export class CambiarEstadoDto {
  @IsString()
  estado: string;
}
