import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  codigo?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoria_id?: number;

  @IsOptional() @IsString() viscosidad?: string;
  @IsOptional() @IsString() p_g?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() brillo_60?: string;
  @IsOptional() @IsString() secado?: string;
  @IsOptional() @IsString() cubrimiento?: string;
  @IsOptional() @IsString() molienda?: string;
  @IsOptional() @IsString() ph?: string;
  @IsOptional() @IsString() poder_tintoreo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  unidad_id?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costo_unitario?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costo_mp_galon?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costo_cunete?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costo_tambor?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costo_mp_kg?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) envase?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) etiqueta?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) bandeja?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) plastico?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) precio_venta?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costo_mod?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) volumen?: number;
  @IsOptional() @IsString() metodo_calculo?: string;

  @IsOptional() descripcion_formula?: string;
  @IsOptional() detalle?: unknown[];
  @IsOptional() @Type(() => Number) @IsNumber() cantidad_bodega?: number;
  @IsOptional() @Type(() => Number) @IsInt() bodegas_id?: number;
}

export class UpdateItemDto extends CreateItemDto {
  @IsOptional()
  @IsString()
  declare nombre: string;
}

export class UpdatePrecioManualDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_venta_manual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  precio_manual_activo?: number;
}
