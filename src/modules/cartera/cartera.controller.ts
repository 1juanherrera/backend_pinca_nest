import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { CarteraService } from './cartera.service';

/** Réplica fiel de CarteraController (CI4). Solo lectura. */
@Controller('cartera')
export class CarteraController {
  constructor(private readonly cartera: CarteraService) {}

  @Get('resumen')
  resumen() {
    return this.cartera.resumen();
  }

  @Get('aging')
  aging() {
    return this.cartera.aging();
  }

  @Get('estado_cuenta/:id')
  estadoCuenta(@Param('id', ParseIntPipe) id: number) {
    return this.cartera.estadoCuenta(id);
  }
}
