import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Cliente de la API de Factus (facturación electrónica DIAN — proveedor en
 * evaluación, ver GUIA_NESTJS_PINCA.md / historial de sesión). Aislado: NO toca
 * `facturas` ni ningún otro módulo todavía — es el harness de la Fase 1 para
 * seguir probando contra el sandbox desde la app en vez de scripts sueltos.
 *
 * Auth: OAuth2 "password grant" (Laravel Passport) — POST /oauth/token con
 * grant_type=password + client_id/secret + username/password → access_token
 * (1h) + refresh_token. Token se cachea en memoria y se renueva antes de
 * expirar; NO se persiste en BD (vive mientras el proceso Nest esté arriba).
 *
 * Validado en sandbox (2026-07-29): un rechazo por formato de request (422) NO
 * consume el consecutivo del rango de numeración — es seguro reintentar tras
 * corregir. Un documento con `is_validated:true` puede traer avisos DIAN no
 * bloqueantes en `data.errors` (ej. NIT no coincide con RUT) — no es un fallo.
 */
@Injectable()
export class FactusService {
  private readonly logger = new Logger(FactusService.name);

  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly username: string;
  private readonly password: string;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt = 0; // epoch ms

  constructor() {
    this.baseUrl = String(process.env.FACTUS_BASE_URL ?? '').replace(/\/+$/, '');
    this.clientId = String(process.env.FACTUS_CLIENT_ID ?? '');
    this.clientSecret = String(process.env.FACTUS_CLIENT_SECRET ?? '');
    this.username = String(process.env.FACTUS_EMAIL ?? '');
    this.password = String(process.env.FACTUS_PASSWORD ?? '');
  }

  private configurado(): boolean {
    return !!(this.baseUrl && this.clientId && this.clientSecret && this.username && this.password);
  }

  private requireConfigurado(): void {
    if (!this.configurado()) {
      throw new BadRequestException(
        'Facturación electrónica (Factus) no está configurada: faltan FACTUS_* en .env',
      );
    }
  }

  /** ID de rango de numeración por defecto para facturas, si el caller no manda uno. */
  defaultNumberingRangeFactura(): number | undefined {
    const v = process.env.FACTUS_NUMBERING_RANGE_FACTURA;
    return v ? parseInt(v, 10) : undefined;
  }

  defaultNumberingRangeNotaCredito(): number | undefined {
    const v = process.env.FACTUS_NUMBERING_RANGE_NOTA_CREDITO;
    return v ? parseInt(v, 10) : undefined;
  }

  private async login(): Promise<void> {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username: this.username,
      password: this.password,
    });
    const { json } = await this.fetchJson(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body,
    });
    if (!json?.access_token) {
      throw new UnauthorizedException(
        json?.error_description || json?.message || 'Login contra Factus falló',
      );
    }
    this.accessToken = json.access_token;
    this.refreshToken = json.refresh_token ?? null;
    // Buffer de 60s para no operar con un token a punto de vencer.
    this.expiresAt = Date.now() + (Number(json.expires_in ?? 3600) - 60) * 1000;
    this.logger.log(`Login OK (token vence en ${json.expires_in ?? 3600}s)`);
  }

  private async refresh(): Promise<void> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken as string,
    });
    const { json } = await this.fetchJson(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body,
    });
    if (!json?.access_token) throw new Error('refresh sin access_token');
    this.accessToken = json.access_token;
    this.refreshToken = json.refresh_token ?? this.refreshToken;
    this.expiresAt = Date.now() + (Number(json.expires_in ?? 3600) - 60) * 1000;
    this.logger.log('Token renovado vía refresh_token');
  }

  private async ensureToken(): Promise<string> {
    this.requireConfigurado();
    if (!this.accessToken || Date.now() >= this.expiresAt) {
      if (this.refreshToken) {
        try {
          await this.refresh();
        } catch {
          await this.login();
        }
      } else {
        await this.login();
      }
    }
    return this.accessToken as string;
  }

  /** fetch con timeout — no interpreta status, solo devuelve {status, json}. */
  private async fetchJson(
    url: string,
    init: { method: string; headers?: Record<string, string>; body?: unknown },
    timeoutMs = 30_000,
  ): Promise<{ status: number; json: any }> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    let resp: Response;
    try {
      const isUrlEncoded = init.body instanceof URLSearchParams;
      resp = await fetch(url, {
        method: init.method,
        headers: {
          ...(isUrlEncoded ? {} : init.body ? { 'content-type': 'application/json' } : {}),
          ...init.headers,
        },
        body: isUrlEncoded ? (init.body as URLSearchParams) : init.body ? JSON.stringify(init.body) : undefined,
        signal: ctrl.signal,
      });
    } catch (err) {
      throw new ServiceUnavailableException(
        `No se pudo conectar con Factus: ${(err as Error).message}`,
      );
    } finally {
      clearTimeout(t);
    }
    const raw = await resp.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }
    return { status: resp.status, json: json ?? {} };
  }

  /** Request autenticado genérico contra /v2/*, con un reintento si el token expiró (401). */
  private async request(
    method: string,
    path: string,
    body?: unknown,
    reintentoAuth = true,
  ): Promise<any> {
    const token = await this.ensureToken();
    const { status, json } = await this.fetchJson(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      body,
    });

    if (status === 401 && reintentoAuth) {
      this.accessToken = null;
      return this.request(method, path, body, false);
    }
    if (status >= 200 && status < 300) return json;
    if (status === 422) {
      const errores = json?.data?.errors ?? json?.errors;
      const detalle = errores
        ? Object.entries(errores)
            .map(([campo, msgs]) => `${campo}: ${(msgs as string[]).join(', ')}`)
            .join(' | ')
        : json?.message ?? 'Error de validación';
      this.logger.warn(`422 en ${method} ${path}: ${detalle}`);
      throw new BadRequestException(`Factus rechazó el request: ${detalle}`);
    }
    this.logger.error(`${status} en ${method} ${path}: ${JSON.stringify(json).slice(0, 500)}`);
    throw new BadRequestException(
      `Factus devolvió ${status}: ${json?.message ?? json?.error_description ?? 'error desconocido'}`,
    );
  }

  // ── Endpoints ──────────────────────────────────────────────────────────

  getEmpresa() {
    return this.request('GET', '/v2/companies');
  }

  getRangosNumeracion() {
    return this.request('GET', '/v2/numbering-ranges');
  }

  crearFactura(payload: Record<string, unknown>) {
    return this.request('POST', '/v2/bills/validate', payload);
  }

  getFactura(number: string) {
    return this.request('GET', `/v2/bills/${encodeURIComponent(number)}`);
  }

  /** Devuelve {file_name, buffer} — Factus entrega el PDF como base64 en JSON. */
  async descargarFacturaPdf(number: string): Promise<{ fileName: string; buffer: Buffer }> {
    const json = await this.request('GET', `/v2/bills/${encodeURIComponent(number)}/download-pdf`);
    const data = json?.data ?? {};
    return {
      fileName: String(data.file_name ?? number) + '.pdf',
      buffer: Buffer.from(String(data.pdf_base_64_encoded ?? ''), 'base64'),
    };
  }

  async descargarFacturaXml(number: string): Promise<{ fileName: string; buffer: Buffer }> {
    const json = await this.request('GET', `/v2/bills/${encodeURIComponent(number)}/download-xml`);
    const data = json?.data ?? {};
    const b64 = String(data.xml_base_64_encoded ?? data.file_base_64_encoded ?? '');
    return {
      fileName: String(data.file_name ?? number) + '.xml',
      buffer: Buffer.from(b64, 'base64'),
    };
  }

  crearNotaCredito(payload: Record<string, unknown>) {
    return this.request('POST', '/v2/credit-notes/validate', payload);
  }

  getNotaCredito(number: string) {
    return this.request('GET', `/v2/credit-notes/${encodeURIComponent(number)}`);
  }
}
