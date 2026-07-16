import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from './common/decorators/public.decorator';

/**
 * GET /api/health — endpoint público (sin JWT), equivalente al HealthController de CI4.
 * Chequea conectividad con la BD. Devuelve el shape crudo tal cual.
 */
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    let db = false;
    try {
      await this.dataSource.query('SELECT 1');
      db = true;
    } catch {
      db = false;
    }
    // 503 cuando la BD está caída → un liveness/readiness probe que mira el código
    // HTTP detecta el degradado (antes devolvía 200 aunque la BD estuviera muerta).
    res.status(db ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      ok: db,
      status: db ? 'ok' : 'degraded',
      db,
      backend: 'nest',
      timestamp: Math.floor(Date.now() / 1000),
      version: '0.1',
    };
  }
}
