import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { ItemProveedorService } from './item-proveedor.service';

/** Réplica fiel de ItemProveedorController (CI4). Rutas /item_proveedores. */
@Controller('item_proveedores')
export class ItemProveedorController {
  constructor(private readonly svc: ItemProveedorService) {}

  @Get()
  index(@Query() query: Record<string, string>) {
    return this.svc.getItemProveedores(query);
  }

  @Get(':id')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.svc.show(id);
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

  @Patch(':id/vincular')
  vincular(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.svc.vincular(id, body);
  }
}
