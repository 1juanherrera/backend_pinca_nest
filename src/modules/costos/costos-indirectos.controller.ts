import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put,
} from '@nestjs/common';

import { CostosIndirectosService } from './costos-indirectos.service';

/** Réplica fiel de CostosIndirectosController (CI4). Rutas específicas antes de :id. */
@Controller('costos_indirectos')
export class CostosIndirectosController {
  constructor(private readonly svc: CostosIndirectosService) {}

  @Get('resumen')
  resumen() {
    return this.svc.resumen();
  }

  @Get('item/:itemId')
  costosItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.svc.costosItem(itemId);
  }

  @Post('item/:itemId')
  asignarItem(@Param('itemId', ParseIntPipe) itemId: number, @Body() body: Record<string, unknown>) {
    return this.svc.asignarItem(itemId, body);
  }

  @Get(':id')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.svc.show(id);
  }

  @Get()
  index() {
    return this.svc.listar();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.svc.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
