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

import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

/** Réplica fiel de ClientesController (CI4). */
@Controller('clientes')
export class ClientesController {
  private readonly logger = new Logger('clientes');

  constructor(private readonly clientes: ClientesService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.clientes.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientes.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateClienteDto) {
    const id = await this.clientes.create(dto);
    return { mensaje: 'Cliente creado correctamente', id };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    await this.clientes.update(id, dto);
    return { mensaje: `Cliente con ID ${id} actualizado correctamente`, data: dto };
  }

  @Roles('admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    await this.clientes.remove(id);
    this.logger.log(`[CLIENTE_DELETE] id=${id} por ${username}`);
    return { mensaje: `Cliente con ID ${id} archivado correctamente` };
  }

  @Post(':id/restore')
  @HttpCode(200)
  async restore(@Param('id', ParseIntPipe) id: number) {
    await this.clientes.restore(id);
    return { mensaje: `Cliente con ID ${id} restaurado correctamente` };
  }
}
