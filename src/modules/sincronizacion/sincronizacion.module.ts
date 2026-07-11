import { Module } from '@nestjs/common';

import { SincronizacionService } from './sincronizacion.service';
import { SincronizacionController } from './sincronizacion.controller';
import { InventarioModule } from '../inventario/inventario.module';
import { ItemModule } from '../item/item.module';

@Module({
  imports: [InventarioModule, ItemModule],
  controllers: [SincronizacionController],
  providers: [SincronizacionService],
  exports: [SincronizacionService],
})
export class SincronizacionModule {}
