import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';

import { CarteraService } from './cartera.service';
import { CrearSaldoInicialDto, RegistrarPagoProveedorDto } from './dto/cartera.dto';

@Controller('cartera')
export class CarteraController {
  constructor(private readonly cartera: CarteraService) {}

  @Get('clientes')
  clientesPorCiudad() {
    return this.cartera.clientesPorCiudad();
  }

  @Get('resumen')
  resumen() {
    return this.cartera.resumen();
  }

  @Get('aging')
  aging() {
    return this.cartera.aging();
  }

  @Post('saldo-inicial')
  crearSaldoInicial(@Body() body: CrearSaldoInicialDto) {
    return this.cartera.crearSaldoInicial(body);
  }

  @Get('estado_cuenta/:id')
  estadoCuenta(@Param('id', ParseIntPipe) id: number) {
    return this.cartera.estadoCuenta(id);
  }

  @Get('resumen-pagar')
  resumenPagar() {
    return this.cartera.resumenPagar();
  }

  @Get('proveedores-pagar')
  proveedoresPorPagar() {
    return this.cartera.proveedoresPorPagar();
  }

  @Get('aging-pagar')
  agingPagar() {
    return this.cartera.agingPagar();
  }

  @Get('estado-cuenta-proveedor/:id')
  estadoCuentaProveedor(@Param('id', ParseIntPipe) id: number) {
    return this.cartera.estadoCuentaProveedor(id);
  }

  @Post('pago-proveedor')
  registrarPagoProveedor(@Body() body: RegistrarPagoProveedorDto) {
    return this.cartera.registrarPagoProveedor(body);
  }
}
