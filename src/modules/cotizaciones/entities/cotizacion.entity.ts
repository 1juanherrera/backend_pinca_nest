import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Tabla `cotizaciones` (cabecera). */
@Entity('cotizaciones')
export class Cotizacion {
  @PrimaryGeneratedColumn({ name: 'id_cotizaciones' })
  id_cotizaciones: number;

  @Column({ type: 'varchar', length: 20 })
  numero: string;

  @Column({ type: 'int' })
  cliente_id: number;

  @Column({ type: 'date' })
  fecha_cotizacion: string;

  @Column({ type: 'date' })
  fecha_vencimiento: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  impuestos: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  retencion: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: string;

  @Column({
    type: 'enum',
    enum: ['Borrador', 'Enviada', 'Aceptada', 'Rechazada', 'Vencida', 'Convertida'],
    default: 'Borrador',
  })
  estado: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'int', nullable: true })
  facturas_id: number | null;

  @Column({ type: 'timestamp', nullable: true })
  creado_en: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
