import { Module } from '@nestjs/common';

import { FactusService } from './factus.service';
import { FacturacionElectronicaController } from './facturacion-electronica.controller';

@Module({
  controllers: [FacturacionElectronicaController],
  providers: [FactusService],
  exports: [FactusService],
})
export class FacturacionElectronicaModule {}
