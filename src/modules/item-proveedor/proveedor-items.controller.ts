import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { ItemProveedorService } from './item-proveedor.service';

/** Réplica de ProveedorController::get_item_proveedores (ruta /proveedor_items). */
@Controller('proveedor_items')
export class ProveedorItemsController {
  constructor(private readonly svc: ItemProveedorService) {}

  @Get()
  index() {
    return this.svc.proveedorItems();
  }

  @Get(':id')
  byId(@Param('id', ParseIntPipe) id: number) {
    return this.svc.proveedorItems(id);
  }
}
