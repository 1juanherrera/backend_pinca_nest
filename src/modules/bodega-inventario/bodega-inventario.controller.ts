import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

import { BodegaInventarioService } from './bodega-inventario.service';

/** Réplica de BodegasController::bodega_inventario (ruta /bodegas/inventario/:id). */
@Controller('bodegas')
export class BodegaInventarioController {
  constructor(private readonly svc: BodegaInventarioService) {}

  @Get('inventario/:id')
  async bodegaInventario(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('tipo') tipo?: string,
  ) {
    const data = await this.svc.bodegaInventario(id, page, perPage, search ?? '', tipo ?? '');
    return { status: 'success', data };
  }
}
