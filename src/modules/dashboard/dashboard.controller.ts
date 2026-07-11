import { Controller, Get } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

/** Réplica fiel de DashboardController (CI4). GET /api/dashboard. */
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  index() {
    return this.dashboard.index();
  }
}
