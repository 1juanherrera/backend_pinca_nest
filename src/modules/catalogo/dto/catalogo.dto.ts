import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * CI4 CatalogoController valida (create y update, RULES_BASE):
 *   nombre required|max_length[100]; codigo permit_empty|max_length[10];
 *   categoria_id/unidad_id/unidad_almacenaje_id permit_empty|integer.
 * Los campos de ficha técnica no se validan pero SÍ se persisten.
 */
export class CatalogoItemDto {
  @IsString() @MaxLength(100)
  nombre: string;

  @IsOptional() @IsString() @MaxLength(10)
  codigo?: string;

  // tipo acepta numérico o string ('MATERIA PRIMA'|'INSUMO'|'PRODUCTO'...). Se normaliza en el service.
  @IsOptional()
  tipo?: string | number;

  @IsOptional() @IsInt()
  categoria_id?: number;

  @IsOptional() @IsInt()
  unidad_id?: number;

  @IsOptional() @IsInt()
  unidad_almacenaje_id?: number;

  // Ficha técnica (opcional, se persiste tal cual)
  @IsOptional() @IsString() @MaxLength(50) viscosidad?: string;
  @IsOptional() @IsString() @MaxLength(50) p_g?: string;
  @IsOptional() @IsString() @MaxLength(50) color?: string;
  @IsOptional() @IsString() @MaxLength(50) brillo_60?: string;
  @IsOptional() @IsString() @MaxLength(50) secado?: string;
  @IsOptional() @IsString() @MaxLength(50) cubrimiento?: string;
  @IsOptional() @IsString() @MaxLength(50) molienda?: string;
  @IsOptional() @IsString() @MaxLength(50) ph?: string;
  @IsOptional() @IsString() @MaxLength(50) poder_tintoreo?: string;
}
