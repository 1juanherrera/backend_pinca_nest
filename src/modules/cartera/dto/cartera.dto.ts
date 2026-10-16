import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearSaldoInicialDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  cliente_id: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  total: number;

  @IsOptional() @IsString() observaciones?: string;
  @IsOptional() @IsString() fecha_emision?: string;
  @IsOptional() @IsString() fecha_vencimiento?: string;
}

export class RegistrarPagoProveedorDto {
  @IsNotEmpty({ message: 'Orden de compra requerida.' })
  @Type(() => Number)
  @IsInt()
  orden_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  proveedor_id?: number;

  @IsNotEmpty({ message: 'El monto es requerido.' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0.' })
  monto: number;

  @IsOptional() @IsString() tipo?: string;

  @IsNotEmpty({ message: 'Método de pago requerido.' })
  @IsString()
  metodo_pago: string;

  @IsOptional() @IsString() fecha_pago?: string;
  @IsOptional() @IsString() numero_referencia?: string;
  @IsOptional() @IsString() observaciones?: string;
}
