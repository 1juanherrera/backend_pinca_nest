import { Controller, Get, Query } from '@nestjs/common';

import { AuditoriaService } from './auditoria.service';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

/** Réplica fiel de AuditoriaController (CI4). */
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly svc: AuditoriaService) {}

  @Get('login-attempts')
  loginAttempts(@CurrentUser() user: JwtUser, @Query() query: Record<string, string>) {
    return this.svc.loginAttempts(user, query);
  }

  @Get('movimientos')
  movimientos(@CurrentUser() user: JwtUser, @Query() query: Record<string, string>) {
    return this.svc.movimientos(user, query);
  }
}
