import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Instalacion } from './entities/instalacion.entity';
import { InstalacionesService } from './instalaciones.service';
import { InstalacionesController } from './instalaciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Instalacion])],
  controllers: [InstalacionesController],
  providers: [InstalacionesService],
})
export class InstalacionesModule {}
