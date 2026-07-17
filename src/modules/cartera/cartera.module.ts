import { Module } from '@nestjs/common';

import { CarteraService } from './cartera.service';
import { CarteraController } from './cartera.controller';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [ConfiguracionModule],
  controllers: [CarteraController],
  providers: [CarteraService],
  exports: [CarteraService],
})
export class CarteraModule {}
