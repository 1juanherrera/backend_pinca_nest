import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cotizacion } from './entities/cotizacion.entity';
import { CotizacionesService } from './cotizaciones.service';
import { CotizacionesController } from './cotizaciones.controller';
import { NumeracionModule } from '../numeracion/numeracion.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cotizacion]), NumeracionModule],
  controllers: [CotizacionesController],
  providers: [CotizacionesService],
})
export class CotizacionesModule {}
