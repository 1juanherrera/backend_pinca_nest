import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Tabla `bodegas`. FK instalaciones_id → instalaciones.id_instalaciones. */
@Entity('bodegas')
export class Bodega {
  @PrimaryGeneratedColumn({ name: 'id_bodegas' })
  id_bodegas: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion: string | null;

  @Column({ type: 'tinyint', nullable: true })
  estado: number | null;

  @Column({ type: 'int' })
  instalaciones_id: number;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
