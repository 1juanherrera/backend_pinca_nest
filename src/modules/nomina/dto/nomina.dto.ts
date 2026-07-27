import {
  ArrayMinSize,
  IsArray,
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

  // Opcional: subconjunto de empleados activos a incluir (excepciones —
  // licencia, caso en disputa, etc.). Si se omite, se liquida a TODOS los
  // activos (comportamiento histórico).
  @IsOptional() @IsArray() @ArrayMinSize(1) @IsInt({ each: true })
  empleados_ids?: number[];
}

// Ajuste de un renglón de liquidación (días trabajados).
export class UpdateDetalleDto {
  @IsNumber() @Min(0) @Max(31)
  dias_trabajados: number;
}

// Pago masivo del saldo pendiente de TODOS los renglones de un período (ya cerrado).
export class PagarPeriodoDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha_pago debe ser YYYY-MM-DD' })
  fecha_pago: string;

  @IsIn(['efectivo', 'transferencia', 'nequi', 'daviplata', 'cheque', 'otro'])
  medio_pago: string;
}

// Abono parcial a un renglón (empleado dentro de un período).
export class RegistrarAbonoDto {
  @IsNumber() @Min(0.01)
  monto: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha_pago debe ser YYYY-MM-DD' })
  fecha_pago: string;

  @IsIn(['efectivo', 'transferencia', 'nequi', 'daviplata', 'cheque', 'otro'])
  medio_pago: string;

  @IsOptional() @IsString() @MaxLength(255)
  observaciones?: string;
}

// Descuento comercial a un empleado (ej. mercancía sacada para vender).
export class RegistrarDescuentoDto {
  @IsString() @IsNotEmpty() @MaxLength(160)
  concepto: string;

  @IsNumber() @Min(0.01)
  monto: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe ser YYYY-MM-DD' })
  fecha: string;
}
