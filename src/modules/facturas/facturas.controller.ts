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

import { FacturasService } from './facturas.service';
import {
  BulkCambiarEstadoDto,
  CambiarEstadoFacturaDto,
  CreateFacturaDto,
  UpdateFacturaDto,
} from './dto/factura.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/** Réplica fiel de FacturasController (CI4). */
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturas: FacturasService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    // Sin `page` → array completo (retrocompat); con `page` → { data, meta, stats }.
    return this.facturas.findAll(query);
  }

  @Get(':id/detalle')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.facturas.detalle(id);
  }

  @Get(':id/abonos')
  abonos(@Param('id', ParseIntPipe) id: number) {
    return this.facturas.abonos(id);
  }

  @Get(':id/remision')
  remision(@Param('id', ParseIntPipe) id: number) {
    return this.facturas.remision(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facturas.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateFacturaDto) {
    const data = await this.facturas.create(dto);
    return { status: 201, message: 'Factura creada exitosamente', data };
  }

  // Ruta estática — declarada antes de las paramétricas de mutación.
  @Post('bulk/cambiar-estado')
  async bulk(
    @Body() dto: BulkCambiarEstadoDto,
    @CurrentUser('username') username: string,
  ) {
    const { actualizadas, fallidas } = await this.facturas.bulkCambiarEstado(
      dto.ids,
      dto.estado,
      username,
    );
    return {
      ok: true,
      msg: `Se actualizaron ${actualizadas} factura(s) a ${dto.estado}.`,
      actualizadas,
      fallidas,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFacturaDto,
  ) {
    const data = await this.facturas.update(id, dto);
    return {
      status: 200,
      message: `Factura ${id} actualizada correctamente`,
      data,
    };
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoFacturaDto,
    @CurrentUser('username') username: string,
  ) {
    const data = await this.facturas.cambiarEstado(id, dto.estado, username);
    return { status: 200, message: `Factura marcada como ${dto.estado}`, data };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    await this.facturas.remove(id, username);
    return { message: `Factura ${id} eliminada` };
  }
}
