import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Tabla `item_general` (maestro de ítems). Se usa para find/softDelete/restore;
 * las lecturas ricas (con JOINs + stock) van por raw SQL en el service.
 */
@Entity('item_general')
export class ItemGeneral {
  @PrimaryGeneratedColumn({ name: 'id_item_general' })
  id_item_general: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
