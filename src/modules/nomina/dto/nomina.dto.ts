import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// ── Empleados ──────────────────────────────────────────────────────────────
export class CreateEmpleadoDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  nombre: string;

  @IsString() @IsNotEmpty() @MaxLength(30)
  documento: string;

  @IsOptional() @IsString() @MaxLength(80)
  cargo?: string;

  @IsNumber() @Min(0)
  salario_base: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha_ingreso debe ser YYYY-MM-DD' })
  fecha_ingreso?: string;

  @IsOptional() @IsInt() @IsIn([0, 1])
  activo?: number;
}

export class UpdateEmpleadoDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  nombre?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(30)
  documento?: string;

  @IsOptional() @IsString() @MaxLength(80)
  cargo?: string;

  @IsOptional() @IsNumber() @Min(0)
  salario_base?: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha_ingreso debe ser YYYY-MM-DD' })
  fecha_ingreso?: string;

  @IsOptional() @IsInt() @IsIn([0, 1])
  activo?: number;
}

// ── Períodos ───────────────────────────────────────────────────────────────
export class CreatePeriodoDto {
  @IsString() @IsNotEmpty() @MaxLength(60)
  etiqueta: string;

  @IsIn(['mensual', 'quincenal'])
  tipo: 'mensual' | 'quincenal';

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha_inicio debe ser YYYY-MM-DD' })
  fecha_inicio: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha_fin debe ser YYYY-MM-DD' })
  fecha_fin: string;
}

// Ajuste de un renglón de liquidación (días trabajados).
export class UpdateDetalleDto {
  @IsNumber() @Min(0) @Max(31)
  dias_trabajados: number;
}
