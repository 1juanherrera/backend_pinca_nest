import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Mapea la tabla `usuarios` existente de PINCA (creada por CI4).
 * PK: id_usuarios (convención id_<tabla>).
 *
 * ⚠️ synchronize está en FALSE — esta entidad NO altera la tabla, solo la mapea.
 * Verificá los nombres de columna contra la tabla real si algo falla.
 */
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuarios' })
  id_usuarios: number;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  /** bcrypt de PHP password_hash() — prefijo $2y$. Comparar con bcryptjs. */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre: string | null;

  @Column({ type: 'enum', enum: ['superadmin', 'admin', 'operador', 'visor'] })
  rol: 'superadmin' | 'admin' | 'operador' | 'visor';

  @Column({ type: 'tinyint', width: 1, default: 0 })
  password_must_change: number;

  /** Se incrementa al cambiar rol/password/logout → invalida JWTs viejos. */
  @Column({ type: 'int', unsigned: true, default: 1 })
  token_version: number;
}
