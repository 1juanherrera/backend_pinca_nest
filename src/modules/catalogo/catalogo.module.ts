import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ItemGeneral } from './entities/item-general.entity';
import { CatalogoService } from './catalogo.service';
import { CatalogoController } from './catalogo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ItemGeneral])],
  controllers: [CatalogoController],
  providers: [CatalogoService],
})
export class CatalogoModule {}
