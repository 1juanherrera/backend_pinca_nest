import { Module } from '@nestjs/common';

import { GestionesCobroService } from './gestiones-cobro.service';
import { GestionesCobroController } from './gestiones-cobro.controller';

@Module({
  controllers: [GestionesCobroController],
  providers: [GestionesCobroService],
})
export class GestionesCobroModule {}
