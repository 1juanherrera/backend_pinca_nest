import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CatalogoService } from './catalogo.service';
import { CatalogoItemDto } from './dto/catalogo.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/** Réplica fiel de CatalogoController (CI4). */
@Controller('catalogo')
export class CatalogoController {
  private readonly logger = new Logger('catalogo');

  constructor(private readonly catalogo: CatalogoService) {}

  @Get()
  index(
    @Query('tipo') tipo?: string,
    @Query('categoria_id') categoriaId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogo.listar(
      tipo !== undefined && tipo !== '' ? Number(tipo) : undefined,
      categoriaId !== undefined && categoriaId !== '' ? Number(categoriaId) : undefined,
      q,
      page !== undefined && page !== '' ? Number(page) : undefined,
      limit !== undefined && limit !== '' ? Number(limit) : undefined,
    );
  }

  @Get(':id/proveedores')
  proveedores(@Param('id', ParseIntPipe) id: number) {
    return this.catalogo.proveedoresDeItem(id);
  }

  @Get(':id')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.catalogo.detalle(id);
  }

  @Post()
  async create(@Body() dto: CatalogoItemDto) {
    const id = await this.catalogo.create(dto);
    return { status: 201, message: 'Ítem creado en el catálogo', id };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CatalogoItemDto,
  ) {
    await this.catalogo.update(id, dto);
    return { status: 200, message: `Ítem ${id} actualizado correctamente` };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    await this.catalogo.remove(id);
    this.logger.log(`[DELETE_CATALOGO] usuario=${username} id=${id}`);
    return { message: `Ítem ${id} archivado del catálogo` };
  }

  @Post(':id/restore')
  @HttpCode(200)
  async restore(@Param('id', ParseIntPipe) id: number) {
    await this.catalogo.restore(id);
    return { message: `Ítem ${id} restaurado.` };
  }
}
