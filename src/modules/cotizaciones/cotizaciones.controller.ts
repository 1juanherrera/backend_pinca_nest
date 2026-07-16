import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CotizacionesService } from './cotizaciones.service';
import {
  CambiarEstadoDto,
  CreateCotizacionDto,
  UpdateCotizacionDto,
} from './dto/cotizacion.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Réplica fiel de CotizacionesController (CI4). `convertir` se queda en CI4.
 * GET list/detalle → crudo; create/update/cambiarEstado → { status, message, data }.
 */
@Controller('cotizaciones')
export class CotizacionesController {
  private readonly logger = new Logger('cotizaciones');

  constructor(private readonly cotizaciones: CotizacionesService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    // Sin `page` → array completo (retrocompat); con `page` → { data, meta, stats }.
    return this.cotizaciones.findAll(query);
  }

  @Get(':id/detalle')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.cotizaciones.detalle(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cotizaciones.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCotizacionDto) {
    const data = await this.cotizaciones.create(dto);
    return { status: 201, message: 'Cotización creada exitosamente', data };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCotizacionDto,
  ) {
    const data = await this.cotizaciones.update(id, dto);
    return {
      status: 200,
      message: `Cotización ${id} actualizada correctamente`,
      data,
    };
  }

  @Post(':id/convertir')
  convertir(@Param('id', ParseIntPipe) id: number) {
    return this.cotizaciones.convertir(id);
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    const data = await this.cotizaciones.cambiarEstado(id, dto.estado);
    return { status: 200, message: `Cotización marcada como ${dto.estado}`, data };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    await this.cotizaciones.remove(id);
    this.logger.log(`[COTIZACION_DELETE] id=${id} por ${username}`);
    return { message: `Cotización ${id} eliminada` };
  }
}
