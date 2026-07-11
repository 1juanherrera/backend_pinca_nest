import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario } from '../usuarios/entities/usuario.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

/**
 * Módulo de autenticación (Fase 0).
 *
 * En esta fase SOLO valida tokens emitidos por CI4 (JwtStrategy). El login,
 * refresh y logout siguen sirviéndose desde CodeIgniter 4. Cuando se migre el
 * flujo completo de auth (Fase 4), acá se agregan AuthController + AuthService
 * (login con bcryptjs, refresh tokens rotativos, logout con token_version++).
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Usuario]),
    ConfiguracionModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [TypeOrmModule],
})
export class AuthModule {}
