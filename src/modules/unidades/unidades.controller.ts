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

import { UnidadesService } from './unidades.service';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * MÓDULO PLANTILLA — réplica fiel de UnidadController (CI4).
 *
 * Shapes EXACTOS (respond() crudo, NO envuelto):
 *   GET  /unidades      → array crudo
 *   GET  /unidades/:id  → objeto crudo
 *   POST /unidades      → 201 { mensaje, id }
 *   PUT  /unidades/:id  → 200 { mensaje, data }
 *   DELETE /unidades/:id→ 200 { mensaje }
 * Errores → { ok:false, msg }. Visor bloqueado en mutaciones por guard global.
 */
@Controller('unidades')
export class UnidadesController {
  private readonly logger = new Logger('unidades');

  constructor(private readonly unidades: UnidadesService) {}

  @Get()
  findAll() {
    return this.unidades.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.unidades.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateUnidadDto) {
    const id = await this.unidades.create(dto);
    return { mensaje: 'unidad creada correctamente', id };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUnidadDto,
  ) {
    await this.unidades.update(id, dto);
    return { mensaje: `unidad con ID ${id} actualizada correctamente`, data: dto };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    await this.unidades.remove(id);
    this.logger.log(`[DELETE_UNIDAD] usuario=${username} id=${id}`);
    return { mensaje: `unidad con ID ${id} eliminada correctamente` };
  }
}
