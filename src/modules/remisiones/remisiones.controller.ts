import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { RemisionesService } from './remisiones.service';
import { CreateRemisionDto, UpdateRemisionDto } from './dto/remision.dto';

/**
 * Réplica fiel de RemisionesController (CI4) — parte SAFE-NOW.
 * cambiarEstado (despacho→capas) y convertir (→factura) los sirve CI4.
 */
@Controller('remisiones')
export class RemisionesController {
  constructor(private readonly remisiones: RemisionesService) {}

  @Get()
  index(
    @Query('cliente_id') clienteId?: string,
    @Query('factura_id') facturaId?: string,
  ) {
    return this.remisiones.index(
      clienteId ? Number(clienteId) : undefined,
      facturaId ? Number(facturaId) : undefined,
    );
  }

  @Get(':id/detalle')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.remisiones.getDetalle(id);
  }

  @Get(':id')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.remisiones.getById(id);
  }

  @Post()
  async create(@Body() dto: CreateRemisionDto) {
    const data = await this.remisiones.create(dto);
    return { status: 201, message: 'Remisión creada exitosamente', data };
  }

  @Post(':id/convertir')
  convertir(@Param('id', ParseIntPipe) id: number) {
    return this.remisiones.convertir(id);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.remisiones.cambiarEstado(id, body);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRemisionDto,
  ) {
    const data = await this.remisiones.update(id, dto);
    return {
      status: 200,
      message: `Remisión ${id} actualizada correctamente`,
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.remisiones.remove(id);
    return { message: `Remisión ${id} eliminada` };
  }
}
