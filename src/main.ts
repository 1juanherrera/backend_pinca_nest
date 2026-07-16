import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
  ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { existsSync } from 'fs';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
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
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Security headers. Config API-safe:
  //  - contentSecurityPolicy:false → es una API JSON, no sirve HTML (el CSP no aplica
  //    y podría estorbar); el frontend tiene su propio CSP.
  //  - crossOriginResourcePolicy:'cross-origin' → permite que el frontend (otro origin)
  //    cargue el logo de /uploads (el default 'same-origin' lo bloquearía).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Archivos subidos (logo empresa) servidos en /uploads desde el MISMO dir donde
  // los escribe EmpresaService (PINCA_PUBLIC_DIR ?? cwd/public). El frontend pide
  // el logo en el ORIGIN sin /api → se sirven a nivel raíz, no bajo el prefijo global.
  // (Antes: nadie servía /uploads → el logo daba 404 en prod; los PDF usan base64.)
  const publicDir =
    process.env.PINCA_PUBLIC_DIR ?? join(process.cwd(), 'public');
  app.useStaticAssets(publicDir);

  // ── Opción A del cutover: Nest sirve el FRONTEND (SPA de Vite) ──
  // Monta el `dist/` del build (FRONTEND_DIST, ej. montado como volumen en Docker).
  // Sirve los archivos estáticos y hace fallback a index.html para las rutas de
  // cliente (React Router). Si no hay build (dev con Vite aparte), no hace nada.
  const frontendDist =
    process.env.FRONTEND_DIST ?? join(process.cwd(), 'frontend-dist');
  const indexHtml = join(frontendDist, 'index.html');
  if (existsSync(indexHtml)) {
    app.useStaticAssets(frontendDist);
    app.use((req: Request, res: Response, next: NextFunction) => {
      // No interceptar API ni uploads; solo GET de navegación → index.html.
      if (
        req.method !== 'GET' ||
        req.path.startsWith('/api') ||
        req.path.startsWith('/uploads')
      ) {
        return next();
      }
      res.sendFile(indexHtml);
    });
    // eslint-disable-next-line no-console
    console.log(`[PINCA-Nest] sirviendo frontend desde ${frontendDist}`);
  }

  // Cierre limpio del pool de conexiones ante SIGTERM/SIGINT (deploys rolling).
  app.enableShutdownHooks();

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
