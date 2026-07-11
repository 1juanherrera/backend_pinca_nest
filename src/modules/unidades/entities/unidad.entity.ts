import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Mapea la tabla `unidad` de PINCA (unidades de medida: GALON, TAMBOR, KILO...).
 * Schema real (initdb/gestorpincadb.sql) + deleted_at (migración 2026-05-27).
 *
 * ⚠️ Verificá contra la BD viva con `DESCRIBE unidad;` antes de dar por cerrada
 *    la migración de este módulo (los dumps de initdb pueden estar desfasados).
 */
@Entity('unidad')
export class Unidad {
  @PrimaryGeneratedColumn({ name: 'id_unidad' })
  id_unidad: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion: string | null;

  @Column({ type: 'tinyint', nullable: true })
  estados: number | null;

  /** Factor de escala (ej. galones). TypeORM mapea decimal → string por precisión. */
  @Column({ type: 'decimal', precision: 10, scale: 5, nullable: true })
  escala: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
