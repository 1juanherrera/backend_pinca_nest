import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { NotasCreditoService } from './notas-credito.service';
import { CreateNotaCreditoDto } from './dto/nota-credito.dto';

/** Réplica fiel de NotasCreditoController (CI4). Sin PUT/DELETE; solo crear y anular. */
@Controller('notas_credito')
export class NotasCreditoController {
  constructor(private readonly notas: NotasCreditoService) {}

  @Get()
  index(
    @Query('cliente_id') clienteId?: string,
    @Query('factura_id') facturaId?: string,
  ) {
    return this.notas.index(
      clienteId ? Number(clienteId) : undefined,
      facturaId ? Number(facturaId) : undefined,
    );
  }

  @Get(':id')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.notas.show(id);
  }

  @Post()
  create(@Body() dto: CreateNotaCreditoDto) {
    return this.notas.create(dto);
  }

  @Patch(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number) {
    return this.notas.anular(id);
  }
}
