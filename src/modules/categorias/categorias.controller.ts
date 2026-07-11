import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';

/**
 * Réplica fiel de CategoriaController (CI4).
 * GET list/detail → crudo; POST → 201 {mensaje,id}; PUT → {mensaje,data}; DELETE → {mensaje}.
 * (categoria::delete NO loguea, a diferencia de otros dominios.)
 */
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Get()
  findAll() {
    return this.categorias.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categorias.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCategoriaDto) {
    const id = await this.categorias.create(dto);
    return { mensaje: 'categoria creada correctamente', id };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoriaDto,
  ) {
    await this.categorias.update(id, dto);
    return { mensaje: `categoria con ID ${id} actualizada correctamente`, data: dto };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categorias.remove(id);
    return { mensaje: `categoria con ID ${id} eliminada correctamente` };
  }
}
