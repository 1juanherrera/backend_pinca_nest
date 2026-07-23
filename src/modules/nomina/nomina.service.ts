import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ConfiguracionService } from '../configuracion/configuracion.service';
import {
  CreateEmpleadoDto,
  CreatePeriodoDto,
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
              (SELECT COUNT(*) FROM nomina_detalle d WHERE d.periodo_id = p.id) AS empleados
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
    return { ...rows[0], detalle };
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
      const empleados = await m.query(
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
        await m.query(
          `INSERT INTO nomina_detalle
             (periodo_id, empleado_id, empleado_nombre, empleado_documento, cargo, salario_base,
              dias_trabajados, salario_devengado, auxilio_transporte, total_devengado,
              deduccion_salud, deduccion_pension, total_deducciones, neto_pagar)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            periodoId, N(e.id), e.nombre, e.documento, e.cargo ?? null, salario,
            diasBase, c.salario_devengado, c.auxilio_transporte, c.total_devengado,
            c.deduccion_salud, c.deduccion_pension, c.total_deducciones, c.neto_pagar,
          ],
        );
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
    if (det.periodo_estado === 'cerrada') {
      throw new BadRequestException('El período está cerrado y no se puede modificar.');
    }
    const p = await this.getParams();
    const c = this.calcular(N(det.salario_base), dias, p);

    await this.dataSource.transaction(async (m) => {
      await m.query(
        `UPDATE nomina_detalle SET dias_trabajados = ?, salario_devengado = ?, auxilio_transporte = ?,
           total_devengado = ?, deduccion_salud = ?, deduccion_pension = ?, total_deducciones = ?, neto_pagar = ?
         WHERE id = ?`,
        [
          dias, c.salario_devengado, c.auxilio_transporte, c.total_devengado,
          c.deduccion_salud, c.deduccion_pension, c.total_deducciones, c.neto_pagar, detalleId,
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
    if (rows[0].estado === 'cerrada') {
      throw new BadRequestException('El período ya está cerrado.');
    }
    await this.dataSource.query(
      `UPDATE nomina_periodos SET estado = 'cerrada' WHERE id = ?`,
      [id],
    );
    return { mensaje: 'Período cerrado.' };
  }

  async eliminarPeriodo(id: number) {
    const rows = await this.dataSource.query(
      `SELECT estado FROM nomina_periodos WHERE id = ? LIMIT 1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`Período ${id} no encontrado.`);
    if (rows[0].estado === 'cerrada') {
      throw new BadRequestException('No se puede eliminar un período cerrado.');
    }
    await this.dataSource.transaction(async (m) => {
      await m.query(`DELETE FROM nomina_detalle WHERE periodo_id = ?`, [id]);
      await m.query(`DELETE FROM nomina_periodos WHERE id = ?`, [id]);
    });
    return { mensaje: 'Período eliminado.' };
  }
}
