import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RequisicionItemDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'item_general_id debe ser > 0.' })
  item_general_id: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001, { message: 'cantidad debe ser > 0.' })
  cantidad: number;

  @IsOptional() @Type(() => Number) @IsInt() item_proveedor_id?: number;
  @IsOptional() @Type(() => Number) @IsInt() unidad_id?: number;
  @IsOptional() @IsString() observaciones?: string;
  @IsOptional() @Type(() => Number) @IsInt() preparacion_id?: number;
}

export class CreateRequisicionesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'El cuerpo debe contener al menos una requisición.' })
  @ValidateNested({ each: true })
  @Type(() => RequisicionItemDto)
  items: RequisicionItemDto[];
}

export class SugerirMRPDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  item_general_id: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001, { message: 'cantidad debe ser > 0.' })
  cantidad: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unidad_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  preparacion_id?: number;
}

export class ActualizarEstadoRequisicionDto {
  @IsNotEmpty({ message: 'El campo estado es requerido.' })
  @IsString()
  @IsIn(['SUGERIDA', 'PENDIENTE', 'APROBADA', 'CANCELADA'], {
    message: 'Estado inválido. Valores permitidos: SUGERIDA, PENDIENTE, APROBADA, CANCELADA.',
  })
  estado: string;
}

export class ConvertirAOCDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Se requiere al menos un id.' })
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];

  @IsNotEmpty({ message: 'bodegas_id es requerido.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bodegas_id: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
