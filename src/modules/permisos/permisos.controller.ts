import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
} from '@nestjs/common';

import { PermisosService } from './permisos.service';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { CambiarRolDto, UpdatePermisosDto } from './dto/permisos.dto';

/** Réplica fiel de PermisosController (CI4). Rutas bajo /roles. */
@Controller('roles')
export class PermisosController {
  constructor(private readonly permisos: PermisosService) {}

  @Get('permisos')
  index() {
    return this.permisos.index();
  }

  @Get('permisos/:rol')
  show(@Param('rol') rol: string) {
    return this.permisos.show(rol);
  }

  @Put(':rol/permisos')
  update(
    @CurrentUser() user: JwtUser,
    @Param('rol') rol: string,
    @Body() dto: UpdatePermisosDto,
  ) {
    return this.permisos.update(user, rol, dto);
  }

  @Get('usuarios')
  listarUsuarios(@CurrentUser() user: JwtUser) {
    return this.permisos.listarUsuarios(user);
  }

  @Patch('usuarios/:id/rol')
  cambiarRol(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarRolDto,
  ) {
    return this.permisos.cambiarRol(user, id, dto);
  }
}
