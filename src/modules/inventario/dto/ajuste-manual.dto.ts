import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * CI4 InventarioController::ajusteManual valida: item_general_id/bodega_id > 0,
 * cantidad > 0, motivo ∈ {rotura,derrame,conteo,vencimiento,otro}.
 */
export class AjusteManualDto {
  @IsInt() @IsPositive()
  item_general_id: number;

  @IsInt() @IsPositive()
  bodega_id: number;

  @IsNumber() @IsPositive()
  cantidad: number;

  @IsString()
  @IsIn(['rotura', 'derrame', 'conteo', 'vencimiento', 'otro'])
  motivo: string;

  @IsOptional() @IsString()
  observacion?: string;
}
