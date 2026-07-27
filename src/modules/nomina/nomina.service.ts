import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { ConfiguracionService } from '../configuracion/configuracion.service';
import {
  CreateEmpleadoDto,
  CreatePeriodoDto,
  PagarPeriodoDto,
  RegistrarAbonoDto,
  RegistrarDescuentoDto,
  UpdateEmpleadoDto,
} from './dto/nomina.dto';

const N = (x: unknown) => Number(x ?? 0);
const r0 = (x: number) => Math.round(x); // pesos colombianos, sin centavos

interface Params {
  smmlv: number;
  auxilio: number;
  pctSalud: number;
  pctPension: number;
}

interface Renglon {
  salario_devengado: number;
  auxilio_transporte: number;
  total_devengado: number;
  deduccion_salud: number;
  deduccion_pension: number;
  total_deducciones: number;
  neto_pagar: number;
}

/**
 * Nómina básica. Todo el cálculo de dinero vive en el server (el front solo
 * muestra). Devengado = salario proporcional a días + auxilio de transporte
 * (si el salario <= 2 SMMLV). Deducciones = salud% + pensión% sobre el salario
 * devengado (el auxilio de transporte NO es base de seguridad social).
 */
@Injectable()
export class NominaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cfg: ConfiguracionService,
  ) {}

  // ── Parámetros (config) ────────────────────────────────────────────────
  private async getParams(): Promise<Params> {
    return {
      smmlv: N(await this.cfg.obtener('nomina_smmlv', 1300000)),
      auxilio: N(await this.cfg.obtener('nomina_auxilio_transporte', 162000)),
      pctSalud: N(await this.cfg.obtener('nomina_pct_salud', 4)),
      pctPension: N(await this.cfg.obtener('nomina_pct_pension', 4)),
    };
  }

  /** Liquida un renglón. El salario/día se calcula siempre sobre base 30. */
  private calcular(salarioBase: number, dias: number, p: Params): Renglon {
    const salarioDia = salarioBase / 30;
    const salarioDevengado = r0(salarioDia * dias);
    const aplicaAuxilio = salarioBase <= 2 * p.smmlv;
    const auxilio = aplicaAuxilio ? r0((p.auxilio / 30) * dias) : 0;
    const totalDevengado = salarioDevengado + auxilio;
    // Base de seguridad social = salario devengado (sin auxilio de transporte).
    const deduccionSalud = r0((salarioDevengado * p.pctSalud) / 100);
    const deduccionPension = r0((salarioDevengado * p.pctPension) / 100);
    const totalDeducciones = deduccionSalud + deduccionPension;
    return {
      salario_devengado: salarioDevengado,
      auxilio_transporte: auxilio,
      total_devengado: totalDevengado,
      deduccion_salud: deduccionSalud,
      deduccion_pension: deduccionPension,
      total_deducciones: totalDeducciones,
      neto_pagar: totalDevengado - totalDeducciones,
    };
  }

  /**
   * FIFO: consume los descuentos PENDIENTES de un empleado contra un
   * presupuesto (el saldo disponible de un renglón). Si un descuento pendiente
   * es más grande que lo que queda de presupuesto, se aplica parcialmente y el
   * remanente se re-inserta como un nuevo 'pendiente' (arrastre al próximo
   * período/renglón). Debe correr DENTRO de la transacción que lockeó el
   * renglón destino. Devuelve el total efectivamente aplicado.
   */
  private async aplicarDescuentosPendientes(
    m: EntityManager,
    empleadoId: number,
    detalleId: number,
    presupuesto: number,
    username?: string,
  ): Promise<number> {
    if (presupuesto <= 0) return 0;
    const pendientes = await m.query(
      `SELECT * FROM nomina_descuentos WHERE empleado_id = ? AND estado = 'pendiente'
        ORDER BY fecha ASC, id ASC FOR UPDATE`,
      [empleadoId],
    );
    let restante = presupuesto;
    let totalAplicado = 0;
    for (const desc of pendientes) {
      if (restante <= 0) break;
      const monto = N(desc.monto);
      if (monto <= restante) {
        await m.query(
          `UPDATE nomina_descuentos SET estado = 'aplicado', aplicado_detalle_id = ? WHERE id = ?`,
          [detalleId, desc.id],
        );
        restante -= monto;
        totalAplicado += monto;
      } else {
        await m.query(
          `UPDATE nomina_descuentos SET monto = ?, estado = 'aplicado', aplicado_detalle_id = ? WHERE id = ?`,
          [r0(restante), detalleId, desc.id],
        );
        await m.query(
          `INSERT INTO nomina_descuentos (empleado_id, concepto, monto, fecha, estado, created_by)
           VALUES (?, ?, ?, ?, 'pendiente', ?)`,
          [empleadoId, desc.concepto, r0(monto - restante), desc.fecha, username ?? null],
        );
        totalAplicado += restante;
        restante = 0;
      }
    }
    return r0(totalAplicado);
  }

  // ── EMPLEADOS ───────────────────────────────────────────────────────────
  async listarEmpleados(query: Record<string, string> = {}) {
    const where: string[] = ['deleted_at IS NULL'];
    const args: unknown[] = [];
    if (query.q) {
      where.push('(nombre LIKE ? OR documento LIKE ? OR cargo LIKE ?)');
      const like = `%${query.q}%`;
      args.push(like, like, like);
    }
    if (query.activo === '1' || query.activo === '0') {
      where.push('activo = ?');
      args.push(Number(query.activo));
    }
    const whereSql = `WHERE ${where.join(' AND ')}`;
    const base = `FROM nomina_empleados ${whereSql}`;

    if (!query.page) {
      return this.dataSource.query(
        `SELECT * ${base} ORDER BY activo DESC, nombre ASC`,
        args,
      );
    }
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
    const totalRow = await this.dataSource.query(
      `SELECT COUNT(*) AS n ${base}`,
      args,
    );
    const total = N(totalRow[0]?.n);
    const data = await this.dataSource.query(
      `SELECT * ${base} ORDER BY activo DESC, nombre ASC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      args,
    );
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 } };
  }

  async getEmpleado(id: number) {
    const rows = await this.dataSource.query(
      `SELECT * FROM nomina_empleados WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`Empleado ${id} no encontrado.`);
    return rows[0];
  }

  async crearEmpleado(dto: CreateEmpleadoDto): Promise<number> {
    try {
      const res = await this.dataSource.query(
        `INSERT INTO nomina_empleados (nombre, documento, cargo, salario_base, fecha_ingreso, activo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          dto.nombre,
          dto.documento,
          dto.cargo ?? null,
          dto.salario_base,
          dto.fecha_ingreso ?? null,
          dto.activo ?? 1,
        ],
      );
      return N(res.insertId);
    } catch (e) {
      if ((e as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Ya existe un empleado con ese documento.');
      }
      throw e;
    }
  }

  async actualizarEmpleado(id: number, dto: UpdateEmpleadoDto): Promise<void> {
    await this.getEmpleado(id);
    const sets: string[] = [];
    const args: unknown[] = [];
    const cols: (keyof UpdateEmpleadoDto)[] = [
      'nombre',
      'documento',
      'cargo',
      'salario_base',
      'fecha_ingreso',
      'activo',
    ];
    for (const c of cols) {
      if (dto[c] !== undefined) {
        sets.push(`${c} = ?`);
        args.push(dto[c]);
      }
    }
    if (!sets.length) return;
    args.push(id);
    try {
      await this.dataSource.query(
        `UPDATE nomina_empleados SET ${sets.join(', ')} WHERE id = ?`,
        args,
      );
    } catch (e) {
      if ((e as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Ya existe un empleado con ese documento.');
      }
      throw e;
    }
  }

  async eliminarEmpleado(id: number): Promise<void> {
    await this.getEmpleado(id);
    await this.dataSource.query(
      `UPDATE nomina_empleados SET deleted_at = NOW() WHERE id = ?`,
      [id],
    );
  }

  // ── PERÍODOS ──────────────────────────────────────────────────────────────
  async listarPeriodos() {
    return this.dataSource.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM nomina_detalle d WHERE d.periodo_id = p.id) AS empleados,
              (SELECT COALESCE(SUM(saldo),0) FROM nomina_detalle d WHERE d.periodo_id = p.id) AS total_saldo
         FROM nomina_periodos p
        ORDER BY p.id DESC`,
    );
  }

  async getPeriodo(id: number) {
    const rows = await this.dataSource.query(
      `SELECT * FROM nomina_periodos WHERE id = ? LIMIT 1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`Período ${id} no encontrado.`);
    const detalle = await this.dataSource.query(
      `SELECT * FROM nomina_detalle WHERE periodo_id = ? ORDER BY empleado_nombre ASC`,
      [id],
    );

    const detalleIds: number[] = detalle.map((d: { id: number }) => N(d.id));
    const abonosPorDetalle = new Map<number, unknown[]>();
    if (detalleIds.length) {
      const abonos = await this.dataSource.query(
        `SELECT * FROM nomina_abonos WHERE detalle_id IN (${detalleIds.map(() => '?').join(',')})
          ORDER BY fecha ASC, id ASC`,
        detalleIds,
      );
      for (const a of abonos) {
        const key = N(a.detalle_id);
        if (!abonosPorDetalle.has(key)) abonosPorDetalle.set(key, []);
        abonosPorDetalle.get(key)!.push(a);
      }
    }

    let totalSaldo = 0;
    const detalleConEstado = detalle.map((d: Record<string, unknown>) => {
      const saldo = N(d.saldo);
      const montoAPagar = N(d.neto_pagar) - N(d.total_descuentos);
      totalSaldo += saldo;
      return {
        ...d,
        estado_pago: saldo <= 0 ? 'pagado' : saldo < montoAPagar ? 'parcial' : 'pendiente',
        abonos: abonosPorDetalle.get(N(d.id)) ?? [],
      };
    });

    return { ...rows[0], detalle: detalleConEstado, total_saldo: r0(totalSaldo) };
  }

  /**
   * Crea un período y genera la liquidación de TODOS los empleados activos en
   * una transacción. dias base = 30 (mensual) / 15 (quincenal).
   */
  async crearPeriodo(dto: CreatePeriodoDto, username?: string) {
    if (dto.fecha_fin < dto.fecha_inicio) {
      throw new BadRequestException('La fecha fin no puede ser anterior a la de inicio.');
    }
    const p = await this.getParams();
    const diasBase = dto.tipo === 'quincenal' ? 15 : 30;

    return this.dataSource.transaction(async (m) => {
      const empleados = dto.empleados_ids?.length
        ? await m.query(
            `SELECT * FROM nomina_empleados
              WHERE activo = 1 AND deleted_at IS NULL AND id IN (${dto.empleados_ids.map(() => '?').join(',')})
              ORDER BY nombre ASC`,
            dto.empleados_ids,
          )
        : await m.query(
            `SELECT * FROM nomina_empleados WHERE activo = 1 AND deleted_at IS NULL ORDER BY nombre ASC`,
          );
      if (!empleados.length) {
        throw new BadRequestException('No hay empleados activos para liquidar.');
      }

      const ins = await m.query(
        `INSERT INTO nomina_periodos (etiqueta, tipo, fecha_inicio, fecha_fin, estado, created_by)
         VALUES (?, ?, ?, ?, 'borrador', ?)`,
        [dto.etiqueta, dto.tipo, dto.fecha_inicio, dto.fecha_fin, username ?? null],
      );
      const periodoId = N(ins.insertId);

      let tDev = 0;
      let tDed = 0;
      let tNeto = 0;
      for (const e of empleados) {
        const salario = N(e.salario_base);
        const c = this.calcular(salario, diasBase, p);
        tDev += c.total_devengado;
        tDed += c.total_deducciones;
        tNeto += c.neto_pagar;
        const insDet = await m.query(
          `INSERT INTO nomina_detalle
             (periodo_id, empleado_id, empleado_nombre, empleado_documento, cargo, salario_base,
              dias_trabajados, salario_devengado, auxilio_transporte, total_devengado,
              deduccion_salud, deduccion_pension, total_deducciones, neto_pagar, total_descuentos, saldo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
          [
            periodoId, N(e.id), e.nombre, e.documento, e.cargo ?? null, salario,
            diasBase, c.salario_devengado, c.auxilio_transporte, c.total_devengado,
            c.deduccion_salud, c.deduccion_pension, c.total_deducciones, c.neto_pagar, c.neto_pagar,
          ],
        );
        const detalleId = N(insDet.insertId);
        // Descuentos comerciales que quedaron pendientes de un período anterior
        // (ej. mercancía sacada) se cobran en esta nueva liquidación.
        const aplicado = await this.aplicarDescuentosPendientes(m, N(e.id), detalleId, c.neto_pagar, username);
        if (aplicado > 0) {
          await m.query(
            `UPDATE nomina_detalle SET total_descuentos = ?, saldo = ? WHERE id = ?`,
            [aplicado, r0(c.neto_pagar - aplicado), detalleId],
          );
        }
      }

      await m.query(
        `UPDATE nomina_periodos SET total_devengado = ?, total_deducciones = ?, total_neto = ? WHERE id = ?`,
        [tDev, tDed, tNeto, periodoId],
      );
      return { id: periodoId, empleados: empleados.length };
    });
  }

  /** Ajusta los días trabajados de un renglón y recalcula el renglón + los totales del período. */
  async actualizarDetalle(detalleId: number, dias: number) {
    const rows = await this.dataSource.query(
      `SELECT d.*, pe.estado AS periodo_estado
         FROM nomina_detalle d
         JOIN nomina_periodos pe ON pe.id = d.periodo_id
        WHERE d.id = ? LIMIT 1`,
      [detalleId],
    );
    const det = rows[0];
    if (!det) throw new NotFoundException(`Renglón ${detalleId} no encontrado.`);
    if (det.periodo_estado !== 'borrador') {
      throw new BadRequestException('El período está cerrado y no se puede modificar.');
    }
    const p = await this.getParams();
    const c = this.calcular(N(det.salario_base), dias, p);
    // El renglón sigue en borrador → nunca tuvo abonos, pero sí pudo haber
    // recibido descuentos comerciales al crearse. Se preservan.
    const nuevoSaldo = r0(c.neto_pagar - N(det.total_descuentos));

    await this.dataSource.transaction(async (m) => {
      await m.query(
        `UPDATE nomina_detalle SET dias_trabajados = ?, salario_devengado = ?, auxilio_transporte = ?,
           total_devengado = ?, deduccion_salud = ?, deduccion_pension = ?, total_deducciones = ?, neto_pagar = ?,
           saldo = ?
         WHERE id = ?`,
        [
          dias, c.salario_devengado, c.auxilio_transporte, c.total_devengado,
          c.deduccion_salud, c.deduccion_pension, c.total_deducciones, c.neto_pagar, nuevoSaldo, detalleId,
        ],
      );
      const tot = await m.query(
        `SELECT COALESCE(SUM(total_devengado),0) dev, COALESCE(SUM(total_deducciones),0) ded, COALESCE(SUM(neto_pagar),0) neto
           FROM nomina_detalle WHERE periodo_id = ?`,
        [det.periodo_id],
      );
      await m.query(
        `UPDATE nomina_periodos SET total_devengado = ?, total_deducciones = ?, total_neto = ? WHERE id = ?`,
        [N(tot[0].dev), N(tot[0].ded), N(tot[0].neto), det.periodo_id],
      );
    });
    return this.getPeriodo(N(det.periodo_id));
  }

  async cerrarPeriodo(id: number) {
    const rows = await this.dataSource.query(
      `SELECT estado FROM nomina_periodos WHERE id = ? LIMIT 1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`Período ${id} no encontrado.`);
    if (rows[0].estado !== 'borrador') {
      throw new BadRequestException('El período ya está cerrado.');
    }
    await this.dataSource.query(
      `UPDATE nomina_periodos SET estado = 'cerrada' WHERE id = ?`,
      [id],
    );
    return { mensaje: 'Período cerrado.' };
  }

  /**
   * Pago masivo: abona TODO el saldo pendiente de cada renglón del período
   * (uno por empleado) con la misma fecha/medio. Es el atajo para cuando sí
   * se paga a todos igual — para acuerdos individuales se usa registrarAbono
   * renglón por renglón. Registro/trazabilidad, no mueve dinero real ni toca
   * el módulo Pagos.
   */
  async pagarPeriodo(id: number, dto: PagarPeriodoDto, username?: string) {
    return this.dataSource.transaction(async (m) => {
      const rows = await m.query(
        `SELECT estado FROM nomina_periodos WHERE id = ? LIMIT 1 FOR UPDATE`,
        [id],
      );
      if (!rows[0]) throw new NotFoundException(`Período ${id} no encontrado.`);
      if (rows[0].estado === 'borrador') {
        throw new BadRequestException('Cerrá el período antes de marcarlo como pagado.');
      }
      const pendientes = await m.query(
        `SELECT id, saldo FROM nomina_detalle WHERE periodo_id = ? AND saldo > 0 FOR UPDATE`,
        [id],
      );
      if (!pendientes.length) {
        throw new BadRequestException('Ya no hay saldo pendiente en este período.');
      }
      for (const row of pendientes) {
        const monto = N(row.saldo);
        await m.query(
          `INSERT INTO nomina_abonos (detalle_id, monto, fecha, medio_pago, observaciones, created_by)
           VALUES (?, ?, ?, ?, 'Pago masivo del período', ?)`,
          [N(row.id), monto, dto.fecha_pago, dto.medio_pago, username ?? null],
        );
        await m.query(`UPDATE nomina_detalle SET saldo = 0 WHERE id = ?`, [N(row.id)]);
      }
      await m.query(
        `UPDATE nomina_periodos SET estado = 'pagada', fecha_pago = ?, medio_pago = ?, pagado_por = ? WHERE id = ?`,
        [dto.fecha_pago, dto.medio_pago, username ?? null, id],
      );
      return { mensaje: `Pago masivo registrado (${pendientes.length} empleados).` };
    });
  }

  /**
   * Abono parcial a UN renglón (empleado dentro de un período cerrado). Se
   * puede llamar varias veces hasta saldar. Si con este abono se saldan TODOS
   * los renglones del período, el período pasa a 'pagada' automáticamente.
   */
  async registrarAbono(detalleId: number, dto: RegistrarAbonoDto, username?: string) {
    return this.dataSource.transaction(async (m) => {
      const rows = await m.query(
        `SELECT d.*, pe.estado AS periodo_estado
           FROM nomina_detalle d JOIN nomina_periodos pe ON pe.id = d.periodo_id
          WHERE d.id = ? LIMIT 1 FOR UPDATE`,
        [detalleId],
      );
      const det = rows[0];
      if (!det) throw new NotFoundException(`Renglón ${detalleId} no encontrado.`);
      if (det.periodo_estado === 'borrador') {
        throw new BadRequestException('Cerrá el período antes de registrar pagos.');
      }
      const saldo = N(det.saldo);
      if (saldo <= 0) {
        throw new BadRequestException('Este empleado ya no tiene saldo pendiente en este período.');
      }
      const monto = N(dto.monto);
      if (monto > saldo + 0.01) {
        throw new BadRequestException(`El abono no puede superar el saldo pendiente (${saldo}).`);
      }
      await m.query(
        `INSERT INTO nomina_abonos (detalle_id, monto, fecha, medio_pago, observaciones, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [detalleId, monto, dto.fecha_pago, dto.medio_pago, dto.observaciones ?? null, username ?? null],
      );
      const nuevoSaldo = r0(saldo - monto);
      await m.query(`UPDATE nomina_detalle SET saldo = ? WHERE id = ?`, [nuevoSaldo, detalleId]);

      const pendientes = await m.query(
        `SELECT COUNT(*) AS n FROM nomina_detalle WHERE periodo_id = ? AND saldo > 0`,
        [det.periodo_id],
      );
      if (N(pendientes[0].n) === 0) {
        await m.query(
          `UPDATE nomina_periodos SET estado = 'pagada', fecha_pago = ?, medio_pago = ?, pagado_por = ? WHERE id = ?`,
          [dto.fecha_pago, dto.medio_pago, username ?? null, det.periodo_id],
        );
      }
      return { mensaje: 'Abono registrado.' };
    });
  }

  // ── DESCUENTOS (mercancía sacada / acuerdos verbales) ───────────────────
  /**
   * Registra un descuento comercial a un empleado. Se intenta aplicar de
   * inmediato contra el renglón más antiguo con saldo pendiente en un período
   * YA CERRADO; si no hay ninguno (ej. ya le pagaron todo), queda 'pendiente'
   * y se cobra automáticamente en la próxima liquidación (crearPeriodo).
   */
  async registrarDescuento(empleadoId: number, dto: RegistrarDescuentoDto, username?: string) {
    await this.getEmpleado(empleadoId);
    return this.dataSource.transaction(async (m) => {
      const ins = await m.query(
        `INSERT INTO nomina_descuentos (empleado_id, concepto, monto, fecha, estado, created_by)
         VALUES (?, ?, ?, ?, 'pendiente', ?)`,
        [empleadoId, dto.concepto, dto.monto, dto.fecha, username ?? null],
      );
      const target = await m.query(
        `SELECT d.id, d.saldo FROM nomina_detalle d
           JOIN nomina_periodos pe ON pe.id = d.periodo_id
          WHERE d.empleado_id = ? AND pe.estado = 'cerrada' AND d.saldo > 0
          ORDER BY pe.fecha_fin ASC, d.id ASC LIMIT 1 FOR UPDATE`,
        [empleadoId],
      );
      if (target[0]) {
        const detalleId = N(target[0].id);
        const saldoActual = N(target[0].saldo);
        const aplicado = await this.aplicarDescuentosPendientes(m, empleadoId, detalleId, saldoActual, username);
        if (aplicado > 0) {
          await m.query(
            `UPDATE nomina_detalle SET total_descuentos = total_descuentos + ?, saldo = saldo - ? WHERE id = ?`,
            [aplicado, aplicado, detalleId],
          );
        }
      }
      return { mensaje: 'Descuento registrado.', id: N(ins.insertId) };
    });
  }

  /** Historial de descuentos de un empleado (o de todos si no se pasa id). */
  async listarDescuentos(empleadoId?: number) {
    if (empleadoId) {
      return this.dataSource.query(
        `SELECT d.*, pe.etiqueta AS aplicado_periodo_etiqueta
           FROM nomina_descuentos d
           LEFT JOIN nomina_detalle det ON det.id = d.aplicado_detalle_id
           LEFT JOIN nomina_periodos pe ON pe.id = det.periodo_id
          WHERE d.empleado_id = ?
          ORDER BY d.estado ASC, d.fecha DESC, d.id DESC`,
        [empleadoId],
      );
    }
    return this.dataSource.query(
      `SELECT d.*, e.nombre AS empleado_nombre, pe.etiqueta AS aplicado_periodo_etiqueta
         FROM nomina_descuentos d
         JOIN nomina_empleados e ON e.id = d.empleado_id
         LEFT JOIN nomina_detalle det ON det.id = d.aplicado_detalle_id
         LEFT JOIN nomina_periodos pe ON pe.id = det.periodo_id
        ORDER BY d.estado ASC, d.fecha DESC, d.id DESC`,
    );
  }

  async eliminarPeriodo(id: number) {
    const rows = await this.dataSource.query(
      `SELECT estado FROM nomina_periodos WHERE id = ? LIMIT 1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`Período ${id} no encontrado.`);
    if (rows[0].estado !== 'borrador') {
      throw new BadRequestException('Solo se puede eliminar un período en borrador.');
    }
    await this.dataSource.transaction(async (m) => {
      // Los descuentos que se hayan cobrado en este período (recién creado,
      // todavía en borrador) vuelven a quedar 'pendiente' para no perderlos.
      await m.query(
        `UPDATE nomina_descuentos SET estado = 'pendiente', aplicado_detalle_id = NULL
          WHERE aplicado_detalle_id IN (SELECT id FROM nomina_detalle WHERE periodo_id = ?)`,
        [id],
      );
      await m.query(`DELETE FROM nomina_detalle WHERE periodo_id = ?`, [id]);
      await m.query(`DELETE FROM nomina_periodos WHERE id = ?`, [id]);
    });
    return { mensaje: 'Período eliminado.' };
  }
}
