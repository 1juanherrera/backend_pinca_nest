import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { PreparacionesService } from './preparaciones.service';
import {
  CreatePreparacionDto,
  UpdatePreparacionDto,
} from './dto/preparacion.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface CostoIndirectoBody {
  nombre?: string;
  categoria?: string;
  valor_aplicado?: number;
}

/**
 * Réplica fiel de PreparacionesController (CI4). Shapes de éxito: { success, data }.
 * `costos_resumen` y los sub-endpoints de costos indirectos quedan en CI4 por ahora.
 */
@Controller('preparaciones')
export class PreparacionesController {
  private static readonly LIMIT_DEFAULT = 50;
  private static readonly LIMIT_MAX = 200;

  constructor(private readonly preparaciones: PreparacionesService) {}

  @Get('costos_resumen')
  costosResumen(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('estado') estado?: string,
  ) {
    return this.preparaciones.costosResumen(desde, hasta, estado);
  }

  @Get()
  async index(@Query() query: Record<string, string>) {
    const p = query.page ? Number(query.page) : 1;
    const l = Math.min(
      query.limit ? Number(query.limit) : PreparacionesController.LIMIT_DEFAULT,
      PreparacionesController.LIMIT_MAX,
    );
    const data = await this.preparaciones.getAll(p, l, {
      estado: query.estado,
      item: query.item,
      search: query.search,
      desde: query.desde,
      hasta: query.hasta,
    });
    return { success: true, data };
  }

  @Post()
  async create(
    @Body() dto: CreatePreparacionDto,
    @CurrentUser('username') username: string,
  ) {
    const data = await this.preparaciones.create(dto, username);
    return { success: true, data };
  }

  // Costos indirectos de una preparación
  @Post(':id/costos')
  @HttpCode(201)
  async addCosto(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CostoIndirectoBody,
  ) {
    const data = await this.preparaciones.addCostoIndirecto(
      id,
      (body.nombre ?? '').trim(),
      (body.categoria ?? 'otros').trim(),
      Number(body.valor_aplicado ?? 0),
    );
    return { success: true, data };
  }

  @Put(':id/costos/:costoId')
  async updateCosto(
    @Param('id', ParseIntPipe) id: number,
    @Param('costoId', ParseIntPipe) costoId: number,
    @Body() body: CostoIndirectoBody,
  ) {
    await this.preparaciones.updateCostoIndirecto(costoId, { ...body });
    return { success: true };
  }

  @Delete(':id/costos/:costoId')
  async deleteCosto(
    @Param('id', ParseIntPipe) id: number,
    @Param('costoId', ParseIntPipe) costoId: number,
  ) {
    await this.preparaciones.deleteCostoIndirecto(costoId);
    return { success: true };
  }

  @Get('item/:id')
  async byItem(@Param('id', ParseIntPipe) id: number) {
    const data = await this.preparaciones.getByItem(id);
    return { success: true, data };
  }

  @Get(':id')
  async show(@Param('id', ParseIntPipe) id: number) {
    const data = await this.preparaciones.getById(id);
    return { success: true, data };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePreparacionDto,
    @CurrentUser('username') username: string,
  ) {
    const data = await this.preparaciones.update(id, body, username);
    return { success: true, data };
  }
}
