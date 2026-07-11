import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { NumeracionService } from './numeracion.service';
import { NumeracionDocumento } from './entities/numeracion-documento.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Réplica fiel de NumeracionController (CI4).
 * GET (lectura) para cualquier rol; POST/PUT solo admin/superadmin (@Roles).
 */
@Controller('numeracion')
export class NumeracionController {
  constructor(private readonly numeracion: NumeracionService) {}

  @Get()
  findAll() {
    return this.numeracion.findAll(); // array crudo con folios_restantes + ejemplo_proximo
  }

  @Post()
  @Roles('admin', 'superadmin')
  async create(
    @Body() body: Partial<NumeracionDocumento>,
    @CurrentUser('username') username: string,
  ) {
    const serie = await this.numeracion.create(body, username);
    return { mensaje: `Serie '${serie.tipo_doc}' creada`, serie };
  }

  @Put(':id')
  @Roles('admin', 'superadmin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<NumeracionDocumento>,
    @CurrentUser('username') username: string,
  ) {
    const serie = await this.numeracion.update(id, body, username);
    return { mensaje: `Serie #${id} actualizada`, serie };
  }
}
