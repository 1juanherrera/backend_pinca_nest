import { Module } from '@nestjs/common';

import { RequisicionesService } from './requisiciones.service';
import { RequisicionesController } from './requisiciones.controller';
import { NumeracionModule } from '../numeracion/numeracion.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [NumeracionModule, NotificacionesModule],
  controllers: [RequisicionesController],
  providers: [RequisicionesService],
})
export class RequisicionesModule {}
