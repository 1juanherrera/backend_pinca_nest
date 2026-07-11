import { Module } from '@nestjs/common';

import { InventarioService } from './inventario.service';
import { CapasService } from './capas.service';
import { InventarioController } from './inventario.controller';
import { MovimientosController } from './movimientos.controller';

/**
 * Fase 3 — lecturas de inventario/capas/movimientos + motor de ESCRITURA de capas.
 * CapasService se exporta para que OrdenesCompra (recepción) y luego
 * remisiones/preparaciones reusen crearCapa/consumir/recalcular.
 * No usa forFeature: todo es raw SQL vía DataSource.
 */
@Module({
  controllers: [InventarioController, MovimientosController],
  providers: [InventarioService, CapasService],
  exports: [CapasService],
})
export class InventarioModule {}
