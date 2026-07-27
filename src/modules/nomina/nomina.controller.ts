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
  PagarPeriodoDto,
  RegistrarAbonoDto,
  RegistrarDescuentoDto,
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

  // ── Descuentos (mercancía sacada / acuerdos verbales) ──
  @Get('descuentos')
  listarDescuentosTodos() {
    return this.nomina.listarDescuentos();
  }

  @Get('empleados/:id/descuentos')
  listarDescuentosEmpleado(@Param('id', ParseIntPipe) id: number) {
    return this.nomina.listarDescuentos(id);
  }

  @Post('empleados/:id/descuentos')
  registrarDescuento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarDescuentoDto,
    @CurrentUser('username') username: string,
  ) {
    return this.nomina.registrarDescuento(id, dto, username);
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

  @Patch('periodos/:id/pagar')
  pagarPeriodo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PagarPeriodoDto,
    @CurrentUser('username') username: string,
  ) {
    return this.nomina.pagarPeriodo(id, dto, username);
  }

  @Delete('periodos/:id')
  eliminarPeriodo(@Param('id', ParseIntPipe) id: number) {
    return this.nomina.eliminarPeriodo(id);
  }

  // ── Detalle (ajuste de días + abonos parciales) ──
  @Put('detalle/:id')
  actualizarDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDetalleDto,
  ) {
    return this.nomina.actualizarDetalle(id, dto.dias_trabajados);
  }

  @Post('detalle/:id/abonos')
  registrarAbono(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarAbonoDto,
    @CurrentUser('username') username: string,
  ) {
    return this.nomina.registrarAbono(id, dto, username);
  }
}
