import { Module } from '@nestjs/common';

import { NotasCreditoService } from './notas-credito.service';
import { NotasCreditoController } from './notas-credito.controller';
import { FacturasModule } from '../facturas/facturas.module';
import { NumeracionModule } from '../numeracion/numeracion.module';

@Module({
  imports: [FacturasModule, NumeracionModule],
  controllers: [NotasCreditoController],
  providers: [NotasCreditoService],
})
export class NotasCreditoModule {}
