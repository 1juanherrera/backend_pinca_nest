import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { RequisicionesService } from './requisiciones.service';
import { NotificacionService, TIPO } from '../notificaciones/notificacion.service';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import {
  ActualizarEstadoRequisicionDto,
  ConvertirAOCDto,
  CreateRequisicionesDto,
  SugerirMRPDto,
} from './dto/requisicion.dto';

/** Réplica fiel de RequisicionesCompraController (CI4). Shapes de éxito {success:true,...}. */
@Controller()
export class RequisicionesController {
  constructor(
    private readonly svc: RequisicionesService,
    private readonly notif: NotificacionService,
    private readonly dataSource: DataSource,
  ) {}

  private fail(message: string, status: number): HttpException {
    return new HttpException({ message }, status);
  }
  /** Fecha 'YYYY-MM-DD-HH' del server (para dedup_key). */
  private async hourKey(): Promise<string> {
    return (await this.dataSource.query(`SELECT DATE_FORMAT(NOW(),'%Y-%m-%d-%H') AS k`))[0].k;
  }

  // ── GET /preparaciones/verificar-disponibilidad ──
  @Get('preparaciones/verificar-disponibilidad')
  async verificarDisponibilidad(
    @Query('item_general_id') itemGeneralId?: string,
    @Query('cantidad') cantidad?: string,
    @Query('unidad_id') unidadId?: string,
  ) {
    const itemId = Number(itemGeneralId) || 0;
    const cant = Number(cantidad) || 0;
    const uId = Number(unidadId) || 0;
    if (!itemId || cant <= 0 || !uId) {
      throw this.fail('Parámetros requeridos: item_general_id, cantidad (> 0), unidad_id.', 422);
    }
    return { success: true, data: await this.svc.verificarDisponibilidad(itemId, cant, uId) };
  }

  // ── POST /requisiciones/sugerir-mrp ──
  @Post('requisiciones/sugerir-mrp')
  @HttpCode(201)
  async sugerirMRP(@CurrentUser() user: JwtUser, @Body() body: SugerirMRPDto) {
    const itemId = body.item_general_id;
    const cantidad = body.cantidad;
    const unidadId = body.unidad_id;
    const prepId = body.preparacion_id ?? null;
    const result = await this.svc.sugerirRequisicionesMRP(itemId, cantidad, unidadId, prepId);
    const cantCreadas = (result.creadas as unknown[]).length;
    if (cantCreadas > 0) {
      await this.notif.crear({
        tipo: TIPO.REQUISICION_NUEVA,
        titulo: `MRP generó ${cantCreadas} requisición(es) sugerida(s)`,
        mensaje: 'Hay déficit detectado para producir el item. Revisa y aprueba las requisiciones para convertir a OC.',
        rol_target: 'admin',
        link: '/compras',
        metadata: {
          origen: 'mrp',
          item_general_id: itemId,
          cantidad: cantCreadas,
          sin_proveedor: (result.sin_proveedor as unknown[]).length,
        },
        dedup_key: `mrp-${itemId}-${await this.hourKey()}`,
      });
    }
    return { success: true, data: result };
  }

  // ── GET /requisiciones ──
  @Get('requisiciones')
  async index(@Query('estado') estado?: string) {
    return { success: true, data: await this.svc.listar(estado || null) };
  }

  // ── GET /requisiciones/preparacion/:id ──
  @Get('requisiciones/preparacion/:id')
  async porPreparacion(@Param('id', ParseIntPipe) id: number) {
    return { success: true, data: await this.svc.listarPorPreparacion(id) };
  }

  // ── POST /requisiciones ──
  @Post('requisiciones')
  @HttpCode(201)
  async create(@Body() body: CreateRequisicionesDto) {
    const items = body.items;

    const idsRequeridos = new Set<number>();
    items.forEach((req) => idsRequeridos.add(req.item_general_id));

    if (idsRequeridos.size) {
      const ph = [...idsRequeridos].map(() => '?').join(',');
      const existentes: { id_item_general: number }[] = await this.dataSource.query(
        `SELECT id_item_general FROM item_general WHERE id_item_general IN (${ph}) AND deleted_at IS NULL`,
        [...idsRequeridos],
      );
      const existSet = new Set(existentes.map((e) => Number(e.id_item_general)));
      const faltantes = [...idsRequeridos].filter((id) => !existSet.has(id));
      if (faltantes.length) {
        throw this.fail(`Items inexistentes o archivados: ${faltantes.join(', ')}`, 422);
      }
    }

    const created = await this.svc.crearRequisiciones(items as unknown as Record<string, unknown>[]);
    const count = Array.isArray(created) ? created.length : 1;
    await this.notif.crear({
      tipo: TIPO.REQUISICION_NUEVA,
      titulo: count === 1 ? 'Nueva requisición de compra' : `${count} requisiciones nuevas`,
      mensaje: 'Hay requisiciones pendientes de aprobación para convertir a OC.',
      rol_target: 'admin',
      link: '/compras',
      metadata: { count },
      dedup_key: `req-nueva-${await this.hourKey()}`,
    });
    return { success: true, data: created };
  }

  // ── PATCH /requisiciones/:id/estado ──
  @Patch('requisiciones/:id/estado')
  async actualizarEstado(@Param('id', ParseIntPipe) id: number, @Body() body: ActualizarEstadoRequisicionDto) {
    return { success: true, data: await this.svc.actualizarEstado(id, body.estado) };
  }

  // ── POST /requisiciones/convertir-oc ──
  @Post('requisiciones/convertir-oc')
  @HttpCode(201)
  async convertirAOC(@Body() body: ConvertirAOCDto) {
    const ocIds = await this.svc.convertirAOC(body.ids, body.bodegas_id, body.observaciones ?? null);
    return {
      success: true,
      ordenes_compra_ids: ocIds,
      message: `${ocIds.length} orden(es) de compra generada(s).`,
    };
  }
}
