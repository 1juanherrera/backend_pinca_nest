import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query,
} from '@nestjs/common';

import { ItemService } from './item.service';

/** Réplica fiel de ItemController (CI4) — legacy /item_general. Rutas estáticas antes de :id. */
@Controller()
export class ItemController {
  constructor(private readonly svc: ItemService) {}

  @Get('item_general')
  itemGeneral() {
    return this.svc.itemGeneral();
  }

  @Get('items/materias_disponibles')
  materiasDisponibles() {
    return this.svc.materiasDisponibles();
  }

  @Get('items')
  getItemsAll() {
    return this.svc.getItemsAll();
  }

  @Get('item_general/buscar')
  buscar(@Query('q') q?: string, @Query('limit') limit?: string, @Query('tipos') tipos?: string) {
    return this.svc.buscarFuzzy(q ?? '', limit, tipos);
  }

  @Get('item_general/:id/inventario')
  inventario(@Param('id', ParseIntPipe) id: number) {
    return this.svc.inventarioPorItem(id);
  }

  @Get('item_general/:id')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.svc.show(id);
  }

  @Post('item_general')
  create(@Body() body: Record<string, unknown>) {
    return this.svc.create(body);
  }

  @Put('item_general/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.svc.update(id, body);
  }

  @Patch('item_general/:id/precio-manual')
  updatePrecioManual(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.svc.updatePrecioManual(id, body);
  }

  @Delete('item_general/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
