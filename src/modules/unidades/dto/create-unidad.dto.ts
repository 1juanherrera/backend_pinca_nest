import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Validación de entrada para crear una unidad.
 * Reemplaza el `$this->validate([...])` de UnidadController::create en CI4
 * (regla real: nombre required|max[50]).
 */
export class CreateUnidadDto {
  @IsString()
  @MaxLength(50)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsInt()
  estados?: number;

  @IsOptional()
  @IsNumber()
  escala?: number;
}
