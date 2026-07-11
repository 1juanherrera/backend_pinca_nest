import { Module } from '@nestjs/common';

import { FormulacionesCostosService } from './formulaciones-costos.service';
import { FormulacionesCostosController } from './formulaciones-costos.controller';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [ConfiguracionModule],
  controllers: [FormulacionesCostosController],
  providers: [FormulacionesCostosService],
})
export class FormulacionesCostosModule {}
