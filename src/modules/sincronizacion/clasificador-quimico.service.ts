import { Injectable } from '@nestjs/common';

/**
 * Réplica fiel de App\Services\ClasificadorQuimicoService (CI4).
 *
 * Clasifica materias primas / insumos por IDENTIDAD QUÍMICA usando una IA con un
 * system prompt de "químico experto en pinturas". Auto-detecta el proveedor por la
 * API key presente en el entorno, con este orden de PRECEDENCIA:
 *   1. OpenRouter        → OPENROUTER_API_KEY (+ OPENROUTER_MODEL, default google/gemini-2.5-flash)
 *   2. Gemini (Google)   → GEMINI_API_KEY     (+ GEMINI_MODEL,     default gemini-2.0-flash)
 *   3. Claude (Anthropic)→ ANTHROPIC_API_KEY  (+ ANTHROPIC_MODEL,  default claude-sonnet-4-6)
 * (OpenRouter es primario; Gemini/Anthropic quedan como respaldo si no hay key de OR.)
 *
 * Usa `fetch` (HTTP crudo) para replicar byte-a-byte el `curlrequest` de CI4 y su
 * comportamiento multi-provider. OpenRouter usa el formato OpenAI (chat/completions);
 * Gemini y Anthropic sus formatos nativos. Si no hay ninguna key, lanza Error
 * (el controller lo captura como 400).
 */
const SYSTEM_PROMPT = `Eres un químico experto en formulación de pinturas, recubrimientos y materias primas
industriales. Recibes un listado de materias primas/insumos de un ERP, cada uno con su
nombre, categoría, unidad, y los nombres técnicos/marcas con que distintos proveedores
lo venden. Tu tarea es AGRUPAR los que son EL MISMO material químico funcional, aunque
tengan nombres comerciales, marcas o referencias distintas.

REGLAS:
- Agrupa por IDENTIDAD QUÍMICA FUNCIONAL. Ej: "Dióxido de titanio rutilo" agrupa TiO2,
  Ti-Pure R-902, Tioxide, Kronos 2310, etc.
- NO agrupes grados/calidades distintas que cambian la fórmula como si fueran idénticos
  (rutilo vs anatasa; resina al 50% vs 100% de sólidos; talco industrial vs farmacéutico).
  Si dudas de la equivalencia, marca confianza "baja" y explica el motivo de verificación.
- NO agrupes materiales con FUNCIÓN distinta aunque el nombre se parezca (dispersante vs
  espesante; biocida vs fungicida específico).
- Propón un NOMBRE BASE limpio, genérico, en español, SIN marca ni proveedor ni código
  (ej. "Dióxido de titanio rutilo", "Caolín calcinado", "Dispersante poliacrílico").
- Elige keep_id = el id del miembro con más proveedores o más stock (el más "canónico").
- Devuelve confianza por grupo Y por ítem ("alta" | "media" | "baja"). Marca "baja" en
  ítems dudosos con motivo (ej. "verificar grado con ficha técnica del proveedor").
- SOLO incluye grupos con 2 o más miembros (duplicados reales). Los ítems únicos se omiten.
- Un grupo NUNCA mezcla tipos distintos (no juntes una Materia Prima con un Insumo).

Responde EXCLUSIVAMENTE con JSON válido, sin texto antes ni después, con esta forma:
{
  "clusters": [
    {
      "identidad_quimica": "Dióxido de titanio rutilo",
      "nombre_base": "Dióxido de titanio rutilo",
      "clave_grupo": "dioxido-titanio-rutilo",
      "confianza": "alta",
      "razonamiento": "Todos son TiO2 grado rutilo de distintas marcas...",
      "tipo": 1,
      "keep_id": 123,
      "items": [
        {"item_general_id": 123, "confianza": "alta", "motivo": null},
        {"item_general_id": 456, "confianza": "media", "motivo": "marca distinta, misma función"}
      ]
    }
  ]
}`;

@Injectable()
export class ClasificadorQuimicoService {
  private readonly provider: 'openrouter' | 'gemini' | 'anthropic';
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const openrouter = String(process.env.OPENROUTER_API_KEY ?? '');
    const gemini = String(process.env.GEMINI_API_KEY ?? '');
    const anthropic = String(process.env.ANTHROPIC_API_KEY ?? '');
    if (openrouter !== '') {
      this.provider = 'openrouter';
      this.apiKey = openrouter;
      this.model = String(process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash');
    } else if (gemini !== '') {
      this.provider = 'gemini';
      this.apiKey = gemini;
      this.model = String(process.env.GEMINI_MODEL || 'gemini-2.0-flash');
    } else if (anthropic !== '') {
      this.provider = 'anthropic';
      this.apiKey = anthropic;
      this.model = String(process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6');
    } else {
      throw new Error(
        'Falta OPENROUTER_API_KEY, GEMINI_API_KEY o ANTHROPIC_API_KEY en .env. Usá el modo offline: php spark sync:clasificar --offline',
      );
    }
  }

  modelo(): string {
    return `${this.provider}:${this.model}`;
  }

  /** Clasifica el dataset completo, troceando en lotes (chunk mínimo 20). */
  async clasificar(dataset: Record<string, unknown>[], batchSize = 100): Promise<Record<string, unknown>[]> {
    const clusters: Record<string, unknown>[] = [];
    const size = Math.max(20, batchSize);
    const lotes: Record<string, unknown>[][] = [];
    for (let i = 0; i < dataset.length; i += size) lotes.push(dataset.slice(i, i + size));
    for (let i = 0; i < lotes.length; i++) {
      const parsed = await this.clasificarLote(lotes[i], i + 1, lotes.length);
      for (const c of (parsed.clusters as Record<string, unknown>[]) ?? []) clusters.push(c);
    }
    return clusters;
  }

  private async clasificarLote(
    lote: Record<string, unknown>[],
    n: number,
    total: number,
  ): Promise<Record<string, unknown>> {
    // Compactar para minimizar tokens (idéntico a CI4).
    const compacto = lote.map((it) => {
      const refs = ((it.referencias_proveedor as Record<string, unknown>[]) ?? []).map((r) =>
        `${String(r.nombre_tecnico ?? '')} [${String(r.proveedor ?? '')}]`.trim(),
      );
      return {
        id: it.id_item_general,
        nombre: it.nombre,
        tipo: it.tipo,
        categoria: it.categoria ?? null,
        refs,
        usos: it.usos_en_formulas ?? 0,
      };
    });

    const userMsg =
      `Lote ${n} de ${total}. Clasifica estos ítems (cada uno es un item_general ` +
      `del ERP; agrupa los que sean el mismo material químico):\n\n` +
      JSON.stringify(compacto, null, 2);

    let text: string;
    if (this.provider === 'openrouter') text = await this.callOpenRouter(userMsg);
    else if (this.provider === 'gemini') text = await this.callGemini(userMsg);
    else text = await this.callAnthropic(userMsg);
    return this.extraerJson(text);
  }

  private async callGemini(userMsg: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMsg }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 32768,
      },
    };
    const json = await this.post(url, body, {});
    let text = '';
    for (const p of (json?.candidates?.[0]?.content?.parts ?? []) as Record<string, unknown>[]) {
      text += String(p.text ?? '');
    }
    if (text === '') {
      const reason =
        json?.candidates?.[0]?.finishReason ?? json?.error?.message ?? 'sin contenido';
      throw new Error(`Gemini no devolvió texto (${reason}).`);
    }
    return text;
  }

  /**
   * OpenRouter usa el formato OpenAI (chat/completions). El system prompt va como
   * primer mensaje con role 'system'. response_format json_object es best-effort
   * (los modelos Gemini vía OR lo respetan; extraerJson cubre el resto).
   */
  private async callOpenRouter(userMsg: string): Promise<string> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 16000,
    };
    const json = await this.post('https://openrouter.ai/api/v1/chat/completions', body, {
      Authorization: `Bearer ${this.apiKey}`,
      // Opcionales de OpenRouter (rankings/atribución); no afectan el resultado.
      'X-Title': 'PINCA-ERP',
    });
    const text = String(json?.choices?.[0]?.message?.content ?? '');
    if (text === '') {
      const reason =
        json?.choices?.[0]?.finish_reason ?? json?.error?.message ?? 'sin contenido';
      throw new Error(`OpenRouter no devolvió texto (${reason}).`);
    }
    return text;
  }

  private async callAnthropic(userMsg: string): Promise<string> {
    const body = {
      model: this.model,
      max_tokens: 16000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMsg }],
    };
    const json = await this.post('https://api.anthropic.com/v1/messages', body, {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    });
    let text = '';
    for (const blk of (json?.content ?? []) as Record<string, unknown>[]) {
      if (blk.type === 'text') text += String(blk.text ?? '');
    }
    if (text === '') throw new Error('Anthropic no devolvió texto.');
    return text;
  }

  /** POST JSON con reintento; devuelve el body decodificado. Nunca loguea la URL (lleva la key). */
  private async post(
    url: string,
    body: unknown,
    headers: Record<string, string>,
    intentos = 2,
  ): Promise<any> {
    let ultimoError = '';
    for (let i = 0; i < intentos; i++) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 90_000);
        let resp: Response;
        try {
          resp = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...headers },
            body: JSON.stringify(body),
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(t);
        }
        const status = resp.status;
        let json: any = null;
        const raw = await resp.text();
        try { json = JSON.parse(raw); } catch { json = null; }
        if (status >= 200 && status < 300 && json && typeof json === 'object') return json;
        ultimoError = `HTTP ${status}: ${json?.error?.message ?? raw.slice(0, 200)}`;
      } catch (e) {
        ultimoError = e instanceof Error ? e.message : String(e);
      }
    }
    throw new Error(`Error llamando a la IA (${this.provider}): ${ultimoError}`);
  }

  private extraerJson(text: string): Record<string, unknown> {
    let t = text.trim();
    t = t.replace(/^```(?:json)?\s*|\s*```$/gm, '');
    try {
      const data = JSON.parse(t);
      if (data && typeof data === 'object') return data;
    } catch { /* sigue con fallback */ }
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const data = JSON.parse(t.slice(start, end + 1));
        if (data && typeof data === 'object') return data;
      } catch { /* cae al throw */ }
    }
    throw new Error('La IA no devolvió JSON válido.');
  }
}
