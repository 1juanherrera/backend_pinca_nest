import { Module } from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CarteraModule } from '../cartera/cartera.module';
import { SincronizacionModule } from '../sincronizacion/sincronizacion.module';

@Module({
  imports: [CarteraModule, SincronizacionModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
