import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * CI4 BodegasController::create valida:
 *   nombre required|max_length[100], instalaciones_id permit_empty|is_natural_no_zero.
 * update: sin validación de campos.
 */
export class CreateBodegaDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsInt()
  estado?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  instalaciones_id?: number;
}

export class UpdateBodegaDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsInt()
  estado?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  instalaciones_id?: number;
}
