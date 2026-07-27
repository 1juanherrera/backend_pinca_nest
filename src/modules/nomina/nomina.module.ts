import { Module } from '@nestjs/common';

import { NominaService } from './nomina.service';
import { NominaController } from './nomina.controller';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [ConfiguracionModule],
  controllers: [NominaController],
  providers: [NominaService],
})
export class NominaModule {}
