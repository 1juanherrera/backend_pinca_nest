import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { FormulacionesService } from './formulaciones.service';
import {
  ClonarFormulacionDto,
  CreateFormulacionDto,
  UpdateFormulacionDto,
} from './dto/formulacion.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Réplica fiel de FormulacionesController (CRUD-CORE, CI4).
 * Diferido a CI4: costos/simulaciones por proveedor, detalle+restaurar de versión.
 */
@Controller('formulaciones')
export class FormulacionesController {
  constructor(private readonly formulaciones: FormulacionesService) {}

  @Get()
  index() {
    return this.formulaciones.getItemsFormulaciones(); // array crudo
  }

  @Post()
  async create(
    @Body() dto: CreateFormulacionDto,
    @CurrentUser('username') username: string,
  ) {
    const r = await this.formulaciones.crearFormulacion(dto, username);
    return {
      status: 'success',
      message: r.message,
      id: r.formulacion_id,
      version_id: r.version_id,
      version_num: r.version_num,
    };
  }

  @Post('clonar')
  async clonar(
    @Body() dto: ClonarFormulacionDto,
    @CurrentUser('username') username: string,
  ) {
    const r = await this.formulaciones.clonarFormulacion(
      dto.from_item_id,
      dto.to_item_id,
      dto.nombre ?? null,
      username,
      dto.force ?? false,
    );
    return {
      status: 'success',
      message: 'Fórmula clonada correctamente',
      id: r.formulacion_id,
      version_id: r.version_id,
      version_num: r.version_num,
    };
  }

  @Get(':id/versiones')
  versiones(@Param('id', ParseIntPipe) id: number) {
    return this.formulaciones.listarVersiones(id); // array crudo
  }

  @Get('versiones/:versionId')
  async versionDetalle(@Param('versionId', ParseIntPipe) versionId: number) {
    const d = await this.formulaciones.detalleVersion(versionId);
    if (!d) throw new NotFoundException(`Versión #${versionId} no encontrada`);
    return d; // objeto crudo
  }

  @Post('versiones/:versionId/restaurar')
  @HttpCode(200)
  restaurar(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body() body: { notas?: string },
    @CurrentUser('username') username: string,
  ) {
    const notas = body?.notas ? String(body.notas).trim() : null;
    return this.formulaciones.restaurarVersion(versionId, username, notas || null);
  }

  @Get(':id')
  async show(@Param('id', ParseIntPipe) id: number) {
    const data = await this.formulaciones.getItemFormulacionById(id);
    return { status: 200, success: true, data };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormulacionDto,
    @CurrentUser('username') username: string,
  ) {
    const r = await this.formulaciones.actualizarFormulacion(id, dto, username);
    return {
      status: 'success',
      message: r.message,
      version_id: r.version_id,
      version_num: r.version_num,
    };
  }
}
