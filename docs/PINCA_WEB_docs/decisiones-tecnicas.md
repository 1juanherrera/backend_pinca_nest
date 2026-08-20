# Notas técnicas — tecnologías observadas en Pintuco y su relevancia para Pinca

Contexto: al analizar `tienda.pintuco.com` se confirmó (por headers y HTML) que corre
sobre **VTEX IO**, con **React + GraphQL**, **SSR + hidratación**, detrás de **CDN
CloudFront**. Esta nota explica cada pieza (salvo React, ya conocida) y qué tan relevante
es para la arquitectura elegida de Pinca (Next.js + extensión del NestJS del ERP —
ver [contexto-proyecto.md](./contexto-proyecto.md)).

## GraphQL

Lenguaje de consulta para APIs, alternativa a REST. En vez de un endpoint fijo por
recurso, hay **un único endpoint** donde el cliente pide exactamente los campos que
necesita en una sola consulta:

```graphql
{
  producto(id: 123) {
    nombre
    precio
    imagenes { url }
    variantes { presentacion precio stock }
  }
}
```

**Por qué lo usa Pintuco**: una ficha de producto de pintura necesita datos de varias
entidades relacionadas a la vez (precio, variantes, imágenes, inventario, relacionados).
Con REST clásico eso son varios round-trips o un endpoint "gigante" a medida; con GraphQL
el frontend pide justo lo que la pantalla necesita en una sola llamada.

**Relevancia para Pinca**: no es obligatorio. NestJS soporta GraphQL de forma oficial
(`@nestjs/graphql`) y podría exponerse *además* de REST sin romper nada. Recomendación:
**arrancar con REST** (menos complejidad, reutiliza patrones ya existentes en
`pinca_backend_nest`) y considerar GraphQL solo si la ficha de producto se vuelve tan
compuesta que termine requiriendo muchas llamadas REST por página. Es una optimización,
no un requisito para el MVP.

## SSR + hidratación

Modo de renderizado nativo de Next.js:

1. **SSR (Server-Side Rendering)**: al pedir `/producto/pintura-blanca`, el servidor
   genera el HTML completo *ya con el contenido* (nombre, precio, imágenes) antes de
   enviarlo — no llega una página en blanco que se llena después con JS.
2. **Hidratación**: una vez ese HTML llega al navegador, React "engancha" el JavaScript
   sobre ese HTML para que botones, filtros, carrito, etc. se vuelvan interactivos, sin
   volver a renderizar todo desde cero.

**Relevancia para Pinca**:

- **SEO**: Google necesita ver el contenido real (precio, nombre, descripción) en el HTML
  para indexar bien las páginas de producto. Una SPA pura (todo renderizado en cliente) es
  mucho peor para esto.
- **Velocidad percibida en conexiones lentas**: buena parte del tráfico de e-commerce en
  Colombia viene de móviles con datos limitados. Con SSR el usuario ve contenido útil casi
  de inmediato, aunque el JS todavía esté cargando.

Esto ya viene gratis al elegir Next.js — no requiere nada especial más allá de usar bien
Server Components / SSR para las páginas de catálogo y producto.

## CDN CloudFront

Red de servidores distribuidos geográficamente que **cachean respuestas cerca del
usuario** para no golpear el servidor de origen en cada request. Pintuco lo usa delante de
VTEX con `stale-while-revalidate`: sirve una versión cacheada al instante y refresca en
segundo plano.

**Por qué es más relevante de lo normal para Pinca**: se decidió extender el backend
NestJS del ERP en vez de crear un servicio separado (ver
[contexto-proyecto.md](./contexto-proyecto.md)). Eso significa que **el tráfico público de
la tienda va a pegarle directo a la misma base de datos MySQL que usa el ERP transaccional**
(facturación, cotizaciones, etc.). Si el catálogo se pone popular, cada visitante
consultando precios/stock es una query más contra la DB de producción del ERP.

Un CDN (CloudFront, Cloudflare, o el edge caching que trae Vercel por defecto en Next.js)
puede:

- Cachear las páginas de catálogo/producto renderizadas por unos minutos (no necesitan ser
  100% en tiempo real).
- Cachear imágenes de producto.
- Reducir drásticamente las consultas directas al backend del ERP.

**Recomendación concreta**: dado que se comparte DB con el ERP, definir explícitamente
**qué endpoints del catálogo público son cacheables y por cuánto tiempo** (ej. lista de
productos y fichas: cache 5–15 min; stock/carrito: nunca cache). Con Vercel + headers
`Cache-Control` en las respuestas del NestJS se logra buena parte del mismo beneficio que
CloudFront le da a Pintuco, sin necesitar aún infraestructura AWS. Esto debería incluirse
como criterio al definir los endpoints de catálogo en el plan de
[prompt-extension-erp.md](./prompt-extension-erp.md).
