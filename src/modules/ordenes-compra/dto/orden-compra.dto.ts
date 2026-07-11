import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrdenCompraLineaDto {
  @IsInt() @IsPositive()
  item_proveedor_id: number;

  @IsNumber() @IsPositive()
  cantidad: number;

  @IsNumber() @Min(0)
  precio_unit: number;

  @IsOptional() @IsInt()
  item_general_id?: number;

  @IsOptional() @IsString() @MaxLength(100)
  descripcion?: string;
}

export class CreateOrdenCompraDto {
  @IsInt() @IsPositive()
  proveedor_id: number;

  @IsOptional() @IsInt() @IsPositive()
  bodegas_id?: number;

  @IsOptional() @IsString()
  fecha?: string;

  @IsOptional() @IsString()
  fecha_esperada?: string;

  @IsOptional() @IsString() @MaxLength(500)
  observaciones?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  iva_pct?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdenCompraLineaDto)
  lineas: OrdenCompraLineaDto[];
}

/** update: solo cabecera editable en estado Borrador (whitelist en el service). */
export class UpdateOrdenCompraDto {
  @IsOptional() @IsInt() @IsPositive()
  proveedor_id?: number;

  @IsOptional() @IsInt() @IsPositive()
  bodegas_id?: number;

  @IsOptional() @IsString()
  fecha?: string;

  @IsOptional() @IsString()
  fecha_esperada?: string;

  @IsOptional() @IsString() @MaxLength(500)
  observaciones?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  iva_pct?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdenCompraLineaDto)
  lineas?: OrdenCompraLineaDto[];
}

export class CambiarEstadoOcDto {
  @IsString()
  estado: string;
}

export class RecibirLineaDto {
  @IsOptional() @IsNumber() @IsPositive()
  cantidad_recibida?: number;

  @IsOptional() @IsString() @MaxLength(100)
  lote_proveedor?: string;
}
