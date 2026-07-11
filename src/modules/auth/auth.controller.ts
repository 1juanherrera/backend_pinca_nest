import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Patch,
  Post,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import {
  ActualizarPerfilDto,
  CambiarPasswordDto,
  CrearUsuarioDto,
  LoginDto,
  RefreshDto,
} from './dto/auth.dto';

/** Réplica fiel de UsuarioController (CI4). Rutas sin prefijo de dominio (login, crear, auth/*, usuarios/*). */
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  @Post('crear')
  @HttpCode(200)
  crear(@CurrentUser() user: JwtUser, @Body() dto: CrearUsuarioDto) {
    return this.auth.crear(user, dto);
  }

  @Get('auth/me')
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user);
  }

  @Post('auth/logout')
  @HttpCode(200)
  logout(@CurrentUser() user: JwtUser) {
    return this.auth.logout(user);
  }

  @Public()
  @Post('auth/refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @Patch('usuarios/mi-password')
  cambiarPassword(@CurrentUser() user: JwtUser, @Body() dto: CambiarPasswordDto) {
    return this.auth.cambiarPassword(user, dto);
  }

  @Patch('usuarios/mi-perfil')
  actualizarPerfil(@CurrentUser() user: JwtUser, @Body() dto: ActualizarPerfilDto) {
    return this.auth.actualizarPerfil(user, dto);
  }

  @Get('usuarios/mi-actividad')
  miActividad(@CurrentUser() user: JwtUser) {
    return this.auth.miActividad(user);
  }
}
