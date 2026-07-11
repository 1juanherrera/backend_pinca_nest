import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { ComparadorService } from './comparador.service';

/** Réplica fiel de ComparadorController (CI4). */
@Controller('comparador')
export class ComparadorController {
  constructor(private readonly svc: ComparadorService) {}

  @Get('por_item')
  porItem() {
    return this.svc.porItem();
  }

  @Get('por_proveedor/:id')
  porProveedor(@Param('id', ParseIntPipe) id: number) {
    return this.svc.porProveedor(id);
  }

  @Get('historial/:id')
  historial(@Param('id', ParseIntPipe) id: number) {
    return this.svc.historial(id);
  }
}
