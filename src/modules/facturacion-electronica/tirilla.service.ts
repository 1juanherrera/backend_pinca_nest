import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { printer as ThermalPrinter, types as PrinterTypes, characterSet as CharacterSet } from 'node-thermal-printer';

/**
 * Genera e imprime la tirilla ESC/POS de una factura Factus en una impresora
 * térmica de red (TCP puerto 9100 por defecto). Factus solo entrega el PDF de
 * página completa (ver factus.service.ts) — este formato angosto lo armamos
 * nosotros a partir del mismo JSON que devuelve `GET /v2/bills/:number`.
 *
 * `previsualizar()` no requiere hardware (getText() en vez de execute()) —
 * sirve para validar el layout mientras no haya impresora a mano.
 */
@Injectable()
export class TirillaService {
  private readonly logger = new Logger(TirillaService.name);

  private configurada(): boolean {
    return !!process.env.PRINTER_IP;
  }

  private crearPrinter(interfaceUrl: string): ThermalPrinter {
    return new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: interfaceUrl,
      width: 42,
      characterSet: CharacterSet.PC858_EURO,
      removeSpecialCharacters: false,
      lineCharacter: '-',
      options: { timeout: 5000 },
    });
  }

  private moneda(valor: unknown): string {
    return `$${Number(valor ?? 0).toLocaleString('es-CO')}`;
  }

  private armar(printer: ThermalPrinter, factura: Record<string, any>): void {
    const d = factura?.data ?? factura;
    const emp = d.company?.establishment ?? {};
    const cli = d.customer ?? {};
    const totales = d.totals ?? {};

    printer.alignCenter();
    printer.bold(true);
    printer.println(String(emp.name ?? 'PINCA').toUpperCase());
    printer.bold(false);
    printer.println(`NIT ${d.company?.nit ?? ''}-${d.company?.dv ?? ''}`);
    if (emp.address) printer.println(emp.address);
    const contacto = [emp.phone_number, emp.email].filter(Boolean).join(' - ');
    if (contacto) printer.println(contacto);
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Factura: ${d.number ?? ''}`);
    printer.println(`Fecha: ${d.validated_at ?? d.created_at ?? ''}`);
    const nombreCliente = cli.company ?? cli.graphic_representation_name ?? cli.names ?? '';
    if (nombreCliente) printer.println(`Cliente: ${nombreCliente}`);
    if (cli.identification) {
      printer.println(`${cli.identification_document?.name ?? 'ID'}: ${cli.identification}`);
    }
    if (cli.address) printer.println(`Dir: ${cli.address}`);
    printer.drawLine();

    for (const item of d.items ?? []) {
      printer.println(String(item.name ?? '').toUpperCase());
      printer.tableCustom([
        { text: `${item.quantity} x ${this.moneda(item.price)}`, align: 'LEFT', width: 0.6 },
        { text: this.moneda(item.total), align: 'RIGHT', width: 0.4 },
      ]);
    }
    printer.drawLine();

    printer.tableCustom([
      { text: 'Subtotal', align: 'LEFT', width: 0.6 },
      { text: this.moneda(totales.gross_amount), align: 'RIGHT', width: 0.4 },
    ]);
    printer.tableCustom([
      { text: 'IVA', align: 'LEFT', width: 0.6 },
      { text: this.moneda(totales.tax_amount), align: 'RIGHT', width: 0.4 },
    ]);
    printer.bold(true);
    printer.tableCustom([
      { text: 'TOTAL', align: 'LEFT', width: 0.6 },
      { text: this.moneda(totales.total), align: 'RIGHT', width: 0.4 },
    ]);
    printer.bold(false);
    printer.drawLine();

    printer.alignCenter();
    if (d.cufe) {
      printer.println('CUFE:');
      printer.println(d.cufe);
    }
    if (d.links?.qr) {
      printer.printQR(d.links.qr, { cellSize: 6, correction: 'M', model: 2 });
    }
    printer.println('Factura electronica generada con');
    printer.println('software autorizado por la DIAN');
    printer.cut();
  }

  /** Renderiza la tirilla como texto plano — no requiere impresora física. */
  previsualizar(factura: Record<string, any>): string {
    const printer = this.crearPrinter('tcp://127.0.0.1:9100');
    this.armar(printer, factura);
    return printer.getText();
  }

  async imprimir(factura: Record<string, any>): Promise<void> {
    if (!this.configurada()) {
      throw new BadRequestException(
        'PRINTER_IP no está configurada — falta la IP de la impresora térmica en .env',
      );
    }
    const interfaceUrl = `tcp://${process.env.PRINTER_IP}:${process.env.PRINTER_PORT ?? '9100'}`;
    const printer = this.crearPrinter(interfaceUrl);

    const conectada = await printer.isPrinterConnected();
    if (!conectada) {
      throw new ServiceUnavailableException(`No se pudo conectar a la impresora en ${interfaceUrl}`);
    }

    this.armar(printer, factura);
    await printer.execute();
    this.logger.log(`Tirilla impresa: factura ${factura?.data?.number ?? factura?.number ?? '?'}`);
  }
}
