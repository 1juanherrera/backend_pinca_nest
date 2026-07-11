import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { FormulacionesService } from './formulaciones.service';

/**
 * GET /formulacion_item/:itemId → detalle formateado de la fórmula activa de un
 * producto (el que consume el editor de fórmulas). Shape: { status:'success', data }.
 */
@Controller('formulacion_item')
export class FormulacionItemController {
  constructor(private readonly formulaciones: FormulacionesService) {}

  @Get(':id')
  async byItem(@Param('id', ParseIntPipe) id: number) {
    const data = await this.formulaciones.getFormulacionConMateriasPrimas(id);
    return { status: 'success', data };
  }
}
