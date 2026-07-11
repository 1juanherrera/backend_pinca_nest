import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { SincronizacionService } from './sincronizacion.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Réplica fiel de SincronizacionController (endpoints NO-IA, CI4).
 * `pendientes` (buscarFuzzy) y `/ia/*` (LLM) quedan en CI4.
 * Los GET devuelven crudo; `merge` es admin/superadmin y devuelve { message, detalle }.
 */
@Controller('sincronizacion')
export class SincronizacionController {
  private readonly logger = new Logger('sincronizacion');

  constructor(private readonly sinc: SincronizacionService) {}

  @Get('pendientes')
  pendientes() {
    return this.sinc.pendientes();
  }

  @Get('stats')
  stats() {
    return this.sinc.stats();
  }

  @Get('maestro')
  maestro(
    @Query('search') search?: string,
    @Query('cobertura') cobertura?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.sinc.maestro(
      search,
      cobertura,
      tipo !== undefined && tipo !== '' ? Number(tipo) : undefined,
    );
  }

  @Get('duplicados')
  duplicados(@Query('threshold') threshold?: string) {
    return this.sinc.duplicados(threshold ? Number(threshold) : 70);
  }

  @Get('huerfanos')
  huerfanos() {
    return this.sinc.huerfanos();
  }

  @Post('merge')
  @Roles('admin', 'superadmin')
  @HttpCode(200)
  async merge(
    @Body() body: { keep_id?: number; remove_id?: number },
    @CurrentUser('username') username: string,
    @CurrentUser('rol') rol: string,
  ) {
    const keepId = Number(body.keep_id ?? 0);
    const removeId = Number(body.remove_id ?? 0);
    if (keepId <= 0 || removeId <= 0) {
      throw new BadRequestException('keep_id y remove_id son requeridos.');
    }
    const detalle = await this.sinc.merge(keepId, removeId);
    this.logger.log(
      `[MERGE_ITEMS] keep=${keepId} remove=${removeId} por ${username} (${rol})`,
    );
    return { message: 'Merge realizado correctamente.', detalle };
  }

  // ── Clasificación química con IA (LLM Gemini/Anthropic, auto-detectado por env) ──
  @Post('ia/clasificar')
  @HttpCode(200)
  async iaClasificar(
    @CurrentUser('rol') rol: string,
    @Body() body: Record<string, unknown>,
  ) {
    if (!['admin', 'superadmin'].includes(rol)) {
      throw new HttpException(
        { msg: 'Solo un administrador puede ejecutar la clasificación con IA.' },
        403,
      );
    }
    const tipo =
      body?.tipo !== undefined && body.tipo !== '' ? Math.trunc(Number(body.tipo)) : null;
    try {
      return await this.sinc.iaClasificar(tipo);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException({ msg: e instanceof Error ? e.message : String(e) }, 400);
    }
  }

  // ── Gestión de clusters (dedup IA, sin LLM). ──

  @Get('ia/clusters')
  clusters(
    @Query('estado') estado?: string,
    @Query('confianza') confianza?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.sinc.listarClusters(
      estado,
      confianza,
      tipo !== undefined && tipo !== '' ? Number(tipo) : undefined,
    );
  }

  @Get('ia/clusters/:id')
  async cluster(@Param('id', ParseIntPipe) id: number) {
    const c = await this.sinc.detalleCluster(id);
    if (!c) throw new NotFoundException('Cluster no encontrado.');
    return c;
  }

  @Patch('ia/clusters/:id')
  @Roles('admin', 'superadmin')
  async actualizarCluster(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    const cluster = await this.sinc.actualizarCluster(id, body);
    return { message: 'Cluster actualizado.', cluster };
  }

  @Patch('ia/cluster-items/:id')
  @Roles('admin', 'superadmin')
  async moverItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { rol?: string },
  ) {
    await this.sinc.moverItem(id, String(body.rol ?? ''));
    return { message: 'Miembro actualizado.' };
  }

  @Post('ia/clusters/:id/fusionar')
  @Roles('admin', 'superadmin')
  @HttpCode(200)
  async fusionar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    const detalle = await this.sinc.fusionarCluster(id, username);
    this.logger.log(`[MERGE_CLUSTER] cluster=${id} por ${username}`);
    return { message: 'Grupo fusionado correctamente.', detalle };
  }

  @Post('ia/clusters/:id/descartar')
  @Roles('admin', 'superadmin')
  @HttpCode(200)
  async descartar(@Param('id', ParseIntPipe) id: number) {
    await this.sinc.descartarCluster(id);
    return { message: 'Grupo descartado.' };
  }

  @Get('ia/verificar/:keepId')
  verificar(@Param('keepId', ParseIntPipe) keepId: number) {
    return this.sinc.verificarPostMerge(keepId);
  }

  @Post('ia/auditoria/:id/revertir')
  @Roles('admin', 'superadmin')
  @HttpCode(200)
  async revertir(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('username') username: string,
  ) {
    const detalle = await this.sinc.revertirMerge(id, username);
    this.logger.log(`[MERGE_UNDO] auditoria=${id} por ${username}`);
    return { message: 'Fusión revertida (parcial).', detalle };
  }

  // ── Reemplazo manual de MP en fórmulas ──
  @Get('uso-formulas/:itemId')
  usoEnFormulas(@Param('itemId', ParseIntPipe) itemId: number, @Query('to') to?: string) {
    return this.sinc.usoEnFormulas(itemId, Number(to) || 0);
  }

  @Post('reemplazar-formula')
  @HttpCode(200)
  reemplazarFormula(
    @CurrentUser('rol') rol: string,
    @CurrentUser('username') username: string,
    @Body() body: Record<string, unknown>,
  ) {
    if (!['admin', 'superadmin'].includes(rol)) {
      throw new HttpException({ msg: 'Solo un administrador puede reemplazar materias en fórmulas.' }, 403);
    }
    const fromId = body?.from_item_id ? Math.trunc(Number(body.from_item_id)) : 0;
    const toId = body?.to_item_id ? Math.trunc(Number(body.to_item_id)) : 0;
    const formIds = Array.isArray(body?.formulacion_ids) ? (body.formulacion_ids as unknown[]) : null;
    if (fromId <= 0 || toId <= 0) {
      throw new HttpException({ msg: 'from_item_id y to_item_id son requeridos.' }, 400);
    }
    return this.sinc.reemplazarEnFormulas(fromId, toId, formIds, username ?? 'sistema');
  }

  @Get('reemplazos')
  async historialReemplazos() {
    return { reemplazos: await this.sinc.historialReemplazos() };
  }

  @Post('reemplazos/:id/revertir')
  @HttpCode(200)
  revertirReemplazo(
    @CurrentUser('rol') rol: string,
    @CurrentUser('username') username: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!['admin', 'superadmin'].includes(rol)) {
      throw new HttpException({ msg: 'Solo un administrador puede deshacer un reemplazo.' }, 403);
    }
    return this.sinc.revertirReemplazo(id, username ?? 'sistema');
  }
}
