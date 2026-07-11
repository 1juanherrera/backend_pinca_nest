import { Module } from '@nestjs/common';

import { FormulacionesService } from './formulaciones.service';
import { FormulacionesController } from './formulaciones.controller';
import { FormulacionItemController } from './formulacion-item.controller';

@Module({
  controllers: [FormulacionesController, FormulacionItemController],
  providers: [FormulacionesService],
})
export class FormulacionesModule {}
