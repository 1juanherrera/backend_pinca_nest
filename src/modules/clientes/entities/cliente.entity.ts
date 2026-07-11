import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Tabla `clientes`. numero_documento y telefono son BIGINT en BD → TypeORM los
 * mapea a string para no perder precisión (igual que getRowArray de CI4).
 */
@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn({ name: 'id_clientes' })
  id_clientes: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombre_encargado: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombre_empresa: string | null;

  @Column({ type: 'bigint', nullable: true })
  numero_documento: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ciudad: string | null;

  @Column({ type: 'int', nullable: true, default: 30 })
  plazo_pago: number | null;

  @Column({ type: 'bigint', nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  email: string | null;

  @Column({ type: 'tinyint', default: 2 })
  tipo: number;

  @Column({ type: 'tinyint', default: 1 })
  estado: number;

  @Column({ type: 'int', nullable: true, default: 30 })
  dias_credito: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0 })
  limite_credito: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0 })
  credito_usado: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
