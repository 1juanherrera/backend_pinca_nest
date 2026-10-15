import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';

import { CarteraService } from './cartera.service';

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
  crearSaldoInicial(@Body() body: { cliente_id: number; total: number; observaciones?: string; fecha_emision?: string; fecha_vencimiento?: string }) {
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
  registrarPagoProveedor(
    @Body()
    body: {
      orden_id: number;
      proveedor_id: number;
      monto: number;
      tipo: string;
      metodo_pago: string;
      fecha_pago: string;
      numero_referencia?: string;
      observaciones?: string;
    },
  ) {
    return this.cartera.registrarPagoProveedor(body);
  }
}
