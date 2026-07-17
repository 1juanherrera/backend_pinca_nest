import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { PagosClienteService } from './pagos-cliente.service';
import { CreatePagoDto, UpdatePagoDto } from './dto/pago.dto';

/** Réplica fiel de PagosClienteController (CI4). */
@Controller('pagos_cliente')
export class PagosClienteController {
  constructor(private readonly pagos: PagosClienteService) {}

  @Get()
  index(@Query() query: Record<string, string>) {
    return this.pagos.index(query);
  }

  @Get(':id')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.pagos.show(id);
  }

  @Post()
  create(@Body() dto: CreatePagoDto) {
    return this.pagos.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePagoDto) {
    return this.pagos.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pagos.remove(id);
  }
}
