import { Module } from '@nestjs/common';

import { CostosProduccionService } from './costos-produccion.service';
import { CostosProduccionController } from './costos-produccion.controller';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [ConfiguracionModule],
  controllers: [CostosProduccionController],
  providers: [CostosProduccionService],
})
export class CostosProduccionModule {}
