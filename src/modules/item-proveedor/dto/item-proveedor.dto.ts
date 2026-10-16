import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemProveedorDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  nombre: string;

  @IsOptional() @IsString() codigo?: string;
  @IsOptional() @IsString() tipo?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) precio_unitario?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) precio_con_iva?: number;
  @IsOptional() @Type(() => Number) @IsInt() disponible?: number;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @Type(() => Number) @IsInt() proveedor_id?: number;
  @IsOptional() @Type(() => Number) @IsInt() item_general_id?: number;
  @IsOptional() @Type(() => Number) @IsInt() unidad_compra_id?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) factor_conversion?: number;
}

export class UpdateItemProveedorDto extends CreateItemProveedorDto {
  @IsOptional()
  @IsString()
  declare nombre: string;
}

export class VincularItemProveedorDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  item_general_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  factor_conversion?: number;
}
