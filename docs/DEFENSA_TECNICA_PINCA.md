# PINCA ERP — Defensa Técnica del Proyecto

**Proyecto:** Pinturas Industriales del Caribe S.A.S. — Sistema ERP  
**Autor:** Juan Herrera — Ingeniero de Software  
**Fecha:** 2026-10-15  
**Alcance:** Arquitectura, decisiones de diseño, métricas, y roadmap de maduración

---

## 1. VISIÓN GENERAL DEL SISTEMA

PINCA ERP es un sistema de gestión empresarial completo para una fábrica de pinturas industriales. Cubre el ciclo operativo de punta a punta: compras de materia prima → formulación de productos → producción con consumo FIFO de capas de inventario → costeo automático → facturación → cartera → nómina.

### 1.1 Métricas del proyecto

| Métrica | Valor |
|---------|-------|
| Líneas de código backend (TypeScript) | ~20.500 |
| Líneas de código frontend (JSX/JS) | ~52.800 |
| Total del sistema | **~73.300 líneas** |
| Módulos NestJS (backend) | 42 |
| Módulos UI (frontend) | 25 |
| Services | 45 |
| Controllers | 45 |
| DTOs con class-validator | 33 |
| Queries SQL parametrizadas | 333+ |
| Transacciones con FOR UPDATE | 35 |
| Bloques transaccionales | 54 |
| Usos de `any` en strict mode | 6 (en ~20.500 líneas) |
| Generadores de PDF | 10 documentos diferentes |
| Hooks React Query (useQuery/useMutation) | 335 |

### 1.2 Stack tecnológico completo

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| **Runtime** | Node.js (Docker) | LTS | Ecosistema JS unificado front/back, ideal para I/O |
| **Backend** | NestJS | 11.0 | Estructura modular opinada, DI nativo, guards/pipes/interceptors |
| **Acceso a datos** | TypeORM (driver) + SQL crudo | 0.3.20 | Control total sobre queries complejas de costeo |
| **Base de datos** | MySQL | 8.0 | Transacciones ACID, `FOR UPDATE` para concurrencia |
| **Autenticación** | Passport-JWT + bcryptjs | — | Estándar industrial, stateless, refresh tokens rotativos |
| **Validación** | class-validator + class-transformer | 0.14 / 0.5 | Validación declarativa por decoradores en DTOs |
| **Validación de entorno** | Joi | — | Fail-fast si falta un secreto al arrancar |
| **Security headers** | Helmet | 8.3 | OWASP headers (HSTS, X-Frame, etc.) |
| **Tareas programadas** | @nestjs/schedule (cron) | 6.1 | Snapshot mensual de costos, notificaciones lazy |
| **Frontend** | React | 19.2 | SPA moderna, hooks, composición |
| **Bundler** | Vite | 7.3 | HMR rápido, build optimizado |
| **CSS** | TailwindCSS | 4.2 | Utility-first, consistente, sin CSS custom |
| **Estado global** | Zustand | 5 | Ligero, sin boilerplate, slices composables |
| **Cache de servidor** | TanStack React Query | 5 | Cache, dedup, invalidación automática |
| **Tablas** | TanStack React Table | 8.21 | Headless, sorting/filtering/paginación server-side |
| **Formularios** | React Hook Form | 7.71 | Validación nativa, re-renders mínimos |
| **Routing** | React Router | 8.3 | Rutas declarativas, lazy loading |
| **Charts** | Recharts | 3.8 | Dashboard con KPIs y gráficas |
| **PDF** | @react-pdf/renderer + jsPDF | 4.5 / 4.2 | 10 documentos (facturas, cotizaciones, remisiones, etc.) |
| **Excel** | SheetJS (xlsx) | 0.20.3 | Exportación de reportes |
| **Deploy** | Docker Compose | — | 3 contenedores: API + MySQL + phpMyAdmin |

---

## 2. ARQUITECTURA EN PROFUNDIDAD

### 2.1 Patrón: Monolito Modular por Capas

```
                    ┌──────────────────────────────┐
                    │         CLIENTE (SPA)         │
                    │    React 19 + Zustand + RQ    │
                    └─────────────┬────────────────┘
                                  │ HTTPS + JWT Bearer
                    ┌─────────────▼────────────────┐
                    │       CAPA DE TRANSPORTE      │
                    │  NestJS: Routing, CORS, Helmet│
                    │  Global prefix: /api          │
                    └─────────────┬────────────────┘
                                  │
                    ┌─────────────▼────────────────┐
                    │     CAPA DE SEGURIDAD         │
                    │  JwtAuthGuard (global)        │
                    │  RolesGuard (@Roles)          │
                    │  VisorReadonlyGuard           │
                    │  ValidationPipe + DTOs        │
                    └─────────────┬────────────────┘
                                  │
        ┌─────────────────────────▼─────────────────────────┐
        │                CAPA DE APLICACIÓN                  │
        │                                                    │
        │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
        │  │Controller │ │Controller │ │Controller │  × 45   │
        │  │ (HTTP)    │ │ (HTTP)    │ │ (HTTP)    │         │
        │  └─────┬────┘ └─────┬────┘ └─────┬────┘          │
        │        │            │            │                 │
        │  ┌─────▼────┐ ┌─────▼────┐ ┌─────▼────┐          │
        │  │ Service   │ │ Service  │ │ Service  │  × 45    │
        │  │ (Negocio) │ │(Negocio) │ │(Negocio) │          │
        │  └─────┬────┘ └─────┬────┘ └─────┬────┘          │
        │        │            │            │                 │
        └────────┼────────────┼────────────┼─────────────────┘
                 │            │            │
        ┌────────▼────────────▼────────────▼─────────────────┐
        │              CAPA DE DATOS                          │
        │  TypeORM DataSource → SQL parametrizado (?)         │
        │  dataSource.query('SELECT ... WHERE id = ?', [id])  │
        │  dataSource.transaction(async (m) => { ... })       │
        └────────────────────┬───────────────────────────────┘
                             │ TCP 3306 (red Docker interna)
        ┌────────────────────▼───────────────────────────────┐
        │              MySQL 8.0 (Docker)                     │
        │  58 tablas · Volumen persistente                    │
        │  Transacciones InnoDB + row-level locking           │
        └─────────────────────────────────────────────────────┘
```

### 2.2 Por qué monolito modular y no microservicios

| Factor | Monolito modular | Microservicios |
|--------|------------------|----------------|
| Equipo | 1 persona — sin overhead de coordinación | Requiere equipos por servicio |
| Dominio | Un solo negocio (ERP) con módulos acoplados | Útil cuando los dominios son independientes |
| Transacciones | Una BD → ACID nativo con `BEGIN/COMMIT` | Requiere sagas o 2PC entre servicios |
| Latencia | Llamadas en proceso (nanosegundos) | Llamadas HTTP/gRPC entre servicios (milisegundos) |
| Deploy | Un contenedor + BD | Orquestación (K8s), service mesh, load balancers |
| Complejidad operacional | Docker Compose | Kubernetes + CI/CD por servicio |

**Decisión:** A esta escala (1 desarrollador, 1 cliente, 1 BD), los microservicios agregarían complejidad operacional sin beneficio real. El monolito modular da la organización de microservicios (cada módulo es independiente) sin el costo de la infraestructura distribuida.

**Escalabilidad futura:** Si el sistema crece, los módulos ya están desacoplados — cada uno tiene su propio controller, service y DTOs. Extraer uno a microservicio es factible sin reescribir, solo cambiando la comunicación de llamada directa a HTTP/gRPC.

### 2.3 Por qué SQL crudo y no ORM completo

TypeORM está instalado pero se usa solo como **driver de conexión** y **gestor de transacciones**. Todas las queries de negocio son SQL crudo parametrizado.

**Razones:**

1. **Queries de costeo/inventario complejas** — JOINs con subqueries, `GROUP BY` con `HAVING`, `COALESCE` anidados, `CASE WHEN` en `SELECT`. Un ORM genera SQL subóptimo o directamente no puede expresar estas queries.

2. **Predictibilidad** — Cuando la query toca dinero (facturas, pagos, capas FIFO), necesito saber exactamente qué SQL se ejecuta. Un ORM abstrae eso y puede cambiar el SQL generado entre versiones.

3. **`FOR UPDATE` explícito** — El locking pesimista es crítico para evitar race conditions en stock y folios. Con ORM necesitaría `QueryBuilder` o raw queries de todas formas.

4. **Performance** — `dataSource.query()` va directo al driver `mysql2`. Sin overhead de hidratación de entidades, change detection ni identity maps.

**Trade-off aceptado:** Más código manual (333+ queries escritas a mano) y mayor riesgo de errores de tipeo en SQL. Se mitiga con TypeScript strict (el compilador atrapa errores en el código alrededor de las queries) y con la disciplina de siempre usar placeholders `?`.

### 2.4 Dominios de negocio (42 módulos)

```
COMPRAS                          PRODUCCIÓN                    VENTAS
───────                          ──────────                    ──────
proveedores                      formulaciones                 clientes
item-proveedor                   formulaciones-costos          cotizaciones
ordenes-compra                   preparaciones                 remisiones
requisiciones (MRP)              costos-produccion             facturas
                                 costos (indirectos)           notas-credito
                                                               facturacion-electronica

INVENTARIO                       FINANZAS                      TRANSVERSAL
──────────                       ────────                      ──────────
item (maestro)                   cartera (CxC + CxP)           auth (JWT + refresh)
inventario (stock)               pagos-cliente                 usuarios
bodega-inventario                nomina                        permisos
bodegas                          empresa                       configuracion
categorias                                                     notificaciones
unidades                                                       dashboard
catalogo                                                       search
                                                               sincronizacion (IA)
                                                               trazabilidad
                                                               auditoria
                                                               salud-sistema
                                                               numeracion
                                                               comparador
                                                               asistente (WhatsApp)
                                                               instalaciones
                                                               gestiones-cobro
```

---

## 3. PATRONES DE DISEÑO IMPLEMENTADOS

### 3.1 Seguridad por capas (Defense in Depth)

```
Request HTTP
  │
  ├─ 1. Helmet → Security headers (HSTS, X-Frame-Options, etc.)
  │
  ├─ 2. CORS → Solo acepta requests del frontend autorizado
  │
  ├─ 3. JwtAuthGuard (GLOBAL) → Valida firma HS256 + expiración + token_version
  │     └─ token_version: si el usuario cambia su contraseña, todos los JWT
  │        existentes se invalidan instantáneamente (incremento en BD)
  │
  ├─ 4. RolesGuard → @Roles('admin') restringe endpoints por rol
  │
  ├─ 5. VisorReadonlyGuard → Rol 'visor' = solo GET, bloquea toda mutación
  │
  ├─ 6. ValidationPipe + DTO → Valida y filtra campos del body
  │     └─ whitelist: true → descarta propiedades no declaradas (mass-assignment)
  │     └─ transform: true → convierte strings a números según decoradores
  │
  ├─ 7. SQL parametrizado → Placeholders ? en todas las 333+ queries
  │     └─ Cero SQL injection (auditado: 0 interpolaciones de strings en valores)
  │
  └─ 8. FOR UPDATE → Locking pesimista en operaciones de dinero/stock
```

### 3.2 Autenticación: JWT con refresh tokens rotativos

```
                  Login (email + password)
                         │
                    bcrypt.compare()
                         │
              ┌──────────▼──────────┐
              │  Access Token (1h)  │  ← firmado con HS256 + TOKEN_SECRET
              │  Refresh Token (7d) │  ← hash SHA-256 guardado en BD
              └──────────┬──────────┘
                         │
              El access token lleva:
              { id, username, nombre, rol, modulos, token_version }
                         │
              Cuando expira el access token:
              POST /auth/refresh { refresh_token }
                         │
              ┌──────────▼──────────┐
              │  Busca hash en BD   │
              │  Verifica:          │
              │  - no revocado      │
              │  - no expirado      │
              │  - token_version    │
              │    del payload      │
              │    == el de BD      │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  Revoca el refresh  │  ← rotación: cada uso genera
              │  anterior           │     uno nuevo (protege contra
              │  Emite nuevo par    │     robo de refresh token)
              └─────────────────────┘

    Cambio de contraseña → token_version++ → TODOS los JWT
    existentes fallan la validación en el guard → logout forzado
```

### 3.3 Integridad transaccional: patrón de concurrencia

Ejemplo real del sistema — registro de pago a proveedor:

```typescript
// 1. Abre transacción
return this.dataSource.transaction(async (manager) => {

  // 2. Lock pesimista: bloquea la fila de la OC para este thread
  const [oc] = await manager.query(
    `SELECT id_orden, total, estado FROM ordenes_compra
     WHERE id_orden = ? AND deleted_at IS NULL
     FOR UPDATE`,    // ← ningún otro thread puede leer/escribir esta fila
    [dto.orden_id],
  );

  // 3. Validaciones de negocio (con datos congelados por el lock)
  if (oc.estado === 'Pagada') throw new BadRequestException('...');

  // 4. Lee saldo actual (dentro del mismo lock)
  const [{ pagado }] = await manager.query(
    `SELECT COALESCE(SUM(monto), 0) AS pagado
     FROM pagos_proveedor WHERE orden_id = ?`,
    [dto.orden_id],
  );

  // 5. Inserta el pago
  await manager.query(`INSERT INTO pagos_proveedor ...`);

  // 6. Si saldo llega a 0, cambia estado
  if (nuevoSaldo <= 0.01) {
    await manager.query(
      `UPDATE ordenes_compra SET estado = 'Pagada' WHERE id_orden = ?`,
      [dto.orden_id],
    );
  }
  // 7. COMMIT implícito al salir sin error
});
```

Este patrón se usa en **35 puntos del sistema**: facturación, pagos, producción (consumo FIFO de capas), recepción de OC con prorrateo, conversión cotización→factura, ajustes de inventario, numeración de folios.

### 3.4 Patrón de respuesta uniforme

```
ÉXITO:     { ok: true, ...data }      ← vía HttpExceptionFilter (no intercepta éxitos)
ERROR:     { ok: false, msg: "..." }   ← vía HttpExceptionFilter
VALIDACIÓN: { ok: false, msg: "Datos inválidos", errors: { campo: "mensaje" } }
```

El frontend confía en `ok: true/false` para distinguir éxito de error, y en `errors` para pintar errores por campo en los formularios (React Hook Form).

### 3.5 Estado del frontend: separación de responsabilidades

```
┌──────────────────┐  Estado de servidor (async, cacheable)
│  TanStack Query   │  → 335 hooks useQuery/useMutation
│  (React Query)    │  → Cache automático, dedup, invalidación
│                   │  → Stale-while-revalidate
└──────────────────┘

┌──────────────────┐  Estado global de UI (sync, local)
│  Zustand          │  → Auth (token, usuario logueado)
│  (3 slices)       │  → Inventario (bodega seleccionada)
│                   │  → UI (sidebar, modales)
└──────────────────┘

┌──────────────────┐  Estado de formulario (efímero)
│  React Hook Form  │  → Validación, dirty tracking
│                   │  → No re-renderiza en cada keystroke
└──────────────────┘
```

---

## 4. DECISIONES DE DISEÑO Y JUSTIFICACIÓN

### 4.1 Tabla de decisiones para entrevista

| Decisión | Alternativas evaluadas | Por qué esta | Trade-off |
|----------|----------------------|--------------|-----------|
| SQL crudo | TypeORM entities/QueryBuilder | Control total de queries de costeo y locking | Más código manual, sin migraciones automáticas |
| Monolito modular | Microservicios, serverless | 1 dev, 1 BD, transacciones ACID nativas | Si escala a 5+ devs, extraer módulos |
| JWT stateless | Sesiones en BD, OAuth2 | Sin estado en servidor, escalable horizontalmente | Revocación requiere token_version en BD |
| Zustand + React Query | Redux, MobX, SWR | Zustand es mínimo (no boilerplate), RQ resuelve cache de API | Dos librerías de estado, pero con responsabilidades claras |
| Tailwind | CSS Modules, Styled Components | Utility-first, consistente, sin context switching | HTML más largo, curva de aprendizaje |
| Docker Compose | Bare metal, K8s, PaaS | Stack reproducible en cualquier máquina | Sin orquestación avanzada (scaling, rolling deploys) |
| class-validator en DTOs | Joi en controllers, Zod | Decoradores nativos de NestJS, ValidationPipe global | Validación duplicada con la del service (se irá eliminando) |
| React PDF (@react-pdf/renderer) | Puppeteer, wkhtmltopdf | Componentes React, sin dependencia de browser headless | Limitaciones de layout vs HTML/CSS real |
| SheetJS | ExcelJS | CDN propio (no npm post-disputa), API conocida | Sin streaming para archivos muy grandes |

### 4.2 Migración CI4 → NestJS: patrón Strangler Fig

El sistema original estaba en CodeIgniter 4 (PHP). La migración se hizo con el patrón **Strangler Fig**:

1. Se levantó NestJS en paralelo en el mismo Docker Compose
2. Se migraron endpoints uno por uno, comparando respuestas con **golden tests** (35 scripts que llamaban al mismo endpoint en CI4 y NestJS y verificaban que la respuesta fuera idéntica)
3. El proxy/nginx redirigía cada ruta migrada a NestJS
4. Cuando el 100% de endpoints estuvieron en NestJS, se apagó CI4

**Resultado:** Migración completa sin downtime, sin big bang, con validación automática de paridad.

---

## 5. FASES DEL CICLO DE SOFTWARE — ESTADO ACTUAL

### 5.1 Mapa de madurez

```
                        IMPLEMENTADO    PARCIAL    NO EXISTE
                        ───────────     ───────    ─────────
Requisitos              │               │██████│   │         │
Diseño/Arquitectura     │███████████│   │      │   │         │
Desarrollo              │███████████│   │      │   │         │
Validación de entrada   │███████████│   │      │   │         │
Seguridad de código     │███████████│   │      │   │         │
Testing                 │               │      │   │█████████│
CI/CD                   │               │      │   │█████████│
Staging                 │               │      │   │█████████│
Deploy automatizado     │               │██████│   │         │
Monitoreo               │               │      │   │█████████│
Backup / DR             │               │██████│   │         │
Documentación técnica   │███████████│   │      │   │         │
Documentación usuario   │               │      │   │█████████│
Mantenimiento           │               │      │   │█████████│
```

### 5.2 Detalle de cada fase faltante

#### FASE: Testing (Prioridad 1 — CRÍTICA)

**Estado actual:** 0 tests de regresión automatizados. Los 35 golden tests eran de migración CI4→NestJS y ya no aplican.

**Qué se necesita:**

| Tipo de test | Qué cubre | Herramienta | Ejemplos concretos |
|---|---|---|---|
| **Unit tests** | Lógica de negocio pura (cálculos) | Jest | `calcularFactorVolumen()`, `calcularCobertura()`, prorrateo de OC, aging de cartera |
| **Integration tests** | Flujos transaccionales completos | Jest + Supertest + BD de test | Crear factura → pagar → verificar saldo. Producción → consumo FIFO → verificar capas. Recepción OC prorrateada → verificar inventario. |
| **Smoke tests de endpoints** | Que todos los endpoints respondan | Supertest | GET /api/health, GET /api/item_general, POST /api/auth/login |
| **Tests de validación** | Que los DTOs rechacen basura | Jest + Supertest | POST /api/item_general con body vacío → 422. POST con campos extra → ignorados (whitelist). |
| **Tests del frontend** | Flujos de UI críticos | Vitest + Testing Library | Login → redirección. Formulario de factura → validación. |

**Meta mínima pre-producción:** Smoke tests de los 10 endpoints más críticos + unit tests de las 5 funciones de cálculo de costos/inventario.

#### FASE: CI/CD (Prioridad 2 — ALTA)

**Estado actual:** Cero. Deploy manual: `docker compose build api && docker compose up -d`.

**Pipeline propuesto (GitHub Actions):**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint          # ESLint
      - run: npm run typecheck     # tsc --noEmit
      - run: npm test              # Jest (cuando existan)
      - run: npm run build         # Verifica que el build no falle
```

**Evolución:**
1. **Fase 1:** lint + typecheck + build (se puede hacer hoy)
2. **Fase 2:** + tests unitarios (cuando los escribamos)
3. **Fase 3:** + tests de integración con BD de test en Docker
4. **Fase 4:** + deploy automático a staging (CD)

#### FASE: Staging (Prioridad 3 — ALTA para producción)

**Estado actual:** Solo existe el entorno de desarrollo local.

**Lo que se necesita:**

```
DEV (local)          →    STAGING              →    PRODUCCIÓN
─────────────              ──────────                ──────────
docker compose up          BD separada              BD real
Datos de prueba            Copia de prod (anon.)     Datos reales
Sin HTTPS                  HTTPS + dominio test      HTTPS + dominio final
```

Staging replica producción pero con datos anonimizados. Permite:
- Probar migraciones de BD antes de aplicarlas en producción
- Que el cliente valide funcionalidades nuevas sin riesgo
- Probar el backup/restore real

#### FASE: Monitoreo y Observabilidad (Prioridad 4)

**Estado actual:** Cero. Si el sistema cae a las 2 AM, nadie se entera hasta que el cliente llama.

**Mínimo viable:**

| Necesidad | Herramienta sugerida | Costo |
|-----------|---------------------|-------|
| Errores 500 en tiempo real | Sentry (free tier: 5K eventos/mes) | $0 |
| Logs estructurados | Winston + archivo rotado | $0 |
| Uptime monitoring | UptimeRobot o Better Uptime (free tier) | $0 |
| Alerta de backup fallido | Webhook a n8n (ya diseñado en backup.sh) | $0 |
| Métricas de BD | Slow query log + monitoreo de conexiones | $0 |

**Avanzado (cuando haya presupuesto):**
- APM (Application Performance Monitoring): Datadog, New Relic
- Métricas de negocio: dashboard de facturas/día, tiempo de respuesta P95
- Alertas de stock crítico (ya existen como notificaciones internas, falta hacerlas externas)

#### FASE: Documentación de usuario (Prioridad 5)

**Estado actual:** Cero documentación para el usuario final.

**Lo que se necesita:**
- Manual de operación: cómo crear una factura, registrar un pago, hacer una producción
- Guía de administración: roles y permisos, configuración del sistema
- FAQ de errores comunes
- Video/capturas del flujo de trabajo principal

#### FASE: Mantenimiento y operaciones (Prioridad 6)

**Estado actual:** Sin procesos formalizados.

| Proceso | Qué es | Frecuencia |
|---------|--------|-----------|
| Actualización de dependencias | `npm audit` + actualizar paquetes con CVEs | Mensual |
| Revisión de logs | Buscar errores recurrentes, queries lentas | Semanal |
| Prueba de restauración | Restaurar el backup más reciente en BD de test | Mensual |
| Rotación de secretos | Cambiar TOKEN_SECRET, API keys | Trimestral o ante incidente |
| Revisión de accesos | Quién tiene SSH, quién tiene acceso a BD | Trimestral |

---

## 6. ROADMAP DE MADURACIÓN

### Fase inmediata (pre-producción)

- [x] Dumps SQL sacados de git (H01)
- [x] Scripts de backup automático (H26)
- [x] DTOs con validación en todos los endpoints
- [ ] Tests smoke de endpoints críticos
- [ ] CI básico (lint + typecheck + build)
- [ ] HTTPS con Let's Encrypt
- [ ] phpMyAdmin restringido por IP o eliminado
- [ ] CORS apuntando al dominio real

### Fase post-lanzamiento (mes 1-2)

- [ ] Sentry para captura de errores
- [ ] Uptime monitoring
- [ ] Tests de integración de flujos de dinero
- [ ] Staging con BD anonimizada
- [ ] Manual de usuario básico

### Fase de estabilización (mes 3-6)

- [ ] Pipeline CD completo (push → staging → producción)
- [ ] Migraciones de BD versionadas (TypeORM migrations o Flyway)
- [ ] Logging estructurado con Winston
- [ ] Dashboard de métricas de negocio
- [ ] Política de mantenimiento mensual

---

## 7. GUÍA DE DEFENSA EN ENTREVISTA

### 7.1 Elevator pitch (30 segundos)

> "Diseñé y construí un ERP completo para una fábrica de pinturas industriales — 73.000 líneas de código, 42 módulos, cubre desde compras hasta facturación electrónica DIAN. Lo migré de PHP/CodeIgniter a TypeScript/NestJS usando el patrón Strangler Fig sin downtime. El sistema maneja concurrencia real con transacciones y locking pesimista en todo camino de dinero e inventario, y tiene cero SQL injection en más de 300 queries auditadas."

### 7.2 Preguntas técnicas probables y respuestas

**P: ¿Cómo manejas la concurrencia?**
> Transacciones MySQL con `FOR UPDATE` en cada operación que toca dinero o stock. Ejemplo: cuando dos personas intentan pagar la misma factura al mismo tiempo, el `FOR UPDATE` serializa los accesos — el segundo request ve el saldo ya actualizado por el primero y no puede hacer un doble pago. Tengo 35 puntos del código con este patrón.

**P: ¿Cómo aseguras que no haya SQL injection?**
> Todas las queries usan placeholders `?` de mysql2 — el driver escapa los valores antes de enviarlos a MySQL. Nunca hay interpolación de strings en valores. Esto fue auditado en las 333+ queries del sistema. El ValidationPipe con `whitelist: true` además descarta propiedades no declaradas en el DTO, así que un atacante no puede inyectar campos extra.

**P: ¿Por qué no usaste un ORM?**
> Lo intenté al inicio, pero las queries de costeo de producción (JOINs con subqueries agregadas, CASE WHEN, COALESCE anidados) generaban SQL subóptimo o requerían QueryBuilder — que al final es SQL con más pasos. Decidí usar TypeORM solo como driver y gestor de transacciones, y escribir SQL crudo parametrizado. El trade-off es más código manual, pero las queries son predecibles y auditables.

**P: ¿Cómo funciona tu sistema de inventario?**
> Es un sistema FIFO por capas. Cada recepción de materia prima crea una "capa" con su cantidad y costo real (puede incluir prorrateo de flete). Cuando producción consume materia prima, se descuentan capas en orden cronológico (First In, First Out). Esto da el costo real de producción, no un promedio — es más preciso para la contabilidad de costos de una fábrica.

**P: ¿Cómo hiciste la migración de PHP a NestJS?**
> Patrón Strangler Fig. Levanté NestJS en paralelo, migré endpoint por endpoint con golden tests (scripts que llamaban al mismo endpoint en ambos sistemas y comparaban respuestas byte a byte). Cuando los 35 golden tests pasaban, redirigía la ruta a NestJS. Así nunca hubo un "big bang" riesgoso — cada endpoint se migró y validó individualmente.

**P: ¿Qué le falta al proyecto?**
> Testing automatizado es la brecha más grande — tengo la infraestructura (Jest, Vitest, ValidationPipe) pero no los tests escritos. También falta CI/CD y un ambiente de staging. Tengo un roadmap de maduración priorizado: tests primero, luego CI, luego monitoreo. Los scripts de backup automático y la validación de DTOs los acabo de completar.

**P: ¿Qué harías diferente si empezaras de cero?**
> Tres cosas: (1) Escribir tests desde el día 1, al menos para flujos de dinero — es más fácil escribirlos mientras construyes que después. (2) Usar migraciones versionadas desde el inicio en vez de scripts SQL sueltos. (3) Configurar CI/CD antes del primer deploy, no después.

### 7.3 Fortalezas para resaltar proactivamente

1. **"Migré un sistema completo de PHP a TypeScript sin downtime"** — demuestra capacidad de manejar complejidad incremental.

2. **"6 usos de `any` en 20.500 líneas de TypeScript strict"** — demuestra disciplina con el sistema de tipos.

3. **"Audité mi propio código y documenté 37 hallazgos"** — demuestra madurez profesional (saber que tu código tiene deudas y planear cómo resolverlas).

4. **"El sistema genera 10 tipos de documentos PDF diferentes"** — demuestra que resuelve problemas reales de negocio, no solo CRUD.

5. **"Implementé costeo de producción real con capas FIFO"** — demuestra capacidad de modelar lógica de negocio compleja, no solo pasar datos.
