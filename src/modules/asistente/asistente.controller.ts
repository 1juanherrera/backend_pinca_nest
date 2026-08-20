import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { AsistenteService } from './asistente.service';

@Controller('asistente')
@Public()
@UseGuards(ApiKeyGuard)
export class AsistenteController {
  constructor(private readonly svc: AsistenteService) {}

  @Post('consulta')
  async consulta(@Body() body: { pregunta?: string }) {
    const pregunta = String(body?.pregunta ?? '').trim();
    return this.svc.consulta(pregunta);
  }
}
