import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { FactusService } from './factus.service';
import { CrearFacturaElectronicaDto, CrearNotaCreditoElectronicaDto } from './dto/factura-electronica.dto';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Harness de prueba de la integración Factus (Fase 1 — ver historial de sesión).
 * Aislado del módulo `facturas` real: no lee ni escribe nada de la BD de PINCA.
 * admin-only mientras se evalúa/prueba el proveedor.
 */
@Controller('facturacion-electronica')
@Roles('admin')
export class FacturacionElectronicaController {
  constructor(private readonly factus: FactusService) {}

  @Get('empresa')
  empresa() {
    return this.factus.getEmpresa();
  }

  @Get('rangos-numeracion')
  rangos() {
    return this.factus.getRangosNumeracion();
  }

  @Post('facturas')
  crearFactura(@Body() dto: CrearFacturaElectronicaDto) {
    const payload: Record<string, unknown> = {
      reference_code: dto.reference_code ?? `PINCA-${Date.now()}`,
      numbering_range_id: dto.numbering_range_id ?? this.factus.defaultNumberingRangeFactura(),
      operation_type: dto.operation_type ?? '10',
      observation: dto.observation,
      payment_details: dto.payment_details,
      customer: dto.customer,
      items: dto.items,
    };
    return this.factus.crearFactura(payload);
  }

  @Get('facturas/:number')
  verFactura(@Param('number') number: string) {
    return this.factus.getFactura(number);
  }

  @Get('facturas/:number/pdf')
  async pdf(@Param('number') number: string, @Res() res: Response) {
    const { fileName, buffer } = await this.factus.descargarFacturaPdf(number);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    });
    res.send(buffer);
  }

  @Get('facturas/:number/xml')
  async xml(@Param('number') number: string, @Res() res: Response) {
    const { fileName, buffer } = await this.factus.descargarFacturaXml(number);
    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `inline; filename="${fileName}"`,
    });
    res.send(buffer);
  }

  @Post('notas-credito')
  crearNotaCredito(@Body() dto: CrearNotaCreditoElectronicaDto) {
    const payload: Record<string, unknown> = {
      reference_code: dto.reference_code ?? `PINCA-NC-${Date.now()}`,
      correction_concept_code: dto.correction_concept_code,
      bill_number: dto.bill_number,
      numbering_range_id: dto.numbering_range_id ?? this.factus.defaultNumberingRangeNotaCredito(),
      observation: dto.observation,
      payment_details: dto.payment_details,
      customer: dto.customer,
      items: dto.items,
    };
    return this.factus.crearNotaCredito(payload);
  }

  @Get('notas-credito/:number')
  verNotaCredito(@Param('number') number: string) {
    return this.factus.getNotaCredito(number);
  }
}
