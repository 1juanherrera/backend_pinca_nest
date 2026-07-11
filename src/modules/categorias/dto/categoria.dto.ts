import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * CI4 CategoriaController::create valida: nombre required|max_length[100].
 * update: sin validación de campos (solo body no vacío).
 */
export class CreateCategoriaDto {
  @IsString()
  @MaxLength(100)
  nombre: string;
}

export class UpdateCategoriaDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;
}
