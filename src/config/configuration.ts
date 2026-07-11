import * as Joi from 'joi';

/**
 * Esquema de validación de variables de entorno.
 * La app NO arranca si falta algo crítico (TOKEN_SECRET, credenciales DB).
 * Esto reemplaza el chequeo manual que hacía CI4 en JwtFilter/UsuarioController.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  CORS_ALLOWED_ORIGIN: Joi.string().default('http://localhost:5173'),

  // Debe coincidir con pinca_backend/.env → TOKEN_SECRET. Sin fallback débil.
  TOKEN_SECRET: Joi.string()
    .min(32)
    .invalid('miClaveSuperSecreta')
    .required(),

  DB_HOST: Joi.string().default('127.0.0.1'),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),
});

/**
 * Objeto de configuración tipado. Se accede vía ConfigService.get('...').
 */
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ALLOWED_ORIGIN ?? 'http://localhost:5173',
  jwt: {
    // Mismo secreto y algoritmo que CI4 (firebase/php-jwt HS256).
    secret: process.env.TOKEN_SECRET as string,
    algorithm: 'HS256' as const,
  },
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME as string,
  },
});
