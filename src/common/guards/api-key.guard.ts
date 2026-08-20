import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const key = String(process.env.ASISTENTE_API_KEY ?? '');
    if (key === '') throw new UnauthorizedException('ASISTENTE_API_KEY no configurada en el servidor.');

    const req = context.switchToHttp().getRequest();
    const header = String(req.headers['x-api-key'] ?? '');
    if (header === '' || header !== key) {
      throw new UnauthorizedException('API key inválida o no proporcionada.');
    }
    return true;
  }
}
