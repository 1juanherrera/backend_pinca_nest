import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Factura } from './entities/factura.entity';
import { FacturasService } from './facturas.service';
import { FacturasController } from './facturas.controller';
import { NumeracionModule } from '../numeracion/numeracion.module';

@Module({
  imports: [TypeOrmModule.forFeature([Factura]), NumeracionModule],
  controllers: [FacturasController],
  providers: [FacturasService],
  exports: [FacturasService],
})
export class FacturasModule {}
