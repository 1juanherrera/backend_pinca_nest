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

import { ProveedoresService } from './proveedores.service';
import {
  CreateProveedorDto,
  UpdateProveedorDto,
} from './dto/proveedor.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/** Réplica fiel de ProveedorController (CI4). Sin GET /:id (no existe en CI4). */
@Controller('proveedores')
export class ProveedoresController {
  private readonly logger = new Logger('proveedores');

  constructor(private readonly proveedores: ProveedoresService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.proveedores.findAll(query);
  }

  @Post()
  async create(@Body() dto: CreateProveedorDto) {
    const id = await this.proveedores.create(dto);
    return { mensaje: 'Proveedor creado correctamente', id };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProveedorDto,
  ) {
    await this.proveedores.update(id, dto);
    return {
      mensaje: `Proveedor con ID ${id} actualizado correctamente`,
      data: dto,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    await this.proveedores.remove(id);
    this.logger.log(`[DELETE_PROVEEDOR] usuario=${username} id=${id}`);
    return { mensaje: `Proveedor con ID ${id} archivado correctamente` };
  }

  @Post(':id/restore')
  @HttpCode(200) // CI4 restore devuelve 200 (respond), no 201
  async restore(@Param('id', ParseIntPipe) id: number) {
    await this.proveedores.restore(id);
    return { mensaje: `Proveedor con ID ${id} restaurado correctamente` };
  }
}
