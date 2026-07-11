import { Module } from '@nestjs/common';

import { NotificacionService } from './notificacion.service';
import { NotificacionesController } from './notificaciones.controller';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [ConfiguracionModule],
  controllers: [NotificacionesController],
  providers: [NotificacionService],
  exports: [NotificacionService],
})
export class NotificacionesModule {}
