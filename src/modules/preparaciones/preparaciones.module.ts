import { Module } from '@nestjs/common';

import { PreparacionesService } from './preparaciones.service';
import { PreparacionesController } from './preparaciones.controller';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [InventarioModule],
  controllers: [PreparacionesController],
  providers: [PreparacionesService],
})
export class PreparacionesModule {}
