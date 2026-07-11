import { Module } from '@nestjs/common';

import { CarteraService } from './cartera.service';
import { CarteraController } from './cartera.controller';

@Module({
  controllers: [CarteraController],
  providers: [CarteraService],
  exports: [CarteraService],
})
export class CarteraModule {}
