import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Tabla `remisiones` (cabecera). Enum estado: Pendiente|Facturada|Anulada. */
@Entity('remisiones')
export class Remision {
  @PrimaryGeneratedColumn({ name: 'id_remisiones' })
  id_remisiones: number;

  @Column({ type: 'varchar', length: 20 })
  numero: string;

  @Column({ type: 'int' })
  cliente_id: number;

  @Column({ type: 'date' })
  fecha_remision: string;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Facturada', 'Anulada'],
    default: 'Pendiente',
  })
  estado: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion_entrega: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'int', nullable: true })
  facturas_id: number | null;

  @Column({ type: 'int', nullable: true })
  movimiento_inventario_id: number | null;

  @Column({ type: 'timestamp', nullable: true })
  creado_en: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
