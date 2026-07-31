import { Module } from '@nestjs/common';

import { FactusService } from './factus.service';
import { TirillaService } from './tirilla.service';
import { FacturacionElectronicaController } from './facturacion-electronica.controller';

@Module({
  controllers: [FacturacionElectronicaController],
  providers: [FactusService, TirillaService],
  exports: [FactusService, TirillaService],
})
export class FacturacionElectronicaModule {}
