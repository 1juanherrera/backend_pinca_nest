import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { FormulacionesCostosService } from './formulaciones-costos.service';

/** Simulaciones de costo de formulaciones (rutas bajo /formulaciones). */
@Controller('formulaciones')
export class FormulacionesCostosController {
  constructor(private readonly svc: FormulacionesCostosService) {}

  @Get('costos/:id/proveedor/:pid')
  costosPorProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Param('pid', ParseIntPipe) pid: number,
  ) {
    return this.svc.calculateCostsByProveedor(id, pid);
  }

  @Get('costos/:id')
  costosVolumen(@Param('id', ParseIntPipe) id: number) {
    return this.svc.calculateCosts(id, null);
  }

  @Get('recalcular_costos/:id/:vol')
  recalcular(@Param('id', ParseIntPipe) id: number, @Param('vol') vol: string) {
    return this.svc.recalculateCostsWithNewVolume(id, Number(vol));
  }

  @Get(':id/proveedores')
  proveedores(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getProveedoresFormulacion(id);
  }

  @Get(':id/opciones-ingredientes')
  opcionesIngredientes(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getOpcionesProveedorFormulacion(id);
  }
}
