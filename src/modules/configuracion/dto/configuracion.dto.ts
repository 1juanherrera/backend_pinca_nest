import { IsNotEmpty, IsObject } from 'class-validator';

export class UpdateConfigDto {
  @IsNotEmpty({ message: 'Campo `valor` requerido.' })
  valor: unknown;
}

export class BulkUpdateConfigDto {
  @IsNotEmpty({ message: 'Body debe contener `configs: { clave: valor, … }`.' })
  @IsObject()
  configs: Record<string, unknown>;
}
