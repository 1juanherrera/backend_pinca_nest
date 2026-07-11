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
  async sugerirMRP(@CurrentUser() user: JwtUser, @Body() body: Record<string, unknown>) {
    const itemId = Number(body?.item_general_id) || 0;
    const cantidad = Number(body?.cantidad) || 0;
    const unidadId = Number(body?.unidad_id) || 0;
    const prepId = body?.preparacion_id != null ? Number(body.preparacion_id) : null;
    if (!itemId || cantidad <= 0 || !unidadId) {
      throw this.fail('Parámetros requeridos: item_general_id, cantidad (> 0), unidad_id.', 422);
    }
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
  async create(@Body() body: Record<string, unknown>) {
    const items = (body && (body.items as unknown)) ? (body.items as unknown[]) : (body as unknown);
    if (!Array.isArray(items) || !items.length) {
      throw this.fail('El cuerpo debe ser un array de requisiciones.', 422);
    }

    const idsRequeridos = new Set<number>();
    items.forEach((req: Record<string, unknown>, idx: number) => {
      const itemId = req.item_general_id ? Number(req.item_general_id) : 0;
      if (itemId <= 0) {
        throw this.fail(`Requisición #${idx}: item_general_id es requerido y debe ser > 0.`, 422);
      }
      if (req.cantidad == null || Number.isNaN(Number(req.cantidad)) || Number(req.cantidad) <= 0) {
        throw this.fail(`Requisición #${idx}: cantidad es requerida y debe ser numérica > 0.`, 422);
      }
      idsRequeridos.add(itemId);
    });

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

    const created = await this.svc.crearRequisiciones(items as Record<string, unknown>[]);
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
  async actualizarEstado(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    const estado = String(body?.estado ?? '').trim();
    if (!estado) throw this.fail('El campo estado es requerido.', 422);
    return { success: true, data: await this.svc.actualizarEstado(id, estado.toUpperCase()) };
  }

  // ── POST /requisiciones/convertir-oc ──
  @Post('requisiciones/convertir-oc')
  @HttpCode(201)
  async convertirAOC(@Body() body: Record<string, unknown>) {
    const ids = (body?.ids as unknown[]) ?? [];
    const bodegaId = Number(body?.bodegas_id) || 0;
    const obs = (body?.observaciones as string) ?? null;
    if (!Array.isArray(ids) || !ids.length || !bodegaId) {
      throw this.fail('Se requieren ids (array) y bodegas_id.', 422);
    }
    const ocIds = await this.svc.convertirAOC(ids.map((x) => Number(x)), bodegaId, obs);
    return {
      success: true,
      ordenes_compra_ids: ocIds,
      message: `${ocIds.length} orden(es) de compra generada(s).`,
    };
  }
}
