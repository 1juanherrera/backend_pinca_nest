import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NumeracionDocumento } from './entities/numeracion-documento.entity';
import { NumeracionService } from './numeracion.service';
import { NumeracionController } from './numeracion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NumeracionDocumento])],
  controllers: [NumeracionController],
  providers: [NumeracionService],
  // Exportado para que Cotizaciones/Facturas/OC reusen reservar() en sus creates.
  exports: [NumeracionService],
})
export class NumeracionModule {}
