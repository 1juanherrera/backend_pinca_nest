import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Tabla `categoria` (categorías de producto). Schema verificado contra la BD viva.
 * ⚠️ `nombre` es varchar(13) en BD pero CI4 valida max_length[100] (bug heredado).
 */
@Entity('categoria')
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  id_categoria: number;

  @Column({ type: 'varchar', length: 13, nullable: true })
  nombre: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;
}
