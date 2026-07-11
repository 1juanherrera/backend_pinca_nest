import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { EmpresaService } from './empresa.service';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

/** Réplica de EmpresaController (CI4) — datos + logo. */
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresa: EmpresaService) {}

  @Get()
  get() {
    return this.empresa.empresa();
  }

  @Get('logo-base64')
  logoBase64() {
    return this.empresa.logoBase64();
  }

  @Put()
  update(@CurrentUser() user: JwtUser, @Body() body: Record<string, unknown>) {
    return this.empresa.update(user, body);
  }

  @Post('logo')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file?: { originalname: string; size: number; buffer: Buffer },
  ) {
    return this.empresa.uploadLogo(user, file);
  }

  @Delete('logo')
  deleteLogo(@CurrentUser() user: JwtUser) {
    return this.empresa.deleteLogo(user);
  }
}
