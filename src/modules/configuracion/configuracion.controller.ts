import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Put,
} from '@nestjs/common';

import { ConfiguracionService } from './configuracion.service';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

/** Réplica fiel de ConfiguracionController (CI4). Lectura: autenticado; mutaciones: admin/superadmin. */
@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly cfg: ConfiguracionService) {}

  private fail(msg: string, status: number): HttpException {
    return new HttpException({ msg }, status);
  }

  private requireAdmin(user: JwtUser): void {
    if (!['admin', 'superadmin'].includes(user.rol)) {
      throw this.fail('Solo administradores pueden modificar la configuración.', 403);
    }
  }

  // GET /api/configuracion
  @Get()
  index() {
    return this.cfg.getAllGrouped();
  }

  // PUT /api/configuracion/bulk  (antes que :clave para que no lo capture)
  @Put('bulk')
  async bulkUpdate(
    @CurrentUser() user: JwtUser,
    @Body() body: Record<string, unknown>,
  ) {
    this.requireAdmin(user);
    const configs = body?.configs;
    if (configs === null || typeof configs !== 'object' || Array.isArray(configs) || !Object.keys(configs).length) {
      throw this.fail('Body debe contener `configs: { clave: valor, … }`.', 422);
    }
    const aplicados: string[] = [];
    const errores: string[] = [];
    for (const [clave, valor] of Object.entries(configs)) {
      const ok = await this.cfg.guardar(clave, valor, user.username);
      if (ok) aplicados.push(clave);
      else errores.push(clave);
    }
    return {
      mensaje: `${aplicados.length} configuraciones actualizadas`,
      aplicados,
      errores,
    };
  }

  // GET /api/configuracion/tipos-movimiento
  @Get('tipos-movimiento')
  tiposMovimiento() {
    return {
      tipos: [
        { key: 'ENTRADA', label: 'Entrada', tone: 'success' },
        { key: 'SALIDA', label: 'Salida', tone: 'danger' },
        { key: 'TRASPASO', label: 'Traspaso', tone: 'info' },
        { key: 'AJUSTE', label: 'Ajuste', tone: 'warning' },
      ],
      referencias: [
        { key: 'OC', label: 'Orden de compra' },
        { key: 'FACTURA_VENTA', label: 'Factura de venta' },
        { key: 'REMISION', label: 'Remisión' },
        { key: 'PRODUCCION', label: 'Producción' },
        { key: 'TRASPASO_BODEGA', label: 'Traspaso entre bodegas' },
        { key: 'AJUSTE_MANUAL', label: 'Ajuste manual' },
        { key: 'ANULACION', label: 'Anulación' },
      ],
    };
  }

  // GET /api/configuracion/grupo/:grupo
  @Get('grupo/:grupo')
  porGrupo(@Param('grupo') grupo: string) {
    return this.cfg.getGrupo(grupo);
  }

  // GET /api/configuracion/:clave
  @Get(':clave')
  async show(@Param('clave') clave: string) {
    const valor = await this.cfg.obtener(clave, null);
    if (valor === null) throw this.fail(`Clave '${clave}' no encontrada.`, 404);
    return { clave, valor };
  }

  // PUT /api/configuracion/:clave  body: { valor: ... }
  @Put(':clave')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('clave') clave: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.requireAdmin(user);
    if (!body || !Object.prototype.hasOwnProperty.call(body, 'valor')) {
      throw this.fail('Campo `valor` requerido.', 422);
    }
    const ok = await this.cfg.guardar(clave, body.valor, user.username);
    if (!ok) throw this.fail(`No se pudo actualizar '${clave}'.`, 400);
    return {
      mensaje: `Configuración '${clave}' actualizada`,
      clave,
      valor: body.valor,
    };
  }
}
