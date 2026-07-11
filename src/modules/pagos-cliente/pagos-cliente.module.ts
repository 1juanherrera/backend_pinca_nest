import { Module } from '@nestjs/common';

import { PagosClienteService } from './pagos-cliente.service';
import { PagosClienteController } from './pagos-cliente.controller';
import { FacturasModule } from '../facturas/facturas.module';

@Module({
  imports: [FacturasModule],
  controllers: [PagosClienteController],
  providers: [PagosClienteService],
})
export class PagosClienteModule {}
