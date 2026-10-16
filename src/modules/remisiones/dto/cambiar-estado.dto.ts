import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CambiarEstadoRemisionDto {
  @IsNotEmpty({ message: 'El campo estado es requerido.' })
  @IsString()
  @IsIn(['Pendiente', 'Despachada', 'Facturada', 'Anulada'], {
    message: 'Estado no válido. Permitidos: Pendiente, Despachada, Facturada, Anulada.',
  })
  estado: string;
}
