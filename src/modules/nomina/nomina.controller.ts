import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { NominaService } from './nomina.service';
import {
  CreateEmpleadoDto,
  CreatePeriodoDto,
  UpdateDetalleDto,
  UpdateEmpleadoDto,
} from './dto/nomina.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Nómina básica. Módulo sensible → todo admin-only (@Roles a nivel de clase:
 * superadmin pasa siempre; admin pasa; operador/visor → 403).
 */
@Roles('admin')
@Controller('nomina')
export class NominaController {
  constructor(private readonly nomina: NominaService) {}

  // ── Empleados ──
  @Get('empleados')
  listarEmpleados(@Query() query: Record<string, string>) {
    return this.nomina.listarEmpleados(query);
  }

  @Get('empleados/:id')
  getEmpleado(@Param('id', ParseIntPipe) id: number) {
    return this.nomina.getEmpleado(id);
  }

  @Post('empleados')
  async crearEmpleado(@Body() dto: CreateEmpleadoDto) {
    const id = await this.nomina.crearEmpleado(dto);
    return { mensaje: 'Empleado creado.', id };
  }

  @Put('empleados/:id')
  async actualizarEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpleadoDto,
  ) {
    await this.nomina.actualizarEmpleado(id, dto);
    return { mensaje: 'Empleado actualizado.' };
  }

  @Delete('empleados/:id')
  async eliminarEmpleado(@Param('id', ParseIntPipe) id: number) {
    await this.nomina.eliminarEmpleado(id);
    return { mensaje: 'Empleado archivado.' };
  }

  // ── Períodos ──
  @Get('periodos')
  listarPeriodos() {
    return this.nomina.listarPeriodos();
  }

  @Get('periodos/:id')
  getPeriodo(@Param('id', ParseIntPipe) id: number) {
    return this.nomina.getPeriodo(id);
  }

  @Post('periodos')
  crearPeriodo(
    @Body() dto: CreatePeriodoDto,
    @CurrentUser('username') username: string,
  ) {
    return this.nomina.crearPeriodo(dto, username);
  }

  @Patch('periodos/:id/cerrar')
  cerrarPeriodo(@Param('id', ParseIntPipe) id: number) {
    return this.nomina.cerrarPeriodo(id);
  }

  @Delete('periodos/:id')
  eliminarPeriodo(@Param('id', ParseIntPipe) id: number) {
    return this.nomina.eliminarPeriodo(id);
  }

  // ── Detalle (ajuste de días) ──
  @Put('detalle/:id')
  actualizarDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDetalleDto,
  ) {
    return this.nomina.actualizarDetalle(id, dto.dias_trabajados);
  }
}
