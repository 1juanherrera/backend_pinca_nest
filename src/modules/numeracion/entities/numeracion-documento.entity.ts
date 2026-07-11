import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Tabla `numeracion_documentos`: series correlativas DIAN por tipo de documento. */
@Entity('numeracion_documentos')
export class NumeracionDocumento {
  @PrimaryGeneratedColumn({ name: 'id_numeracion' })
  id_numeracion: number;

  @Column({ type: 'varchar', length: 30 })
  tipo_doc: string;

  @Column({ type: 'varchar', length: 40, default: '' })
  prefijo: string;

  @Column({ type: 'tinyint', unsigned: true, default: 4 })
  padding: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  proximo_numero: number;

  @Column({ type: 'smallint', unsigned: true, nullable: true })
  anio_actual: number | null;

  @Column({ type: 'tinyint', default: 1 })
  reinicia_anual: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  resolucion_dian: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_resolucion: string | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  rango_min: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  rango_max: number | null;

  @Column({ type: 'date', nullable: true })
  fecha_vigencia_hasta: string | null;

  @Column({ type: 'tinyint', default: 1 })
  activo: number;

  @Column({ type: 'datetime', nullable: true })
  created_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  updated_at: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updated_by: string | null;
}
