import { Module } from '@nestjs/common';

import { ComparadorService } from './comparador.service';
import { ComparadorController } from './comparador.controller';

@Module({
  controllers: [ComparadorController],
  providers: [ComparadorService],
})
export class ComparadorModule {}
