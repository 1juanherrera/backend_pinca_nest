import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Unidad } from './entities/unidad.entity';
import { UnidadesService } from './unidades.service';
import { UnidadesController } from './unidades.controller';

/**
 * Módulo de Unidades — plantilla de feature module.
 * Patrón a replicar para categorias, bodegas, proveedores, clientes, etc.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Unidad])],
  controllers: [UnidadesController],
  providers: [UnidadesService],
  exports: [UnidadesService],
})
export class UnidadesModule {}
