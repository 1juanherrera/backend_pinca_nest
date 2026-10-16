import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEmpresaDto {
  @IsOptional() @IsString() @MaxLength(20) nit?: string;
  @IsOptional() @IsString() @MaxLength(200) razon_social?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
  @IsOptional() @IsString() @MaxLength(200) direccion?: string;
  @IsOptional() @IsString() @MaxLength(20) telefono?: string;
  @IsOptional() @IsString() @MaxLength(20) celular?: string;
  @IsOptional() @IsString() @MaxLength(200) pagina_web?: string;
  @IsOptional() @IsString() @MaxLength(200) email?: string;
  @IsOptional() @IsString() @MaxLength(10) locale?: string;
  @IsOptional() @IsString() @MaxLength(10) moneda?: string;
}
