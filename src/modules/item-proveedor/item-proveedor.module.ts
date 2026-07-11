import { Module } from '@nestjs/common';

import { ItemProveedorService } from './item-proveedor.service';
import { ItemProveedorController } from './item-proveedor.controller';
import { ProveedorItemsController } from './proveedor-items.controller';

@Module({
  controllers: [ItemProveedorController, ProveedorItemsController],
  providers: [ItemProveedorService],
})
export class ItemProveedorModule {}
