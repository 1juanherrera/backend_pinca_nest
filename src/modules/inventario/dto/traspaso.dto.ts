import { IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

/** Body de POST /inventario/traspaso (usa item_id, bodega_origen_id, bodega_destino_id). */
export class TraspasoDto {
  @IsInt() @IsPositive()
  item_id: number;

  @IsInt() @IsPositive()
  bodega_origen_id: number;

  @IsInt() @IsPositive()
  bodega_destino_id: number;

  @IsNumber() @IsPositive()
  cantidad: number;

  @IsOptional() @IsString()
  observaciones?: string;
}
