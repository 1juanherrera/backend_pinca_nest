import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Conexión TypeORM a la MISMA base MySQL que usa CodeIgniter 4 (gestorpincadb).
 *
 * ⚠️ synchronize: FALSE — INNEGOCIABLE.
 * La BD ya existe y está en producción. Con synchronize:true, TypeORM alteraría
 * el schema para calzar con las entidades → BORRARÍA columnas y datos reales.
 * Durante la coexistencia, CI4 sigue siendo el dueño del schema (spark migrate).
 * Nest solo lee/escribe.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.username'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.database'),
        // Carga automática de las entidades registradas con forFeature() en cada módulo.
        autoLoadEntities: true,
        synchronize: false, // ← NUNCA true contra la BD real
        // Zona horaria y charset para calzar con la data existente.
        timezone: 'Z',
        charset: 'utf8mb4',
        // Devolver DATE/DATETIME/TIMESTAMP como STRING crudo (sin conversión a Date):
        //  - evita el corrimiento de día en columnas `date` por timezone
        //  - los datetime salen como "YYYY-MM-DD HH:MM:SS" (formato CI4), no ISO "...Z"
        dateStrings: true,
        // Pool de conexiones mysql2. El default es connectionLimit=10 sin
        // timeouts; con endpoints pesados (dashboard, listados) reteniendo
        // conexiones, ~10 requests concurrentes agotaban el pool y bloqueaban.
        // Subimos el límite y añadimos timeouts + keep-alive.
        extra: {
          connectionLimit: 20,
          waitForConnections: true,
          queueLimit: 0,
          connectTimeout: 15000,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
          maxIdle: 10,
          idleTimeout: 60000,
        },
        // Logs de query solo en dev.
        logging: config.get<string>('nodeEnv') === 'development' ? ['error', 'warn'] : ['error'],
      }),
    }),
  ],
})
export class DatabaseModule {}
