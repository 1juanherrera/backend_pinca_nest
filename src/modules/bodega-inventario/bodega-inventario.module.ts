import { Module } from '@nestjs/common';

import { BodegaInventarioService } from './bodega-inventario.service';
import { BodegaInventarioController } from './bodega-inventario.controller';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [ConfiguracionModule],
  controllers: [BodegaInventarioController],
  providers: [BodegaInventarioService],
})
export class BodegaInventarioModule {}
