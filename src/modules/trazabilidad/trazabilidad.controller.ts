import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

import { TrazabilidadService } from './trazabilidad.service';

/** Réplica fiel de TrazabilidadController (CI4). */
@Controller('trazabilidad')
export class TrazabilidadController {
  constructor(private readonly svc: TrazabilidadService) {}

  @Get('lotes')
  lotes(@Query('q') q?: string) {
    return this.svc.lotes(q);
  }

  @Get('preparacion/:id')
  porPreparacion(@Param('id', ParseIntPipe) id: number) {
    return this.svc.porPreparacion(id);
  }

  @Get('lote/:lote')
  porLote(@Param('lote') lote: string) {
    return this.svc.porLote(lote);
  }
}
