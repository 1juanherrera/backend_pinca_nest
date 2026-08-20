# Arquitectura, Patrones de Diseno y Practicas — PROYECTO PINCA

> Documento tecnico para referencia en entrevistas. Cubre la arquitectura real del sistema ERP PINCA (Pinturas Industriales del Caribe S.A.S.), los patrones de diseno aplicados y las practicas de ingenieria utilizadas.

---

## 1. Vision General del Proyecto

**PINCA** es un sistema ERP web completo para una empresa de pinturas industriales. Cubre: catalogo de productos, formulaciones (recetas/BOM), produccion, inventario con capas FIFO, compras (ordenes, recepcion con prorrateo), ventas (cotizaciones, remisiones, facturas), cartera y cobranza, nomina basica, facturacion electronica DIAN, costos de produccion, trazabilidad de lotes, y un asistente IA via WhatsApp.

### Stack Tecnologico

| Capa | Tecnologia |
|---|---|
| **Backend (API REST)** | NestJS 11, TypeScript, TypeORM 0.3, MySQL 8, Passport-JWT, class-validator, Helmet, `@nestjs/schedule` |
| **Frontend (SPA)** | React 19, Vite 7, TailwindCSS 4, React Router 7, TanStack Query 5, TanStack Table 8, Zustand 5, react-hook-form, Recharts, jsPDF, `@react-pdf/renderer`, react-window |
| **Infraestructura** | Docker Compose (stack unificado: API + MySQL 8 + phpMyAdmin) |
| **IA** | OpenRouter (primario), Google Gemini (respaldo), Anthropic (respaldo) |
| **Facturacion Electronica** | Factus (proveedor DIAN), impresion termica ESC/POS por red |

---

## 2. Arquitectura General

### Tipo: Monorepo con Arquitectura Cliente-Servidor, Containerizada

```
PROYECTO_PINCA/
├── backend_pinca_nest/     # API REST — NestJS 11
│   ├── src/
│   │   ├── common/         # Guards, Filters, Decorators (transversal)
│   │   ├── config/         # Configuracion centralizada + validacion Joi
│   │   ├── database/       # Modulo de conexion TypeORM
│   │   └── modules/        # 40 modulos de dominio
│   ├── docker-compose.yml  # Stack unificado
│   └── deploy/             # Scripts de deploy, indices SQL
├── pinca_frontend/         # SPA — React 19 + Vite
│   ├── src/
│   │   ├── api/            # Cliente HTTP (Axios) + rutas centralizadas
│   │   ├── config/         # Sidebar, modulos del sistema
│   │   ├── hooks/          # Custom hooks compartidos
│   │   ├── modules/        # 24 modulos de UI
│   │   ├── shared/         # ~40 componentes reutilizables
│   │   ├── store/          # Zustand (auth, UI, inventario)
│   │   └── utils/          # Formatters, helpers
│   └── dist/               # Build de produccion (Nest lo sirve)
└── docs/                   # Documentacion tecnica
```

### Arquitectura del Backend: Modular Monolitica

No es microservicios, pero esta organizado en **40 modulos NestJS independientes**, cada uno encapsulado con su propio controller, service, DTOs y entidades. Esta estructura permite que cualquier modulo se pueda extraer a un microservicio en el futuro sin refactorizar el resto.

**Modulos por dominio:**

| Dominio | Modulos |
|---|---|
| **Autenticacion** | `auth`, `permisos` |
| **Maestros** | `unidades`, `categorias`, `bodegas`, `instalaciones`, `clientes`, `proveedores`, `empresa`, `configuracion` |
| **Catalogo** | `catalogo`, `item`, `item-proveedor` |
| **Produccion** | `formulaciones`, `formulaciones-costos`, `preparaciones`, `costos`, `costos-produccion` |
| **Inventario** | `inventario`, `bodega-inventario` |
| **Compras** | `ordenes-compra`, `requisiciones`, `sincronizacion`, `comparador` |
| **Ventas** | `cotizaciones`, `facturas`, `remisiones`, `numeracion` |
| **Finanzas** | `pagos-cliente`, `notas-credito`, `cartera`, `gestiones-cobro`, `nomina` |
| **Facturacion Electronica** | `facturacion-electronica` (Factus/DIAN, aislado) |
| **Transversal** | `dashboard`, `search`, `trazabilidad`, `auditoria`, `salud-sistema`, `notificaciones`, `asistente` |

### Arquitectura del Frontend: Feature-based

24 modulos en `src/modules/`, cada uno autonomo:

```
ModuloX/
├── ModuloPage.jsx          # Componente de pagina
├── components/             # Sub-componentes (Table, Modal, Drawer, Form)
├── pages/                  # Sub-paginas (si aplica)
└── api/
    ├── use*.js             # React Query hooks (queries + mutations)
    └── *Keys.js            # Query key factories
```

### Despliegue: Stack Unificado con Docker

Un solo `docker compose up -d` levanta todo:

| Contenedor | Funcion |
|---|---|
| `pinca-erp-api` | NestJS sirviendo API (`/api/*`) + frontend estatico (SPA de Vite) + `/uploads` |
| `pinca-erp-db` | MySQL 8 con volumen persistente |
| `pinca-erp-pma` | phpMyAdmin en `:8081` |

El backend Nest sirve el frontend en produccion (Opcion A: sin nginx), con fallback SPA a `index.html` para React Router.

---

## 3. Patrones de Diseno

### 3.1 Backend

#### Dependency Injection (IoC Container)

NestJS inyecta automaticamente servicios, repositorios y configuracion via decoradores. Ningun service instancia sus dependencias manualmente.

```typescript
@Injectable()
export class FacturasService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}
}
```

#### Module Pattern

Cada dominio de negocio es un modulo NestJS encapsulado con imports/exports explicitos, promoviendo alta cohesion y bajo acoplamiento:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Factura]), NumeracionModule],
  controllers: [FacturasController],
  providers: [FacturasService],
  exports: [FacturasService], // solo si otros modulos lo necesitan
})
export class FacturasModule {}
```

#### Strategy Pattern (Autenticacion)

La autenticacion usa Passport con estrategia JWT, desacoplando la logica de validacion del token del guard de autorizacion:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: CiJwtPayload): Promise<JwtUser> {
    // Valida firma HS256, expiracion, y token_version contra BD
  }
}
```

#### Guard Pattern (Chain of Responsibility)

3 guards globales registrados como `APP_GUARD`, ejecutados en orden estricto:

```
Request → JwtAuthGuard → VisorReadonlyGuard → RolesGuard → Controller
            (autenticar)     (solo lectura?)      (rol requerido?)
```

- `JwtAuthGuard`: valida Bearer + `token_version`. Se salta con `@Public()`.
- `VisorReadonlyGuard`: bloquea mutaciones (POST/PUT/PATCH/DELETE) al rol `visor`.
- `RolesGuard`: exige `@Roles('admin')` si esta declarado. `superadmin` pasa siempre.

#### Decorator Pattern (Custom Decorators)

Decoradores propios para metadata declarativa:

```typescript
@Public()                    // Salta autenticacion
@Roles('admin')              // Requiere rol admin (o superadmin)
@CurrentUser()               // Inyecta el usuario autenticado
@CurrentUser('rol')          // Inyecta solo una propiedad
```

#### Filter Pattern (Exception Filter Global)

Un unico `HttpExceptionFilter` normaliza TODAS las excepciones al shape uniforme:

```typescript
// Exito: { ok: true, data: [...] }
// Error: { ok: false, msg: "mensaje" }
// Validacion: { ok: false, msg: "Datos invalidos", errors: { campo: "mensaje" } }
```

#### DTO Pattern + Validation Pipeline

DTOs con `class-validator` para validacion declarativa. `ValidationPipe` global con `whitelist: true` descarta propiedades no declaradas (proteccion contra mass-assignment):

```typescript
export class CreateFacturaDto {
  @IsNotEmpty() @IsNumber() cliente_id: number;
  @IsArray() @ValidateNested({ each: true }) items: ItemDto[];
}
```

#### Transaction Pattern con Pessimistic Locking

Para operaciones criticas (dinero, stock, folios), se usan transacciones con `SELECT ... FOR UPDATE`:

```typescript
await this.dataSource.transaction(async (manager) => {
  // Lock de la fila para evitar race conditions
  const [factura] = await manager.query(
    'SELECT * FROM facturas WHERE id = ? FOR UPDATE', [id]
  );
  // Operar sobre datos lockeados
  await manager.query('UPDATE facturas SET saldo = ? WHERE id = ?', [nuevoSaldo, id]);
});
```

#### Repository Pattern (Hibrido)

TypeORM provee repositorios para operaciones simples (CRUD), pero para queries de negocio complejas se usa SQL crudo parametrizado via `dataSource.query()`:

```typescript
// CRUD simple → repositorio
const user = await this.usuariosRepo.findOne({ where: { id_usuarios: id } });

// Query de negocio compleja → SQL crudo con placeholders (NUNCA interpolacion)
const rows = await this.dataSource.query(`
  SELECT f.*, c.nombre_empresa, c.numero_documento AS nit_cliente
  FROM facturas f
  JOIN clientes c ON c.id_clientes = f.cliente_id
  WHERE f.estado = ? AND f.deleted_at IS NULL
  ORDER BY f.id_facturas DESC
  LIMIT ? OFFSET ?
`, [estado, limit, offset]);
```

#### Strangler Fig Pattern (Migracion)

La migracion de CodeIgniter 4 (PHP) a NestJS se ejecuto modulo por modulo, con ambos backends coexistiendo sobre la misma base MySQL, hasta completar la migracion al 100%. Fases documentadas:

1. **Fase 1** — CRUDs simples (unidades, categorias, bodegas, etc.)
2. **Fase 2** — Documentos comerciales (cotizaciones, facturas, remisiones, OCs)
3. **Fase 3** — Inventario, produccion, formulaciones, sincronizacion
4. **Cierre** — Cutover completo, CI4 apagado

### 3.2 Frontend

#### Component Composition

Componentes shared reutilizables que se componen para armar cada vista:

```
HeaderSection + FlowCard (KPIs) + SearchFilterBar + TableShell > ErpTable
```

Componentes base: `Modal`, `Drawer`, `ErpTable`, `StatusBadge`, `FormInput`, `FormSelect`, `FormDate`, `Button`, `ActionMenu`, `EmptyState`, `IconBox`, `FlowCard`, `PageTabs`, `TableShell`.

#### Custom Hooks Pattern

Logica reutilizable extraida en hooks:

| Hook | Responsabilidad |
|---|---|
| `useClientPagination` | Paginacion client-side |
| `useBulkEstadoChange` | Seleccion multiple + cambio de estado masivo |
| `useFormValidation` | Validacion frontend con touched/blur |
| `useFieldErrors` | Mapeo de errores backend a campos de formulario |
| `useIvaToggle` | Toggle Con IVA / Sin IVA con persistencia |
| `useTheme` | Dark/Light/System con persistencia |
| `useUrlSearch` | Parametros de busqueda en URL |

#### Query Key Factory

Patron para invalidacion precisa de cache con React Query:

```javascript
export const facturaKeys = {
  all: ['facturas'],
  lists: () => [...facturaKeys.all, 'list'],
  list: (filters) => [...facturaKeys.lists(), filters],
  detail: (id) => [...facturaKeys.all, 'detail', id],
};
```

#### Optimistic Updates con Rollback

```javascript
const updateMutation = useMutation({
  mutationFn: (data) => apiClient.put(`/items/${data.id}`, data),
  onMutate: async (newData) => {
    const snapshot = queryClient.getQueriesData({ queryKey: inventarioKeys.all });
    // Actualizar cache optimistamente
    return { snapshot };
  },
  onError: (err, vars, context) => {
    // Rollback al snapshot si falla
    context.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: inventarioKeys.all }),
});
```

#### State Management: Zustand con Slices

Store compuesto por 3 slices con persistencia selectiva:

```javascript
// authSlice — token + user, persistido en localStorage
// uiSlice — drawers, modales, confirmaciones (efimero)
// inventorySlice — bodega activa, persistido en localStorage
```

#### Design Token System

Sistema de diseno completo en CSS custom properties con soporte dark mode:

```css
:root {
  --surface-base: #FFFFFF;
  --content-primary: #18181B;
  --border-base: #E4E4E7;
  --brand-primary: #FBBF24;  /* Amarillo Pinca */
}
html.dark {
  --surface-base: #18181B;
  --content-primary: #FAFAFA;
  --border-base: #3F3F46;
  /* brand-primary se mantiene identico */
}
```

Regla estricta: **cero colores hardcoded** en componentes. 145 archivos migrados de `zinc-X`/`blue-X` a tokens semanticos.

#### Code Splitting (Lazy Loading)

18 paginas con `React.lazy()` + `Suspense`:

```javascript
const FormulacionesPage = lazy(() => import('./modules/Formulaciones/FormulacionesPage.jsx'));
// Bundle principal: 1.77 MB → 424 KB (-76%)
```

#### Adapter Pattern (Paginacion)

Adaptador entre el shape del server y lo que consume `TableShell`:

```javascript
const adaptador = {
  paginated: data,
  currentPage: meta.page,
  totalItems: meta.total,
  totalPages: meta.pages,
  setCurrentPage: setPage,
  setPerPage: setLimit,
};
```

---

## 4. Practicas de Ingenieria

### 4.1 Seguridad

| Practica | Implementacion |
|---|---|
| **Zero SQL Injection** | Auditado: todos los valores con placeholders `?`, nunca interpolacion. Solo estructura (nombres de columna) con whitelist |
| **JWT + token_version** | Cambio de rol/password incrementa `token_version` en BD, invalidando instantaneamente todas las sesiones |
| **Refresh Token Rotativo** | Cada refresh genera par nuevo (access + refresh), impidiendo replay attacks |
| **Helmet** | Headers HTTP de seguridad automaticos (X-Frame-Options, HSTS, X-Content-Type-Options) |
| **CORS Restrictivo** | Solo acepta el origin del frontend. Obligatorio en produccion (falla si no se configura) |
| **RBAC 4 Niveles** | `superadmin > admin > operador > visor` con guards globales encadenados |
| **Mass-assignment Protection** | `whitelist: true` en ValidationPipe descarta propiedades no declaradas en DTOs |
| **Env Validation** | Variables de entorno validadas con Joi al arrancar. La app no levanta si falta algo obligatorio |
| **Concurrency Control** | `SELECT ... FOR UPDATE` en transacciones para folios, saldos y stock |

### 4.2 Calidad de Codigo

| Practica | Detalle |
|---|---|
| **ESLint estricto** | 0 errores en 327+ archivos (frontend) y 177 archivos (backend). React Compiler rules activas |
| **TypeScript estricto** | `tsc --noEmit` limpio en todo el backend |
| **Refactors sistematicos** | 24 componentes mas grandes del frontend y 15 funciones mas complejas del backend refactorizados con validacion de comportamiento identico antes/despues |
| **Tests** | Vitest (34 tests unitarios frontend), suite de integracion en backend (golden tests contra Docker con datos `__TEST__` auto-limpiantes, incluyendo tests de concurrencia) |
| **Code Review con metricas** | Conteo de tokens (hooks, classNames, onClick) para verificar que las extracciones son puras |

### 4.3 API Design

**Paginacion server-side retrocompatible** — aplicada a 9 recursos:

```
GET /api/facturas              → [...] (array completo, retrocompatible)
GET /api/facturas?page=1&limit=20&estado=Pendiente&q=busqueda
                               → { data: [...], meta: {total, page, limit, pages}, stats: {...} }
```

- `stats` son KPIs globales (no afectados por filtros) para las FlowCards.
- `meta.total` es el total filtrado para el paginador.
- `limit` capado a 200 por seguridad.

**Shape de respuesta uniforme:**

```json
// Exito
{ "ok": true, "data": [...] }

// Error
{ "ok": false, "msg": "No autorizado" }

// Validacion (422)
{ "ok": false, "msg": "Datos invalidos", "errors": { "email": "Email requerido" } }
```

### 4.4 DevOps

| Practica | Detalle |
|---|---|
| **Docker Compose** | Stack completo con un solo comando. Health checks en MySQL |
| **Health Check inteligente** | `/api/health` retorna HTTP 503 si la BD esta caida (liveness/readiness probes) |
| **Graceful Shutdown** | `enableShutdownHooks()` cierra pool de conexiones ante SIGTERM |
| **Scheduled Tasks** | `@nestjs/schedule` con cron para snapshots mensuales de costos |
| **Backups** | Dumps SQL completos (58 tablas + routines + triggers + events) |

### 4.5 Frontend Especificas

| Practica | Detalle |
|---|---|
| **Design System propio** | Tipografia Outfit, escala compacta para densidad ERP, tokens de color con dark mode completo |
| **Code Splitting** | 18 paginas lazy-loaded. Bundle principal reducido 76% (1.77 MB → 424 KB) |
| **Virtualizacion** | `react-window` v2 para tablas con >200 filas |
| **PDF Generation** | 4 formatos (Carta, Tiquete, Factus-style, Comprobante) con `@react-pdf/renderer` y jsPDF |
| **Accesibilidad** | Focus-trap en modales/drawers, aria-labels, navegacion por teclado, touch targets 44px |
| **Dark Mode** | Foundation completa con tokens CSS, anti-flash script inline, 3 modos (light/dark/system) |
| **Bulk Actions** | Seleccion multiple + accion masiva en Facturas, Cotizaciones y OCs |

### 4.6 Integraciones Externas

| Integracion | Tecnologia | Patron |
|---|---|---|
| **Facturacion electronica DIAN** | Factus API (OAuth2 password grant) | Modulo aislado, admin-only, cache de token en memoria con refresh automatico |
| **Impresion termica** | ESC/POS via `node-thermal-printer` (TCP :9100) | Tirilla propia (Factus no ofrece formato POS) |
| **Clasificador quimico IA** | OpenRouter API (formato OpenAI) | Fallback multi-proveedor: OpenRouter → Gemini → Anthropic |
| **Bot WhatsApp** | API key dedicada (para n8n) | Endpoint publico con `ApiKeyGuard`, sin JWT |

---

## 5. Decisiones Arquitectonicas Clave

### Por que Modular Monolitica y no Microservicios

- Es un ERP interno de una sola empresa, no un SaaS multi-tenant.
- Los 40 modulos comparten la misma base de datos MySQL.
- La complejidad operacional de microservicios (service mesh, event bus, distributed transactions) no se justifica para el volumen actual.
- La estructura modular permite extraer cualquier modulo a un microservicio si la escala lo requiere.

### Por que SQL Crudo en vez de ORM completo

- La base de datos ya existia (migrada desde CodeIgniter 4) con 58 tablas en produccion.
- `synchronize: false` es innegociable — TypeORM con `synchronize: true` alteraria/borraria columnas reales.
- Las queries de negocio (JOINs complejos, agregaciones, CASE expressions) son mas claras y auditables en SQL que en QueryBuilder.
- Los placeholders `?` de `mysql2` garantizan seguridad contra inyeccion.

### Por que React y no Angular/Vue

- Ecosistema mas grande para componentes de UI.
- React Query (TanStack Query) para server state, Zustand para client state — separacion clara.
- Vite para build rapido (~9s).
- `@react-pdf/renderer` para generacion de PDFs con componentes React (mismo mental model).

### Por que Docker Compose sin Kubernetes

- Deploy single-server (VPS).
- Un solo `docker compose up -d` levanta todo.
- Health checks + restart policies cubren la disponibilidad necesaria.

---

## 6. Respuestas para Entrevista

### "Que arquitectura usaste?"

> Usamos una arquitectura modular monolitica con NestJS en el backend y React SPA en el frontend, containerizada con Docker Compose. El backend tiene 40 modulos independientes organizados por dominio de negocio, cada uno con su controller, service y DTOs. Se migro desde CodeIgniter 4 usando el patron Strangler Fig, modulo por modulo, compartiendo la misma base MySQL hasta completar la migracion al 100%.

### "Que patrones de diseno aplicaste?"

> En el backend: Dependency Injection (core de NestJS), Strategy (autenticacion JWT via Passport), Chain of Responsibility (3 guards globales encadenados: auth → readonly → roles), Decorator (custom decorators para metadata), Filter (exception filter global para shape uniforme de respuesta), DTO con validation pipeline, y Transaction Pattern con pessimistic locking para operaciones de dinero/stock. En el frontend: Component Composition, Custom Hooks, Query Key Factory, Optimistic Updates con rollback, Design Token System, Code Splitting, y Adapter Pattern para la paginacion.

### "Como manejaste la seguridad?"

> RBAC con 4 niveles (superadmin/admin/operador/visor) a traves de 3 guards globales. JWT con token_version en BD para invalidacion instantanea de sesiones, refresh token rotativo, Helmet para headers HTTP, CORS restrictivo obligatorio en produccion, proteccion contra mass-assignment con whitelist en DTOs, zero SQL injection verificado (todo con placeholders, nunca interpolacion), y validacion de variables de entorno con Joi al arrancar.

### "Como manejaste la escalabilidad?"

> Paginacion server-side retrocompatible en 9 tablas. Pool de conexiones MySQL con limites y timeouts. Queries N+1 eliminadas con batch queries usando IN(...). Dashboard con 13 agregaciones en paralelo (Promise.all). Code-splitting agresivo en frontend (bundle reducido 76%). Virtualizacion con react-window para tablas grandes. Indices SQL documentados para las queries mas pesadas.

### "Como fue el proceso de migracion de CodeIgniter a NestJS?"

> Usamos el patron Strangler Fig: ambos backends (CI4 y Nest) corrian simultaneamente contra la misma base MySQL. Nginx routeaba por URL — los endpoints ya migrados iban a Nest, el resto seguia en CI4. Migrabamos modulo por modulo (empezando por CRUDs simples, luego documentos comerciales, luego inventario/produccion), validando con tests comparativos (golden tests que golpeaban ambos backends y comparaban respuestas). Cuando el 100% de los endpoints estaba en Nest, se apago CI4 y se unifico el stack en un solo contenedor.

### "Que testing implementaste?"

> Tests unitarios con Vitest en el frontend (formatters, hooks de paginacion, componentes). Tests de integracion end-to-end en el backend contra Docker con datos reales marcados como `__TEST__` y auto-limpiantes. Tests de concurrencia reales (2 requests simultaneos convirtiendo la misma cotizacion a factura para verificar que solo una pasa). Validacion de refactors con comparacion byte-a-byte de respuestas HTTP antes/despues. TypeScript estricto (`tsc --noEmit`) y ESLint con 0 errores como gate.

### "Como manejaste el estado en el frontend?"

> Separacion clara entre server state y client state. Server state con TanStack Query (React Query) — cache automatico, invalidacion por query keys, optimistic updates con rollback. Client state con Zustand, dividido en 3 slices: auth (token + usuario, persistido), UI (drawers, modales, confirmaciones, efimero), e inventario (bodega activa, persistido). Ningun estado de servidor se duplica en Zustand — React Query es la unica fuente de verdad para datos del backend.

---

## 7. Metricas del Proyecto

| Metrica | Valor |
|---|---|
| Modulos backend | 40 |
| Modulos frontend | 24 |
| Componentes shared | ~40 |
| Archivos TypeScript (backend) | 177 |
| Archivos JSX (frontend) | 327+ |
| Tablas MySQL | 58 |
| Endpoints REST | 200+ |
| ESLint errors | 0 (ambos repos) |
| Tests | 34 (unitarios) + suite de integracion |
| Bundle principal (frontend) | 424 KB (gzip 133 KB) |
| Build time | ~9s |
| Formatos de PDF | 4 (Carta, Tiquete, Factus-style, Comprobante) |
| Duracion de la migracion CI4→NestJS | ~3 meses |
