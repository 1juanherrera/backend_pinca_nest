import { Module } from '@nestjs/common';

import { CostosItemService } from './costos-item.service';
import { CostosItemController } from './costos-item.controller';
import { CostosIndirectosService } from './costos-indirectos.service';
import { CostosIndirectosController } from './costos-indirectos.controller';

@Module({
  controllers: [CostosItemController, CostosIndirectosController],
  providers: [CostosItemService, CostosIndirectosService],
})
export class CostosModule {}
