import { Module } from '@nestjs/common';

import { AuditoriaService } from './auditoria.service';
import { AuditoriaController } from './auditoria.controller';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [ConfiguracionModule],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
})
export class AuditoriaModule {}
