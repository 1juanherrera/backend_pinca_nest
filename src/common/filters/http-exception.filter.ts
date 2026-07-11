import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Traduce CUALQUIER excepción al shape de error que espera el frontend de PINCA:
 *   { ok: false, msg: "..." }                (equivalente a ApiResponse::apiFail)
 *   { ok: false, msg: "...", errors: {...} } (validación 422, apiValidationError)
 *
 * El frontend (apiClient.js) lee `.message || .messages.error || .msg` para los
 * toasts, así que este `{ok:false, msg}` es indistinguible de CI4 en la práctica.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let msg = 'Error interno del servidor';
    let errors: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        msg = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        // Excepciones propias (ej. validationExceptionFactory): { msg, errors }.
        if (typeof r.msg === 'string') {
          msg = r.msg;
          if (r.errors && typeof r.errors === 'object') {
            errors = r.errors as Record<string, unknown>;
          }
        } else if (Array.isArray(r.message)) {
          msg = 'Datos inválidos';
          errors = { message: r.message };
        } else if (typeof r.message === 'string') {
          msg = r.message;
        }
      }
    } else if (exception instanceof Error) {
      // No controlado: log completo, mensaje genérico (no filtrar internals).
      this.logger.error(exception.message, exception.stack);
      msg =
        process.env.NODE_ENV === 'development'
          ? exception.message
          : 'Error interno del servidor';
    }

    const body: Record<string, unknown> = { ok: false, msg };
    if (errors) body.errors = errors;

    response.status(status).json(body);
  }
}
