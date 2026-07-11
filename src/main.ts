import { NestFactory } from '@nestjs/core';
import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
  ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Convierte los errores de class-validator al shape de `apiValidationError` de CI4:
 *   { msg: "Datos inválidos", errors: { <campo>: "<primer mensaje>" } }
 * (el HttpExceptionFilter lo emite como { ok:false, msg, errors }).
 */
function validationExceptionFactory(errors: ValidationError[]) {
  const fieldErrors: Record<string, string> = {};
  for (const e of errors) {
    if (e.constraints) {
      // Priorizar el mensaje de "requerido" sobre los de formato/longitud
      // (más claro cuando el campo simplemente falta).
      fieldErrors[e.property] =
        e.constraints.isNotEmpty ?? Object.values(e.constraints)[0];
    }
  }
  return new UnprocessableEntityException({
    msg: 'Datos inválidos',
    errors: fieldErrors,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Todas las rutas bajo /api (igual que CI4).
  app.setGlobalPrefix('api');

  // CORS restringido al frontend, igual que CorsFilter en CI4.
  app.enableCors({
    origin: config.get<string>('corsOrigin'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  // Validación declarativa por DTO. Reemplaza ValidatesJson de CI4.
  // whitelist = descarta props no declaradas (protección mass-assignment).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // CI4 devuelve 422 con errores por campo (apiValidationError).
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  // Errores → { ok:false, msg }. NO envolvemos las respuestas de éxito:
  // los controllers devuelven el payload CRUDO tal como hace respond() en CI4
  // (array/objeto plano; mutaciones devuelven { mensaje, id|data }).
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[PINCA-Nest] escuchando en http://localhost:${port}/api`);
}

void bootstrap();
