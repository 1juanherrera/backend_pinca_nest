import { Controller, Get } from '@nestjs/common';
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
  async check() {
    let db = false;
    try {
      await this.dataSource.query('SELECT 1');
      db = true;
    } catch {
      db = false;
    }
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
