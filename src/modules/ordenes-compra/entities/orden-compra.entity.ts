import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Tabla `ordenes_compra` (cabecera). PK id_orden. */
@Entity('ordenes_compra')
export class OrdenCompra {
  @PrimaryGeneratedColumn({ name: 'id_orden' })
  id_orden: number;

  @Column({ type: 'varchar', length: 20 })
  numero: string;

  @Column({ type: 'int' })
  proveedor_id: number;

  @Column({ type: 'int' })
  bodegas_id: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'date', nullable: true })
  fecha_esperada: string | null;

  @Column({
    type: 'enum',
    enum: ['Borrador', 'Enviada', 'Recibida', 'Cancelada'],
    default: 'Borrador',
  })
  estado: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  iva_pct: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'timestamp', nullable: true })
  creado_en: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
