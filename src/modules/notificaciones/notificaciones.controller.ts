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
import { Logger } from '@nestjs/common';

import { NotificacionService } from './notificacion.service';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

/** Réplica fiel de NotificacionesController (CI4). */
@Controller('notificaciones')
export class NotificacionesController {
  private readonly logger = new Logger('Notif auto');

  constructor(private readonly svc: NotificacionService) {}

  private fail(msg: string, status: number): HttpException {
    return new HttpException({ msg }, status);
  }

  // GET /api/notificaciones?solo_no_leidas=1&limit=30&offset=0
  @Get()
  async index(
    @CurrentUser() user: JwtUser,
    @Query('solo_no_leidas') soloNoLeidas?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!user?.id) throw this.fail('No autenticado.', 401);
    // Regenerar automáticas on-demand (lazy cron). Best-effort: no rompe el index.
    try {
      await this.svc.generarAutomaticas();
    } catch (e) {
      this.logger.warn((e as Error).message);
    }
    const items = await this.svc.listarPara(user.id, user.rol, {
      solo_no_leidas: soloNoLeidas,
      limit,
      offset,
    });
    const noLeidas = await this.svc.contarNoLeidas(user.id, user.rol);
    return { data: items, no_leidas: noLeidas };
  }

  // GET /api/notificaciones/no-leidas
  @Get('no-leidas')
  async noLeidas(@CurrentUser() user: JwtUser) {
    if (!user?.id) throw this.fail('No autenticado.', 401);
    return { no_leidas: await this.svc.contarNoLeidas(user.id, user.rol) };
  }

  // PATCH /api/notificaciones/:id/leer
  @Patch(':id/leer')
  async marcarLeida(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    if (!user?.id) throw this.fail('No autenticado.', 401);
    const ok = await this.svc.marcarLeida(id, user.id, user.rol);
    if (!ok) throw this.fail(`Notificación #${id} no encontrada.`, 404);
    return { ok: true };
  }

  // POST /api/notificaciones/leer-todas
  @Post('leer-todas')
  @HttpCode(200)
  async marcarTodasLeidas(@CurrentUser() user: JwtUser) {
    if (!user?.id) throw this.fail('No autenticado.', 401);
    return { marcadas: await this.svc.marcarTodasLeidas(user.id, user.rol) };
  }
}
