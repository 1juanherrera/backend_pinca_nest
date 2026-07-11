import { Module } from '@nestjs/common';

import { SaludSistemaService } from './salud-sistema.service';
import { SaludSistemaController } from './salud-sistema.controller';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [ConfiguracionModule],
  controllers: [SaludSistemaController],
  providers: [SaludSistemaService],
})
export class SaludSistemaModule {}
