import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

const N = (x: unknown) => Number(x ?? 0);
const toCOP = (v: unknown): string => {
  const num = Number(v);
  if (Number.isNaN(num)) return '0';
  const sign = num < 0 ? '-' : '';
  const intStr = Math.round(Math.abs(num)).toString();
  return sign + intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const SYSTEM_PROMPT = `Eres el asistente virtual de PINCA (Pinturas Industriales del Caribe S.A.S), una fábrica de pinturas, esmaltes, anticorrosivos, barnices, vinilos, epóxicas y lacas ubicada en Barranquilla, Colombia.

Tu rol es responder preguntas sobre las FORMULACIONES (recetas de producción) de los productos de PINCA, incluyendo:
- Ingredientes y cantidades de cada formulación
- Costos de cada materia prima (precio por kg) y subtotal por ingrediente
- Costo total de materia prima, costo por galón y precio de venta estimado
- Instrucciones de preparación (fases, pasos de dispersión, tiempos de molienda)
- Proveedores disponibles para cada materia prima
- Propiedades técnicas de los productos (viscosidad, brillo, secado, cubrimiento)
- Inventario disponible de materias primas

REGLAS:
- SIEMPRE responde con los datos concretos que tienes. NUNCA pidas aclaración si puedes responder con la información disponible.
- Si hay varios productos similares (ej: "Esmalte Blanco" tiene varias variantes), muestra la información de TODOS los que tengan formulación activa. No preguntes cuál — muéstralos todos.
- Cuando te pidan costos o materias primas de un producto, muestra SIEMPRE la lista completa de ingredientes con: nombre, cantidad en kg, costo por kg, y subtotal (cantidad × costo). Al final muestra el costo total de MP, el costo por galón y el precio de venta estimado.
- Responde SIEMPRE en español, de forma clara y profesional.
- Si te preguntan por un producto que no está en los datos, dilo claramente.
- Los costos están en pesos colombianos (COP). Usa separador de miles con punto (ej: $12.500).
- Las cantidades de ingredientes están en kilogramos (kg) salvo que se indique otra unidad.
- Cuando muestres una formulación, organiza los ingredientes en orden y menciona las instrucciones de preparación si las hay.
- Si te preguntan algo fuera del alcance de formulaciones/producción de PINCA, indica amablemente que solo puedes ayudar con temas de formulaciones y producción.
- Sé directo y completo. Para WhatsApp, usa formato legible sin markdown pesado (nada de ** ni ##, usa números y guiones).
- Si la respuesta es larga, resume lo más importante primero.`;

@Injectable()
export class AsistenteService {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly dataSource: DataSource) {
    this.apiKey = String(process.env.OPENROUTER_API_KEY ?? '');
    this.model = String(process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash');
  }

  async consulta(pregunta: string): Promise<{ respuesta: string; modelo: string }> {
    if (!pregunta || pregunta.trim().length < 3) {
      throw new BadRequestException('La pregunta debe tener al menos 3 caracteres.');
    }
    if (this.apiKey === '') {
      throw new BadRequestException('OPENROUTER_API_KEY no configurada en el servidor.');
    }

    const contexto = await this.construirContexto(pregunta);
    const userMsg = `DATOS DEL SISTEMA (consulta la información relevante para responder):\n\n${contexto}\n\n---\nPREGUNTA DEL USUARIO:\n${pregunta.trim()}`;

    const respuesta = await this.callOpenRouter(userMsg);
    return { respuesta, modelo: this.model };
  }

  private async construirContexto(pregunta: string): Promise<string> {
    const q = pregunta.toUpperCase().trim();
    const partes: string[] = [];

    const catalogoProductos = await this.getCatalogoProductos();
    partes.push(catalogoProductos);

    const stopWords = new Set([
      'QUE', 'LOS', 'LAS', 'UNA', 'UNO', 'DEL', 'POR', 'CON', 'SUS', 'SIN', 'MAS', 'PERO',
      'PARA', 'COMO', 'DAME', 'DIME', 'CUAL', 'ESTE', 'ESTA', 'ESOS', 'ESAS', 'TIENE',
      'HAY', 'SON', 'ERA', 'TODO', 'CADA', 'MUY', 'YA', 'TAMBIEN', 'PUEDE', 'DESDE',
      'CUANTO', 'CUANTA', 'CUANTOS', 'CUANTAS', 'DONDE', 'QUIEN', 'CUANDO',
      'NECESITA', 'NECESITO', 'QUIERO', 'PRODUCIR', 'FABRICAR', 'HACER',
      'COSTOS', 'COSTO', 'PRECIO', 'PRECIOS', 'MATERIAS', 'PRIMAS', 'MATERIA', 'PRIMA',
      'INGREDIENTES', 'INGREDIENTE', 'FORMULACION', 'FORMULACIONES', 'RECETA',
      'PROVEEDORES', 'PROVEEDOR', 'INFORMACION', 'DATOS', 'LISTA', 'DETALLE',
    ]);
    const palabrasClave = q.split(/\s+/).filter((p) => p.length >= 3 && !stopWords.has(p));
    const productosRelevantes = await this.buscarProductosRelevantes(palabrasClave);

    if (productosRelevantes.length > 0) {
      for (const prod of productosRelevantes.slice(0, 5)) {
        const detalle = await this.getDetalleFormulacion(N(prod.id_item_general));
        if (detalle) partes.push(detalle);
      }
    }

    const proveedoresRelevantes = await this.buscarProveedoresRelevantes(palabrasClave);
    if (proveedoresRelevantes) partes.push(proveedoresRelevantes);

    return partes.join('\n\n---\n\n');
  }

  private async getCatalogoProductos(): Promise<string> {
    const productos: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo,
              CASE ig.tipo WHEN 0 THEN 'PRODUCTO' WHEN 1 THEN 'MATERIA PRIMA' WHEN 2 THEN 'INSUMO' END AS tipo_nombre,
              c.nombre AS categoria,
              ig.viscosidad, ig.color, ig.secado, ig.cubrimiento, ig.brillo_60,
              f.id_formulaciones, f.nombre AS nombre_formulacion
         FROM item_general ig
         LEFT JOIN categoria c ON c.id_categoria = ig.categoria_id
         LEFT JOIN formulaciones f ON f.item_general_id = ig.id_item_general AND f.estado = 1
        WHERE ig.deleted_at IS NULL AND ig.tipo = 0
        ORDER BY ig.nombre`,
    );
    const lineas = productos.map((p) => {
      const parts = [`- ${p.nombre} (${p.codigo ?? 'sin codigo'})`];
      if (p.categoria) parts.push(`[${p.categoria}]`);
      if (p.id_formulaciones) parts.push('(tiene formulacion)');
      else parts.push('(sin formulacion)');
      return parts.join(' ');
    });
    return `CATALOGO DE PRODUCTOS DE PINCA (${productos.length} productos):\n${lineas.join('\n')}`;
  }

  private async buscarProductosRelevantes(palabras: string[]): Promise<Record<string, unknown>[]> {
    if (palabras.length === 0) return [];

    // AND: cada palabra debe aparecer en el nombre, codigo o nombre de formulacion
    const condiciones = palabras
      .map(() => `(ig.nombre LIKE ? OR ig.codigo LIKE ? OR f.nombre LIKE ?)`)
      .join(' AND ');
    const params = palabras.flatMap((p) => {
      const like = `%${p}%`;
      return [like, like, like];
    });

    // Primero buscar con AND (todas las palabras). Si no hay resultados, fallback a OR.
    let rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT DISTINCT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo
         FROM item_general ig
         LEFT JOIN formulaciones f ON f.item_general_id = ig.id_item_general AND f.estado = 1
        WHERE ig.deleted_at IS NULL AND ig.tipo = 0 AND (${condiciones})
        ORDER BY ig.nombre ASC
        LIMIT 10`,
      params,
    );

    if (rows.length === 0 && palabras.length > 1) {
      const condOr = palabras
        .map(() => `(ig.nombre LIKE ? OR ig.codigo LIKE ? OR f.nombre LIKE ?)`)
        .join(' OR ');
      rows = await this.dataSource.query(
        `SELECT DISTINCT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo
           FROM item_general ig
           LEFT JOIN formulaciones f ON f.item_general_id = ig.id_item_general AND f.estado = 1
          WHERE ig.deleted_at IS NULL AND ig.tipo = 0 AND (${condOr})
          ORDER BY ig.nombre ASC
          LIMIT 10`,
        params,
      );
    }

    return rows;
  }

  private async getDetalleFormulacion(itemId: number): Promise<string | null> {
    const item: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.id_item_general, ig.nombre, ig.codigo, ig.tipo,
              ig.viscosidad, ig.p_g, ig.color, ig.secado, ig.cubrimiento, ig.brillo_60,
              COALESCE(i.cantidad, 0) AS inventario,
              COALESCE(NULLIF(ci.volumen, 0), 1) AS volumen_base,
              COALESCE(ci.envase, 0) AS envase, COALESCE(ci.etiqueta, 0) AS etiqueta,
              COALESCE(ci.plastico, 0) AS plastico, COALESCE(ci.costo_mod, 0) AS costo_mod,
              COALESCE(ci.porcentaje_utilidad, 50) AS margen
         FROM item_general ig
         LEFT JOIN inventario i ON i.item_general_id = ig.id_item_general
         LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
        WHERE ig.id_item_general = ?`,
      [itemId],
    );
    if (!item.length) return null;
    const it = item[0];

    const formRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id_formulaciones, nombre, descripcion FROM formulaciones WHERE item_general_id = ? AND estado = 1 LIMIT 1`,
      [itemId],
    );
    if (!formRows.length) return `PRODUCTO: ${it.nombre} (${it.codigo}) - No tiene formulacion activa.`;

    const form = formRows[0];
    const ingredientes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT igf.cantidad, igf.orden, igf.tipo, igf.texto, igf.nota,
              ig.nombre AS mp_nombre, ig.codigo AS mp_codigo,
              COALESCE(NULLIF(ci.costo_unitario, 0),
                (SELECT MIN(ip2.precio_con_iva / GREATEST(ip2.factor_conversion, 1))
                   FROM item_proveedor ip2 WHERE ip2.item_general_id = ig.id_item_general
                   AND ip2.deleted_at IS NULL AND ip2.disponible = 1), 0) AS costo_unitario,
              COALESCE(inv.cantidad, 0) AS stock
         FROM item_general_formulaciones igf
         LEFT JOIN item_general ig ON ig.id_item_general = igf.item_general_id
         LEFT JOIN costos_item ci ON ci.item_general_id = ig.id_item_general
         LEFT JOIN inventario inv ON inv.item_general_id = ig.id_item_general
        WHERE igf.formulaciones_id = ?
        ORDER BY igf.orden ASC, igf.id_item_general_formulaciones ASC`,
      [form.id_formulaciones],
    );

    let totalCostoMP = 0;
    let totalCantidad = 0;
    const lineas: string[] = [];
    for (const ing of ingredientes) {
      if ((ing.tipo ?? 'ingrediente') === 'ingrediente') {
        const cant = N(ing.cantidad);
        const costo = N(ing.costo_unitario);
        const costoTotal = cant * costo;
        totalCostoMP += costoTotal;
        totalCantidad += cant;
        lineas.push(
          `  ${ing.orden}. ${ing.mp_nombre} (${ing.mp_codigo ?? '-'}) | ${cant} kg | $${toCOP(costo)}/kg | Subtotal: $${toCOP(costoTotal)} | Stock: ${N(ing.stock)} kg${ing.nota ? ` | Nota: ${ing.nota}` : ''}`,
        );
      } else {
        lineas.push(`  ${ing.orden}. [${String(ing.tipo).toUpperCase()}] ${ing.texto ?? ''}`);
      }
    }

    const vol = N(it.volumen_base);
    const costoGalon = vol > 0 ? totalCostoMP / vol : totalCostoMP;
    const costoTotal = costoGalon + N(it.envase) + N(it.etiqueta) + N(it.plastico) + N(it.costo_mod);
    const margen = N(it.margen);
    const precioVenta = margen > 0 ? costoTotal * (1 + margen / 100) : costoTotal;

    const props: string[] = [];
    if (it.viscosidad) props.push(`Viscosidad: ${it.viscosidad}`);
    if (it.color) props.push(`Color: ${it.color}`);
    if (it.secado) props.push(`Secado: ${it.secado}`);
    if (it.cubrimiento) props.push(`Cubrimiento: ${it.cubrimiento}`);
    if (it.brillo_60) props.push(`Brillo 60: ${it.brillo_60}`);
    if (it.p_g) props.push(`P/G: ${it.p_g}`);

    return [
      `FORMULACION: ${form.nombre}`,
      `Producto: ${it.nombre} (${it.codigo})`,
      props.length > 0 ? `Propiedades: ${props.join(' | ')}` : null,
      `Volumen base: ${vol} galones | Inventario: ${N(it.inventario)} unidades`,
      `Ingredientes (${ingredientes.filter((i) => (i.tipo ?? 'ingrediente') === 'ingrediente').length}):`,
      ...lineas,
      `COSTOS:`,
      `  Costo total materia prima: $${toCOP(totalCostoMP)}`,
      `  Costo MP por galon: $${toCOP(costoGalon)}`,
      `  Envase: $${toCOP(it.envase)} | Etiqueta: $${toCOP(it.etiqueta)} | Plastico: $${toCOP(it.plastico)} | MOD: $${toCOP(it.costo_mod)}`,
      `  Costo total por galon: $${toCOP(costoTotal)}`,
      `  Margen de utilidad: ${margen}%`,
      `  Precio de venta estimado: $${toCOP(precioVenta)}`,
      `  Cantidad total MP: ${totalCantidad.toFixed(2)} kg`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async buscarProveedoresRelevantes(palabras: string[]): Promise<string | null> {
    if (palabras.length === 0) return null;
    const condiciones = palabras.map(() => `(ig.nombre LIKE ? OR ip.nombre LIKE ? OR p.nombre_empresa LIKE ?)`).join(' OR ');
    const params = palabras.flatMap((p) => {
      const like = `%${p}%`;
      return [like, like, like];
    });

    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ig.nombre AS materia_prima, ip.nombre AS item_proveedor, p.nombre_empresa AS proveedor,
              ip.precio_unitario, ip.precio_con_iva, ip.factor_conversion,
              u.nombre AS unidad_compra, ip.disponible
         FROM item_proveedor ip
         INNER JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
         LEFT JOIN item_general ig ON ig.id_item_general = ip.item_general_id
         LEFT JOIN unidad u ON u.id_unidad = ip.unidad_compra_id
        WHERE ip.deleted_at IS NULL AND (${condiciones})
        ORDER BY ip.precio_con_iva ASC
        LIMIT 20`,
      params,
    );
    if (rows.length === 0) return null;

    const lineas = rows.map((r) => {
      const factor = Math.max(N(r.factor_conversion) || 1, 0.001);
      const precioKg = N(r.precio_con_iva) / factor;
      return `  - ${r.item_proveedor ?? r.materia_prima} | Proveedor: ${r.proveedor} | Precio: $${toCOP(r.precio_con_iva)}/${r.unidad_compra ?? 'ud'} | $${toCOP(precioKg)}/kg | ${N(r.disponible) === 1 ? 'Disponible' : 'No disponible'}`;
    });
    return `PROVEEDORES RELEVANTES:\n${lineas.join('\n')}`;
  }

  private async callOpenRouter(userMsg: string): Promise<string> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    };
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60_000);
    let resp: Response;
    try {
      resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-Title': 'PINCA-ERP-Asistente',
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(t);
    }

    const raw = await resp.text();
    let json: any;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new BadRequestException(`OpenRouter devolvio respuesta invalida: ${raw.slice(0, 200)}`);
    }

    if (resp.status < 200 || resp.status >= 300) {
      throw new BadRequestException(
        `Error de OpenRouter (${resp.status}): ${json?.error?.message ?? raw.slice(0, 200)}`,
      );
    }

    const text = String(json?.choices?.[0]?.message?.content ?? '');
    if (text === '') {
      throw new BadRequestException(
        `OpenRouter no devolvio texto (${json?.choices?.[0]?.finish_reason ?? 'sin contenido'}).`,
      );
    }
    return text;
  }
}
