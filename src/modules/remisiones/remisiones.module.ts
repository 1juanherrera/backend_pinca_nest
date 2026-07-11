import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Remision } from './entities/remision.entity';
import { RemisionesService } from './remisiones.service';
import { RemisionesController } from './remisiones.controller';
import { NumeracionModule } from '../numeracion/numeracion.module';

@Module({
  imports: [TypeOrmModule.forFeature([Remision]), NumeracionModule],
  controllers: [RemisionesController],
  providers: [RemisionesService],
})
export class RemisionesModule {}
