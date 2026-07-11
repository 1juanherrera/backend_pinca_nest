import { Controller, Get } from '@nestjs/common';

import { SaludSistemaService } from './salud-sistema.service';

/** Réplica fiel de SaludSistemaController (CI4). GET /api/salud-sistema. */
@Controller('salud-sistema')
export class SaludSistemaController {
  constructor(private readonly svc: SaludSistemaService) {}

  @Get()
  index() {
    return this.svc.index();
  }
}
