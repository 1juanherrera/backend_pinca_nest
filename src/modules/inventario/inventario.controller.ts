import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { InventarioService } from './inventario.service';
import { AjusteManualDto } from './dto/ajuste-manual.dto';
import { TraspasoDto } from './dto/traspaso.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Réplica fiel de InventarioController::global + CapasInventarioController (CI4).
 * Solo lecturas. Las mutaciones (traspaso, ajuste-manual, removeFromBodega) tocan
 * capas y las sigue sirviendo CI4.
 */
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventario: InventarioService) {}

  @Get('global')
  global(@Query('tipo') tipo?: string) {
    return this.inventario.inventarioGlobal(
      tipo !== undefined && tipo !== '' ? Number(tipo) : undefined,
    );
  }

  @Get('capas/bodegas')
  bodegasConCapas() {
    return this.inventario.bodegasConCapas();
  }

  // Fase 3 — ajuste manual (consumo FIFO). Ruta estática antes de ':id/capas'.
  @Post('ajuste-manual')
  @HttpCode(200)
  ajusteManual(
    @Body() dto: AjusteManualDto,
    @CurrentUser('username') username: string,
  ) {
    return this.inventario.ajusteManual(dto, username);
  }

  // Fase 3 — traspaso entre bodegas (mueve capas).
  @Post('traspaso')
  @HttpCode(200)
  async traspaso(
    @Body() dto: TraspasoDto,
    @CurrentUser('username') username: string,
  ) {
    await this.inventario.traspaso(dto, username);
    return { mensaje: 'Traspaso realizado correctamente' };
  }

  // Fase 3 — quitar ítem de una bodega (legacy inventario + audit AJUSTE).
  @Delete(':itemId/bodega/:bodegaId')
  @HttpCode(200)
  async removeFromBodega(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('bodegaId', ParseIntPipe) bodegaId: number,
    @Query('motivo') motivo: string | undefined,
    @CurrentUser('username') username: string,
  ) {
    await this.inventario.removeFromBodega(itemId, bodegaId, username, motivo);
    return { mensaje: 'Ítem eliminado del inventario correctamente' };
  }

  @Get('capas/preparacion/:id')
  consumosPorPreparacion(@Param('id', ParseIntPipe) id: number) {
    if (!id) throw new BadRequestException('preparacion_id requerido.');
    return this.inventario.consumosPorPreparacion(id);
  }

  @Get(':id/capas')
  capas(
    @Param('id', ParseIntPipe) id: number,
    @Query('bodega_id') bodegaId?: string,
  ) {
    if (!id) throw new BadRequestException('item_general_id requerido.');
    return this.inventario.capasDeItem(
      id,
      bodegaId ? Number(bodegaId) : undefined,
    );
  }
}
