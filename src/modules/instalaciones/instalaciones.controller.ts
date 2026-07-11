import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { InstalacionesService } from './instalaciones.service';
import {
  CreateInstalacionDto,
  UpdateInstalacionDto,
} from './dto/instalacion.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/** Réplica fiel de InstalacionesController (CI4). */
@Controller('instalaciones')
export class InstalacionesController {
  private readonly logger = new Logger('instalaciones');

  constructor(private readonly instalaciones: InstalacionesService) {}

  @Get()
  findAll() {
    return this.instalaciones.findAll();
  }

  // Debe declararse antes de ':id' (aunque no colisiona: distinto nº de segmentos).
  @Get('bodegas/:id')
  withBodegas(@Param('id', ParseIntPipe) id: number) {
    return this.instalaciones.withBodegas(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.instalaciones.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateInstalacionDto) {
    const id = await this.instalaciones.create(dto);
    return { mensaje: 'Instalación creada correctamente', id };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInstalacionDto,
  ) {
    await this.instalaciones.update(id, dto);
    return {
      mensaje: `Instalación con ID ${id} actualizada correctamente`,
      data: dto,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    await this.instalaciones.remove(id);
    this.logger.log(`[DELETE_INSTALACION] usuario=${username} id=${id}`);
    return { mensaje: `Instalación con ID ${id} eliminada correctamente` };
  }
}
