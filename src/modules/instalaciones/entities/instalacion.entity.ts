import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Tabla `instalaciones` (sedes). FK id_empresa → empresa.id_empresa (NOT NULL). */
@Entity('instalaciones')
export class Instalacion {
  @PrimaryGeneratedColumn({ name: 'id_instalaciones' })
  id_instalaciones: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  nombre: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ciudad: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  telefono: string | null;

  @Column({ type: 'int' })
  id_empresa: number;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
