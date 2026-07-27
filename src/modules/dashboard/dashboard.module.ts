import { Module } from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CarteraModule } from '../cartera/cartera.module';
import { SincronizacionModule } from '../sincronizacion/sincronizacion.module';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [CarteraModule, SincronizacionModule, ConfiguracionModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
