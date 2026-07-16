import { Controller, Get, HttpException, Param, Post } from '@nestjs/common';

import { CostosProduccionService } from './costos-produccion.service';

/** Réplica fiel de CostosProduccionController (CI4). index/show/historia. */
@Controller('costos-produccion')
export class CostosProduccionController {
  constructor(private readonly svc: CostosProduccionService) {}

  @Get()
  index() {
    return this.svc.getCostosProduccionBatch();
  }

  // Dispara el snapshot del día a demanda (además del cron mensual automático).
  // Idempotente por UNIQUE(item_general_id, fecha). El VisorReadonlyGuard bloquea al visor.
  @Post('snapshot')
  async snapshot() {
    const r = await this.svc.generarSnapshot();
    return { ok: true, msg: `Snapshot de costos generado (${r.total} productos)`, ...r };
  }

  @Get(':id/historia')
  historia(@Param('id') id: string) {
    return this.svc.historia(Number(id));
  }

  @Get(':id')
  async show(@Param('id') id: string) {
    if (!id || Number.isNaN(Number(id))) throw new HttpException({ msg: 'ID inválido.' }, 422);
    const data = await this.svc.getCostoProduccionDetalle(Number(id));
    if (!data) throw new HttpException({ msg: `Producto #${id} no encontrado o sin fórmula activa.` }, 404);
    return data;
  }
}
