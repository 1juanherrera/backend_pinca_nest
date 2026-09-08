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
}
