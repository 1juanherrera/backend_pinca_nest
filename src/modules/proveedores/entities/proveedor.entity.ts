import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Tabla `proveedor`. PK id_proveedor. Soft-delete vía deleted_at. */
@Entity('proveedor')
export class Proveedor {
  @PrimaryGeneratedColumn({ name: 'id_proveedor' })
  id_proveedor: number;

  @Column({ type: 'varchar', length: 60, nullable: true })
  nombre_encargado: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  nombre_empresa: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  numero_documento: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  email: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
