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

import { GestionesCobroService } from './gestiones-cobro.service';
import {
  CreateGestionCobroDto,
  UpdateGestionCobroDto,
} from './dto/gestion-cobro.dto';

/** Réplica fiel de GestionesCobroController (CI4). */
@Controller('gestiones_cobro')
export class GestionesCobroController {
  constructor(private readonly gestiones: GestionesCobroService) {}

  @Get()
  index(
    @Query('cliente_id') clienteId?: string,
    @Query('factura_id') facturaId?: string,
  ) {
    return this.gestiones.index(
      clienteId ? Number(clienteId) : undefined,
      facturaId ? Number(facturaId) : undefined,
    );
  }

  @Get(':id')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.gestiones.show(id);
  }

  @Post()
  create(@Body() dto: CreateGestionCobroDto) {
    return this.gestiones.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGestionCobroDto) {
    return this.gestiones.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gestiones.remove(id);
  }
}
