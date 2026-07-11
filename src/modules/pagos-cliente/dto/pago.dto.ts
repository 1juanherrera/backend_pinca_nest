import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreatePagoDto {
  @IsInt() @IsPositive()
  clientes_id: number;

  @IsNumber() @IsPositive()
  monto: number;

  @IsString()
  fecha_pago: string;

  @IsString()
  metodo_pago: string;

  @IsOptional() @IsInt()
  facturas_id?: number;

  @IsOptional() @IsString()
  tipo?: string;

  @IsOptional() @IsString()
  numero_referencia?: string;

  @IsOptional() @IsString()
  observaciones?: string;
}

/** update: parcial (no revalida como create). */
export class UpdatePagoDto {
  @IsOptional() @IsInt() @IsPositive()
  clientes_id?: number;

  @IsOptional() @IsNumber() @IsPositive()
  monto?: number;

  @IsOptional() @IsString()
  fecha_pago?: string;

  @IsOptional() @IsString()
  metodo_pago?: string;

  @IsOptional() @IsInt()
  facturas_id?: number;

  @IsOptional() @IsString()
  tipo?: string;

  @IsOptional() @IsString()
  numero_referencia?: string;

  @IsOptional() @IsString()
  observaciones?: string;
}
