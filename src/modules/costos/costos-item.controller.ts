import { Body, Controller, Param, ParseIntPipe, Put } from '@nestjs/common';

import { CostosItemService } from './costos-item.service';
import { UpdateCostosItemDto } from './dto/costos.dto';

/** Réplica fiel de CostosItemController (CI4). */
@Controller('costos_item')
export class CostosItemController {
  constructor(private readonly svc: CostosItemService) {}

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCostosItemDto) {
    return this.svc.update(id, body as unknown as Record<string, unknown>);
  }
}
