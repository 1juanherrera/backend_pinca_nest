import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Tabla `facturas` (cabecera). No hay FK real a clientes (validación manual). */
@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn({ name: 'id_facturas' })
  id_facturas: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero: string | null;

  @Column({ type: 'int', nullable: true })
  cliente_id: number | null;

  @Column({ type: 'date', nullable: true })
  fecha_emision: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  saldo_pendiente: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Parcial', 'Pagada', 'Vencida', 'Anulada'],
    default: 'Pendiente',
  })
  estado: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  subtotal: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  impuestos: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  retencion: string | null;

  @Column({ type: 'int', nullable: true })
  movimiento_inventario_id: number | null;

  @Column({ type: 'timestamp', nullable: true })
  creado_en: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
