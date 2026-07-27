import { Controller, Get, Query } from '@nestjs/common';

import { InventarioService } from './inventario.service';

/** Réplica fiel de MovimientoInventarioController::index (CI4). Solo lectura. */
@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly inventario: InventarioService) {}

  /** Lista de responsables (username + nombre) para el filtro. Sin datos de rol. */
  @Get('responsables')
  responsables() {
    return this.inventario.responsables();
  }

  @Get()
  index(@Query() q: Record<string, string>) {
    const page = q.page ? Number(q.page) : 1;
    const limit = q.limit ? Number(q.limit) : undefined;
    return this.inventario.movimientos(
      {
        item_general_id: q.item_general_id,
        bodega_id: q.bodega_id,
        tipo_movimiento: q.tipo_movimiento,
        referencia_tipo: q.referencia_tipo,
        responsable: q.responsable,
        fecha_inicio: q.fecha_inicio,
        fecha_fin: q.fecha_fin,
        search: q.search,
      },
      page,
      limit,
    );
  }
}
