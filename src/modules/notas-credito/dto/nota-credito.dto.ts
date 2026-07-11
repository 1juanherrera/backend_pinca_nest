import {
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNotaCreditoDto {
  @IsInt() @IsPositive()
  facturas_id: number;

  @IsInt() @IsPositive()
  clientes_id: number;

  @IsString()
  fecha: string;

  @IsNumber() @IsPositive()
  monto: number;

  @IsString() @MaxLength(255)
  motivo: string;
}
