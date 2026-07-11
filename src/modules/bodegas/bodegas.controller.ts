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

import { BodegasService } from './bodegas.service';
import { CreateBodegaDto, UpdateBodegaDto } from './dto/bodega.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/** Réplica fiel de BodegasController (CI4). Ver nota sobre bodega_inventario en el service. */
@Controller('bodegas')
export class BodegasController {
  private readonly logger = new Logger('bodegas');

  constructor(private readonly bodegas: BodegasService) {}

  @Get()
  findAll() {
    return this.bodegas.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bodegas.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateBodegaDto) {
    const id = await this.bodegas.create(dto);
    return { mensaje: 'Bodega creada correctamente', id };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBodegaDto,
  ) {
    await this.bodegas.update(id, dto);
    return { mensaje: `Bodega con ID ${id} actualizada correctamente`, data: dto };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    await this.bodegas.remove(id);
    this.logger.log(`[DELETE_BODEGA] usuario=${username} id=${id}`);
    return { mensaje: `Bodega con ID ${id} eliminada correctamente` };
  }
}
