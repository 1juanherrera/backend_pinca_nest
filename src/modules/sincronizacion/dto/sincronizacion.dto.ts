import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MergeDto {
  @IsNotEmpty({ message: 'keep_id es requerido.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  keep_id: number;

  @IsNotEmpty({ message: 'remove_id es requerido.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  remove_id: number;
}

export class IaClasificarDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tipo?: number;
}

export class ActualizarClusterDto {
  @IsOptional() @IsString() estado?: string;
  @IsOptional() @IsString() nombre_unificado?: string;
  @IsOptional() @Type(() => Number) @IsInt() item_principal_id?: number;
}

export class MoverItemClusterDto {
  @IsOptional()
  @IsString()
  rol?: string;
}

export class ReemplazarEnFormulasDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  origen_id: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  destino_id: number;

  @IsOptional() scope_formulaciones?: number[];
}
