import { IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export const TIPOS_GESTION = ['llamada', 'email', 'visita', 'whatsapp'];

export class CreateGestionCobroDto {
  @IsInt() @IsPositive()
  facturas_id: number;

  @IsInt() @IsPositive()
  clientes_id: number;

  @IsIn(TIPOS_GESTION)
  tipo: string;

  @IsOptional() @IsString()
  resultado?: string;

  @IsOptional() @IsString()
  proxima_gestion?: string;
}

export class UpdateGestionCobroDto {
  @IsOptional() @IsInt() @IsPositive()
  facturas_id?: number;

  @IsOptional() @IsInt() @IsPositive()
  clientes_id?: number;

  @IsOptional() @IsIn(TIPOS_GESTION)
  tipo?: string;

  @IsOptional() @IsString()
  resultado?: string;

  @IsOptional() @IsString()
  proxima_gestion?: string;
}
