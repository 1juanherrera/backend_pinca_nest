import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { OrdenesCompraService } from './ordenes-compra.service';
import {
  CambiarEstadoOcDto,
  CreateOrdenCompraDto,
  RecibirLineaDto,
  UpdateOrdenCompraDto,
} from './dto/orden-compra.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Réplica fiel de OrdenesCompraController (CI4) — parte SAFE-NOW.
 * Recepción (recibir, recibir-prorrateado, lote-sugerido) NO se migra:
 * depende de capas de costo (Fase 3) y la sirve CI4.
 */
@Controller('ordenes_compra')
export class OrdenesCompraController {
  constructor(private readonly oc: OrdenesCompraService) {}

  @Get()
  index(@Query() query: Record<string, string>) {
    return this.oc.listar(query);
  }

  @Get(':id/detalle')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.oc.detalle(id);
  }

  @Get(':id/lote-sugerido')
  loteSugerido(@Param('id', ParseIntPipe) id: number) {
    return this.oc.loteSugerido(id);
  }

  @Get(':id')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.oc.show(id);
  }

  @Post()
  async create(@Body() dto: CreateOrdenCompraDto) {
    const { id, numero } = await this.oc.create(dto);
    return { mensaje: 'Orden creada correctamente', id, numero };
  }

  // Fase 3 — recepción de línea (crea capa de costo). Ruta estática antes de /:id.
  @Post(':idOrden/recibir/:idDetalle')
  @HttpCode(200) // CI4 responde 200 (respond), no 201
  recibirLinea(
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: RecibirLineaDto,
    @CurrentUser('username') username: string,
  ) {
    return this.oc.recibirLinea(idOrden, idDetalle, dto, username);
  }

  @Post(':id/recibir-prorrateado')
  @HttpCode(200)
  recibirProrrateado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @CurrentUser('username') username: string,
  ) {
    return this.oc.recibirLoteProrrateado(id, body, username);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrdenCompraDto,
  ) {
    await this.oc.update(id, dto);
    return { mensaje: `Orden ${id} actualizada correctamente` };
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoOcDto,
  ) {
    await this.oc.cambiarEstado(id, dto.estado);
    return { mensaje: `Estado actualizado a ${dto.estado}` };
  }

  @Roles('admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    await this.oc.remove(id, username);
    return { mensaje: `Orden ${id} eliminada correctamente` };
  }
}
