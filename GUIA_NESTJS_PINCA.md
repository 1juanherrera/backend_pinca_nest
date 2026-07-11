# Guía de migración y mejores prácticas — NestJS para PINCA

> **Propósito**: documento de referencia para migrar el backend de PINCA de **CodeIgniter 4 (PHP)** a **NestJS 11 (TypeScript)** siguiendo las mejores prácticas del framework, sin romper el sistema en producción. Está escrito para que cualquier desarrollador (o Claude en una sesión futura) tome decisiones consistentes.
>
> **Estrategia**: migración incremental tipo *Strangler Fig*. NestJS y CI4 conviven detrás del mismo proxy, apuntando a **la misma base MySQL**, y se migran módulos uno a uno. **Nunca hay un "día del cambio".**
>
> **Regla de oro**: el frontend (React 19 + Axios) **no debe notar** de qué backend viene cada respuesta. Los *shapes* de JSON y el contrato JWT son sagrados durante la coexistencia.

---

## 0. Contexto del sistema actual (lo que estamos migrando)

| Dato | Valor |
|---|---|
| Framework origen | CodeIgniter 4, PHP 8.1 |
| Tamaño | ~29K líneas, 41 controllers, 32 models, 223 rutas, 48 migraciones |
| Base de datos | MySQL 8.0 (`gestorpincadb`), Docker |
| Auth | JWT HS256 + `token_version` + refresh tokens rotativos + RBAC por módulo |
| Frontend | React 19 + Vite + Zustand + Axios (JavaScript, no TS) |
| Dominio | ERP de manufactura de pinturas: inventario por capas de costo (FIFO), formulaciones químicas, órdenes de compra, facturación, cartera, producción |

**Lo más delicado de migrar (dejar para el final, con red de tests):**
- `FormulacionesModel` (~1.972 líneas) — costeo de recetas, opciones por proveedor.
- `InventarioCapasModel` — capas de costo FIFO, promedio ponderado móvil, costo congelado.
- `SincronizacionModel` (~1.452 líneas) — auditoría catálogo↔proveedores, merge, dedup IA.
- Todo lo que use `transBegin/transCommit/transRollback` y `SELECT ... FOR UPDATE`.

---

## 1. Mapeo mental CI4 → NestJS

Tu código ya está estructurado de forma casi idéntica a NestJS. Esta tabla es el diccionario de traducción:

| CodeIgniter 4 | NestJS | Notas |
|---|---|---|
| `Controllers/XController.php` | `x.controller.ts` | Decoradores `@Controller('x')`, `@Get()`, `@Post()` |
| `Models/XModel.php` (ActiveRecord) | `x.service.ts` + `x.entity.ts` (TypeORM) | La lógica de negocio va al **service**, no al controller |
| `Config/Routes.php` | Decoradores de ruta en cada controller | NestJS no tiene archivo central de rutas |
| `Filters/JwtFilter.php` | `JwtAuthGuard` (global) | Guard + `JwtStrategy` de passport |
| `Filters/RbacFilter.php` (visor read-only) | `VisorReadOnlyGuard` (global) | Mismo comportamiento |
| `Filters/CorsFilter.php` | `app.enableCors()` en `main.ts` | Nativo |
| `Traits/JwtUserAware.php` | Decorador `@CurrentUser()` | Extrae `request.user` |
| `Traits/ApiResponse.php` (`{ok,msg}`) | `ResponseInterceptor` + `HttpExceptionFilter` | Centraliza el shape |
| `Traits/ValidatesJson.php` (`$this->validate`) | DTOs + `class-validator` + `ValidationPipe` | Validación declarativa por tipos |
| `Config/Database.php` + `.env` | `TypeOrmModule.forRootAsync` + `@nestjs/config` | |
| `Helpers/Cfg.php` (config desde BD) | `ConfiguracionService` (lee `configuracion_sistema`) | Cachear per-request/con TTL |
| `spark migrate` | `typeorm migration:run` | **Ver §4 — no usar synchronize** |
| `spark <comando>` | `nestjs-command` o script standalone | Para `snapshot:costos`, `notificaciones:procesar` |
| `transBegin/Commit/Rollback` | `QueryRunner` o `dataSource.transaction()` | **Ver §7 — crítico** |

**Principio clave que cambia respecto a CI4**: en NestJS la **lógica de negocio vive en `Services` (providers), no en los controllers**. El controller solo: (1) recibe el request, (2) valida vía DTO, (3) llama al service, (4) devuelve. Tus `Models` de CI4 mezclan acceso a datos + lógica; al migrar, **separá**: acceso a datos → repositorios TypeORM; lógica → services.

---

## 2. Estructura de proyecto recomendada (feature modules)

NestJS escala organizando por **módulos de dominio**, no por capa técnica. Un módulo agrupa controller + service + entities + DTOs de un dominio.

```
pinca_backend_nest/
├── src/
│   ├── main.ts                      # bootstrap: CORS, ValidationPipe global, filtros/interceptors globales
│   ├── app.module.ts                # módulo raíz: importa config, DB y todos los feature modules
│   │
│   ├── config/
│   │   └── configuration.ts         # carga y tipa las env vars
│   │
│   ├── database/
│   │   └── database.module.ts       # TypeOrmModule.forRootAsync (synchronize: FALSE)
│   │
│   ├── common/                      # transversal, sin dominio
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts       # @Public() → salta el JwtAuthGuard
│   │   │   ├── roles.decorator.ts        # @Roles('admin','superadmin')
│   │   │   └── current-user.decorator.ts # @CurrentUser() → request.user
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts          # valida el Bearer (global)
│   │   │   ├── roles.guard.ts             # exige rol para el handler
│   │   │   └── visor-readonly.guard.ts    # visor = solo lectura (global)
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts    # envuelve el éxito en {ok, msg, ...}
│   │   └── filters/
│   │       └── http-exception.filter.ts   # errores → {ok:false, msg}
│   │
│   └── modules/
│       ├── auth/                    # login, refresh, guards, strategy
│       ├── usuarios/
│       ├── unidades/               # ← módulo plantilla (primer candidato a migrar)
│       ├── categorias/
│       ├── bodegas/
│       ├── proveedores/
│       ├── clientes/
│       ├── catalogo/
│       ├── inventario-capas/       # ← delicado
│       ├── formulaciones/          # ← delicado
│       └── ...
│
├── test/
├── .env / .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

**Reglas de módulos:**
- Un módulo por dominio. Exporta sus services solo si otro módulo los necesita (`exports: [XService]`).
- Nada de "utils global gigante". Lo transversal va en `common/`.
- Un módulo **no importa** el controller de otro; importa su **module** para reusar el **service**.

---

## 3. TypeScript y convenciones de código

- **`strict: true` en `tsconfig`** siempre. Es la razón #1 por la que migrás (atrapar errores en compilación).
- Prohibido `any` salvo casos justificados con comentario. Preferí `unknown` + narrowing.
- **DTOs con `class-validator`** para toda entrada. Nada de leer `request.body` a mano.
- Nombres de archivo: `kebab-case.tipo.ts` (`unidades.service.ts`, `usuario.entity.ts`).
- Clases: `PascalCase`. Métodos/variables: `camelCase`.
- **Async/await** en todo acceso a BD. Nada de callbacks.
- Un service = una responsabilidad. Si un método pasa de ~60 líneas, partilo (tus métodos CI4 de 200 líneas son la deuda que estamos pagando).
- `readonly` en las dependencias inyectadas: `constructor(private readonly repo: Repository<Unidad>) {}`.

---

## 4. Base de datos: TypeORM sobre el MySQL existente

Esta es la parte que **más cuidado requiere** porque la BD ya existe y está en uso.

### 4.1 Reglas absolutas
- **`synchronize: false` SIEMPRE.** `synchronize: true` deja que TypeORM altere el schema para que calce con las entidades — contra la BD real de PINCA eso **borra columnas y datos**. Jamás activarlo, ni en dev contra la BD compartida.
- **`migrations` de TypeORM** para cualquier cambio de schema, igual que hoy usás `spark migrate`. Pero durante la coexistencia, **CI4 sigue siendo el dueño del schema**. Nest solo lee/escribe; los cambios de estructura los sigue haciendo CI4 hasta que un módulo esté 100% migrado.
- Las entidades deben **calzar exactamente** con las columnas reales (nombres incluidos).

### 4.2 Convenciones del schema de PINCA (no las inventes)
- **PK**: `id_<tabla>` → `id_usuarios`, `id_item_general`, `id_facturas`, `id_orden`. Ojo: no siempre es `id_<tabla>` literal (ej. órdenes de compra usa `id_orden`). **Verificá cada tabla.**
- **FK**: `cliente_id`, `proveedor_id`, `item_general_id`, `usuario_id`.
- **Soft-delete**: columna `deleted_at` en las tablas que la tienen (clientes, proveedor, item_general, facturas, ordenes_compra, cotizaciones, remisiones, item_proveedor, categoria, unidad, bodegas, instalaciones). En TypeORM: `@DeleteDateColumn({ name: 'deleted_at' })` + usar `softDelete()`/`softRemove()`.
- Nombres de tabla inconsistentes por historia: `categoria` (singular), `unidad` (singular), `bodegas` (plural), `usuarios` (plural). **No asumas plural/singular — mirá la tabla real.**

### 4.3 Generar entidades desde la BD (recomendado, evita errores a mano)
Para una BD legacy, **no escribas las entidades a mano**. Usá `typeorm-model-generator` para volcarlas desde MySQL y luego limpialas:

```bash
npx typeorm-model-generator -h 127.0.0.1 -p 3306 -d gestorpincadb \
  -u user -x 'password' -e mysql -o src/_generated_entities
```

Revisá cada entidad generada, corregí tipos (`decimal` → `string` en TypeORM por precisión — importante para dinero/costos), y movela al módulo que corresponda. **Para dinero y cantidades usá `decimal` mapeado a `string`** y hacé la aritmética con una librería de decimales o con `BigInt`/enteros de centavos — nunca `number` float (los costos de capas no toleran errores de redondeo).

### 4.3.1 `dateStrings: true` (OBLIGATORIO — lección de Fase 2)
En la config de TypeORM (`database.module.ts`) hay que setear **`dateStrings: true`**. Sin esto, mysql2 convierte las columnas `date`/`datetime` a objetos `Date` de JS y:
- las columnas **`date` se corren un día** por timezone (ej. `2026-07-07` → `2026-07-06`),
- los `datetime`/`timestamp` se serializan como ISO `"...Z"` en vez del formato de CI4 `"YYYY-MM-DD HH:MM:SS"`.
Con `dateStrings: true` las fechas vuelven como string crudo, sin conversión — fiel a CI4.

### 4.4 Repositorios y acceso a datos
- Inyectá repos con `@InjectRepository(Unidad)`.
- Consultas simples: métodos del repo (`find`, `findOne`, `save`, `softDelete`).
- Consultas complejas (JOINs, agregados, los que hoy son SQL crudo en tus models): **`QueryBuilder`**. Es tipado y parametrizado (cierra la puerta a SQL injection que ya auditaste).
- **Evitá el N+1**: tus models CI4 ya resuelven varios listados con subqueries agrupadas (`get_opciones_proveedor_formulacion`, `sincronizacion/maestro`). Replicá esa estrategia con `leftJoinAndSelect` o subqueries, no con un query por fila.

---

## 5. Autenticación: contrato JWT EXACTO (compatibilidad con CI4)

Durante la coexistencia, **un token emitido por CI4 debe validar en Nest y viceversa**. Esto es innegociable. Detalles extraídos del código real (`UsuarioController::generarJwt` y `JwtFilter`):

### 5.1 Estructura del token
- **Algoritmo**: `HS256`.
- **Secret**: env `TOKEN_SECRET` (64 chars hex). El mismo `.env` que CI4. Si falta o es `'miClaveSuperSecreta'` → error de config (500), **nunca** validar.
- **Payload** (el usuario va **anidado bajo `data`**, no en el root):

```json
{
  "iat": 1720000000,
  "exp": 1720028800,
  "data": {
    "id": 12,
    "username": "jperez",
    "nombre": "Juan Pérez",
    "rol": "admin",
    "modulos": ["catalogo", "inventario-global", "..."],
    "token_version": 3
  }
}
```

- **Expiración**: `exp = iat + jwt_expiracion_horas * 3600`, donde `jwt_expiracion_horas` se lee de la tabla `configuracion_sistema` (default 8). Para emitir tokens idénticos, Nest debe leer esa misma config.

### 5.2 Validación (lo que hace `JwtFilter` y debe replicar `JwtStrategy`)
1. Extraer `Authorization: Bearer <token>`.
2. Verificar firma HS256 con `TOKEN_SECRET` (passport-jwt valida `exp` solo).
3. Leer `data.id` y `data.token_version`.
4. **Consultar `usuarios.token_version` (WHERE `id_usuarios` = data.id).** Si difiere → `401 'Sesión invalidada'`. Este paso es el que invalida sesiones al cambiar rol/password/logout — **no lo omitas**.
5. Adjuntar `data` a `request.user`.

En NestJS, pasos 3-5 van en `JwtStrategy.validate(payload)`. `passport-jwt` config: `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`, `secretOrKey: TOKEN_SECRET`, `algorithms: ['HS256']`. Devolvé `payload.data` (será `request.user`).

### 5.3 Mensajes de error EXACTOS (el frontend los muestra)
- Sin token: `401 {"ok": false, "msg": "Token no proporcionado"}`
- Expirado: `401 {"ok": false, "msg": "Token expirado"}`
- Inválido: `401 {"ok": false, "msg": "Token inválido"}`
- Sesión invalidada: `401 {"ok": false, "msg": "Sesión invalidada. Iniciá sesión de nuevo."}`

### 5.4 Passwords — compatibilidad bcrypt (¡trampa!)
PHP `password_hash()` genera bcrypt con prefijo **`$2y$`**. Varias librerías Node esperan `$2a$`/`$2b$`. Usá **`bcryptjs`** (soporta `$2y$`) o normalizá el prefijo (`hash.replace(/^\$2y\$/, '$2b$')`) antes de comparar. **Verificá con un hash real de la tabla `usuarios` antes de migrar el login.**

### 5.5 Refresh tokens (tabla `refresh_tokens`)
- `login` devuelve `{ok, msg, token, refresh_token, usuario}`.
- El refresh token plano es `bin2hex(random_bytes(32))` (64 hex); en BD se guarda **solo su SHA-256** (`hash('sha256', plain)`), con `expires_at` (+7 días) y `revoked=0`.
- `POST /auth/refresh {refresh_token}`: buscar por `SHA256(plain)` con `revoked=0 AND expires_at > NOW()`. Si válido: emitir JWT nuevo (token_version fresco de BD) + **rotar** (revocar el viejo, crear uno nuevo).
- `usuario_id` en `refresh_tokens` es **INT con signo** (para calzar con `id_usuarios`), OJO al mapear la entidad.

### 5.6 Estrategia de migración de auth (importante)
**En Fase 0 NO reimplementes el login.** Dejá que CI4 siga emitiendo tokens (`/api/login`, `/api/auth/refresh`). Nest solo **valida** tokens CI4-emitidos con `JwtStrategy` + guards. Así probás guards y módulos sin tocar el flujo de login. El módulo de auth se migra completo más adelante, cuando el resto esté estable.

---

## 6. Autorización (RBAC) — política por módulo + visor read-only

La política definida por el cliente (sesión 2026-05-30): **si el usuario tiene acceso al módulo, puede ejecutar las acciones del módulo.** No hay matriz rol→acción fina. Además:

- **`visor` = solo lectura global** (`RbacFilter`). En Nest: `VisorReadOnlyGuard` global que bloquea `POST/PUT/PATCH/DELETE` para `rol=visor`, con whitelist `usuarios/mi-password` y `auth/logout`. Mensaje: `403 {"ok":false,"msg":"Tu rol (visor) es de solo lectura..."}`.
- **admin-only** (config sensible): Auditoría, Configuración, Empresa, Numeración, y el **merge de Sincronización** → `@Roles('admin','superadmin')` + `RolesGuard`.
- **superadmin-only**: gestión de Roles/permisos.
- Roles: `superadmin > admin > operador > visor`. `superadmin` tiene acceso total (se trata como admin + roles).

**Orden de ejecución de guards** (Nest los corre en orden de registro): `JwtAuthGuard` (autentica) → `VisorReadOnlyGuard` (bloquea mutaciones del visor) → `RolesGuard` (exige rol del handler). Registrá los dos globales en ese orden; `RolesGuard` puede ser global también (no hace nada si el handler no tiene `@Roles`).

---

## 7. Transacciones — la parte que NO se puede equivocar

El costeo de PINCA depende de atomicidad estricta. Todo el ciclo de capas (consumir FIFO → escribir `produccion_insumos_detalle` → recalcular promedio) ocurre dentro de `transBegin/transCommit/transRollback`, y varios puntos usan `SELECT ... FOR UPDATE` para cerrar race conditions (recepción de OC concurrente, consumo de capas, cambio de estado).

En TypeORM:

```ts
// Preferido: callback transaccional (commit/rollback automáticos)
await this.dataSource.transaction(async (manager) => {
  const capa = await manager.findOne(InventarioCapa, {
    where: { id_capa: id },
    lock: { mode: 'pessimistic_write' }, // = SELECT ... FOR UPDATE
  });
  // consumir, insertar produccion_insumos_detalle, recalcular...
  // si algo lanza, TypeORM hace rollback de TODO
});
```

- `lock: { mode: 'pessimistic_write' }` ⇔ `FOR UPDATE`. Usalo en los mismos puntos donde CI4 ya lo tiene: `recibirLinea`, `consumirCapasFIFO/PorProveedor/Manual`, `cambiarEstado`, `NumeracionModel::reservar`.
- **Un solo `EntityManager` (`manager`) para toda la transacción.** No mezcles `this.repo` (fuera de la tx) con la tx.
- Nunca hagas commit parcial. Si el consumo de capas no cubre la cantidad → lanzá excepción → rollback total (igual que hoy).
- Para números de documento (`NumeracionModel::reservar`), replicá el `SELECT ... FOR UPDATE` + validación de rango DIAN dentro de la tx.

---

## 8. Compatibilidad de *shapes* de respuesta (el frontend depende de esto)

⚠️ **CORRECCIÓN IMPORTANTE (aprendida en Fase 1):** los CRUD básicos de CI4 (Unidad, Categoria, Bodegas, Instalaciones, Proveedor, Clientes) **NO envuelven** las respuestas de éxito. Usan `respond()`/`respondCreated()`/`respondDeleted()` que devuelven el payload **CRUDO**:

- **GET listado** → **array crudo** `[ {...}, {...} ]` (¡sin `{ok,msg}`!).
- **GET detalle** → **objeto crudo** `{ id_x: ..., ... }`.
- **POST create** → **201** `{ "mensaje": "X creada correctamente", "id": <n> }`.
- **PUT update** → **200** `{ "mensaje": "X con ID n actualizada correctamente", "data": <payload> }`.
- **DELETE** → **200** `{ "mensaje": "X con ID n eliminada|archivada correctamente" }`.
- **restore** → **200** `{ "mensaje": "X con ID n restaurado correctamente" }` (¡200, no 201!).
- **Error** → `{ "ok": false, "msg": "..." }` (+ `errors: {campo: msg}` en validación 422).

**Por eso NO se usa un interceptor global que envuelva las respuestas** — envolver un array en `{ok,msg,data}` rompería el frontend (esperaría un array y recibiría un objeto). Cada controller devuelve exactamente el shape crudo de CI4.

Implementación en Nest (la que quedó):
- **Sin `ResponseInterceptor`.** Los controllers `return` el dato crudo; Nest lo serializa tal cual. `@Post` da 201, `@Put`/`@Delete` dan 200 por defecto (usar `@HttpCode(200)` en `restore`).
- **`HttpExceptionFilter`** global: traduce cualquier excepción a `{ok:false, msg}` (+ `errors`). El `ValidationPipe` usa un `exceptionFactory` que arma `{msg:"Datos inválidos", errors:{campo:mensaje}}` (como `apiValidationError` de CI4).
- **Cuidado**: otros dominios SÍ usan shapes distintos (ej. `auth` login usa `{ok, msg, token, ...}` top-level; `bodega_inventario` usa `{status:"success", data}`; `proveedor_items`/`clientes` validación usa `{success, message, errors}`). Replicá el shape EXACTO de cada endpoint. El frontend tolera errores (`.message || .msg`) pero NO tolera cambios en el shape de éxito.
- **Antes de migrar cada endpoint, capturá el JSON real que devuelve CI4** (curl) y verificá que Nest devuelva el mismo shape. *Golden testing* de contrato.

---

## 9. Validación de entrada (DTOs)

Reemplaza `ValidatesJson` / `$this->validate()`:

```ts
export class CreateUnidadDto {
  @IsString() @IsNotEmpty() @MaxLength(50)
  nombre: string;

  @IsOptional() @IsNumber()
  escala?: number;
}
```

- `ValidationPipe` global con `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.
  - `whitelist` = descarta props no declaradas (protección mass-assignment, reemplaza el hardening de `allowedFields`).
  - `transform` = castea tipos automáticamente.
- Los mensajes de error de `class-validator` salen por el `HttpExceptionFilter` como `422 {ok:false, msg, errors}`.
- Replica las reglas reales: ej. formulaciones exige cantidades > 0, porcentajes [0,100]; `factor_conversion > 0`; `password` min según `Cfg('password_min_caracteres', 8)`.

---

## 10. Configuración y variables de entorno

- **`@nestjs/config`** con `configuration.ts` tipado y validación de env (`Joi` o `class-validator`) al arrancar. Si falta `TOKEN_SECRET` o `DB_*`, la app **no debe levantar**.
- Reutilizá el `.env` de PINCA (mismos nombres: `TOKEN_SECRET`, `database.default.*`). Podés mapear `database.default.hostname` → `DB_HOST` en `configuration.ts`.
- La config de negocio (jwt horas, márgenes, límites de paginación, IVA) vive en la tabla `configuracion_sistema`, no en `.env`. Portá el `Helpers/Cfg.php` a un `ConfiguracionService` con caché (TTL corto). No leas la BD por cada request para el mismo valor.

---

## 11. Optimización y rendimiento

- **Evitar N+1**: usá `QueryBuilder` con joins o subqueries agrupadas (como ya hacen tus models optimizados). Nunca un query por elemento de una lista.
- **Paginación con tope**: replicá `page_size_default` / `max_per_page` de `configuracion_sistema`. Ningún endpoint debe aceptar `?limit=∞`.
- **Índices**: la BD ya los tiene (`idx_mov_item`, etc.). No los toques desde Nest hasta que el módulo sea 100% de Nest.
- **Caché**: `@nestjs/cache-manager` para lecturas caras y repetidas (dashboards, config). Considerá Redis cuando escale (estaba en el backlog de CI4).
- **`decimal` como string** para todo lo monetario (ver §4.3). Un float en costos = auditoría de rentabilidad rota.
- **Índices de compilación**: mantené `strict` y evitá el patrón de "todo en un service gigante" — services chicos compilan y testean mejor.
- No optimices prematuramente: migrá con paridad funcional primero, medí después.

---

## 12. Testing (la red de seguridad de la migración)

- **Jest** (viene con NestJS). Unit tests de services (mockeando repos) + e2e con `supertest`.
- **Golden/contract tests**: para cada endpoint migrado, un test e2e que verifica el shape exacto contra lo que CI4 devolvía. Portá los escenarios de los Feature tests existentes de PHPUnit (`LoginTest`, `OrdenesCompraTest`, `PreparacionesTest`, `RemisionesStockTest`, `SoftDeleteTest`).
- **Los módulos delicados (capas, formulaciones, numeración) NO se migran sin tests que capturen el output actual.** Antes de reescribir `consumirCapasFIFO`, escribí un test que corra el CI4 real y guarde el resultado; luego exigí que Nest dé idéntico.
- CI: corré `npm run test`, `npm run test:e2e`, `npm run lint` y `tsc --noEmit` en cada PR.

---

## 13. Coexistencia (Strangler) — cómo enrutar

Detrás de Nginx (o el reverse proxy que uses):

```nginx
# Módulos ya migrados a Nest → puerto 3000
location /api/unidades      { proxy_pass http://nest:3000; }
location /api/categorias    { proxy_pass http://nest:3000; }
# Todo lo demás → CI4 (Apache :80)
location /api               { proxy_pass http://ci4:80; }
```

- Ambos backends comparten `TOKEN_SECRET` y la misma BD MySQL.
- Se migra una ruta → se agrega su `location` a Nest → se elimina del CI4.
- El frontend no cambia (misma base URL `/api`). Solo cambia quién responde.
- **Regla**: nunca migres media ruta. Un endpoint entero (con sus sub-rutas) pasa a Nest de una, con sus tests de contrato verdes.

---

## 14. Orden de migración recomendado (de menor a mayor riesgo)

1. **Fase 0** (esqueleto): config, DB, guards JWT/RBAC compatibles, filtro de errores, health. Login sigue en CI4. ✅ HECHA.
2. **Fase 1** (CRUD simple, ganar confianza): `unidades`, `categorias`, `bodegas`, `instalaciones`, `proveedores`, `clientes`. ✅ HECHA (payloads crudos, verificados end-to-end). Diferidos a CI4 por depender de otros dominios: `bodegas/inventario/:id` (capas) y `proveedor_items` (item_proveedor). ← *próximo: enrutar en nginx + golden tests*
3. **Fase 2** (documentos comerciales):
   - **Lote A ✅ HECHO**: `numeracion` (reservar DIAN transaccional, dependencia compartida), `cotizaciones` (CRUD+estado, defer `convertir`), `facturas` (CRUD+estado+recalcularSaldo+anulación+bulk vía raw SQL). Verificado end-to-end.
   - **Lote B ✅ HECHO**: `catalogo` (maestro; stock por raw SQL a inventario_capas + guard 409 en delete), `ordenes_compra` (CRUD+estado+iva, defer recepción→capas), `remisiones` (CRUD, defer despacho→capas y `convertir`). Verificado end-to-end.
   - Diferido: los `convertir` (cotización/remisión→factura) y todo lo que toca capas quedan en CI4 hasta más adelante.
4. **Fase 3** (núcleo crítico, con tests exhaustivos):
   - **Lecturas ✅ HECHO**: módulo `inventario` (raw SQL) — `/inventario/global`, `/inventario/:id/capas`, `/inventario/capas/bodegas`, `/inventario/capas/preparacion/:id`, `/movimientos`. Golden 18/18.
   - **Escrituras — recepción de OC ✅ HECHO**: `CapasService` (motor de capas: crearCapa, recalcularPromedioPonderado, ingresarABodega, registrarMovimiento, resolverLoteProveedor) + `recibirLinea`. Verificado con el **golden harness de costeo** (`test/cost-golden.mjs`): fixture → recepción en CI4 y Nest → comparar capas/costos → MATCH byte-idéntico. Patrón replicable para el resto.
   - **Consumo FIFO ✅ HECHO**: `CapasService` ganó `consumirCapasFIFO/PorProveedor`, `consumirDeCapas` (núcleo), `registrarConsumos`/`restaurarCapas`. Primer consumidor: `POST /inventario/ajuste-manual`. Verificado con `test/fifo-golden.mjs` (fixture 2 capas, descuento FIFO) → MATCH byte-idéntico.
   - **Producción/`preparaciones` ✅ HECHO**: create (BOM + 3 modos de consumo + costo congelado en produccion_insumos_detalle), reads, update (cancelación/reactivación). Verificado con `test/prod-golden.mjs` → MATCH byte-idéntico. El stock se descuenta AL CREAR (estado=0).
   - **Escrituras (pendiente)**: despacho de remisiones, traspaso/removeFromBodega, `formulaciones` (CRUD recetas), `sincronizacion`; y los `convertir`. El motor de capas COMPLETO (crear/consumir FIFO/proveedor/manual/restaurar/promedio/movimiento) está en `CapasService` — reusarlo. Migrar cada consumidor con su golden harness.
   - **Método**: para CADA operación de costeo, armar el golden harness (fixture controlado → correr en CI4 y Nest → comparar el estado resultante de capas/costos/movimientos → teardown). Ya surgió 2 veces el patrón "columna varchar demasiado chica que CI4 trunca en silencio" (facturas.numero, costos_item.metodo_calculo) — el harness los detecta.
5. **Fase 4**: auth completo (login/refresh/logout migrados a Nest), y apagar CI4.

---

## 15. Anti-patrones (no hacer)

- ❌ `synchronize: true` en TypeORM contra la BD real. **Borra datos.**
- ❌ Lógica de negocio en el controller. Va al service.
- ❌ `number` (float) para dinero/costos. Usá `decimal`/string.
- ❌ Cambiar el shape de un JSON que el frontend consume "porque es más lindo". Rompe el front.
- ❌ Emitir/validar JWT con estructura distinta (sin `data.*`, sin `token_version`). Rompe la coexistencia.
- ❌ Migrar los módulos de costeo sin tests de contra-referencia contra CI4.
- ❌ Un "god service" de 1.000 líneas replicando el model monolítico. Es la deuda que estamos pagando.
- ❌ Mezclar `this.repo` con el `manager` transaccional dentro de una tx.

---

## 16. Referencias

- NestJS docs: https://docs.nestjs.com/ (SPA — abrir en navegador, no scrapeable)
- TypeORM: https://typeorm.io/
- `passport-jwt`: https://www.npmjs.com/package/passport-jwt
- `class-validator`: https://github.com/typestack/class-validator
- Contrato interno de PINCA: `pinca_backend/CLAUDE.md` (fuente de verdad del comportamiento actual)

---

> **Estado**: Fase 0 en construcción. Este documento se actualiza a medida que se migran módulos. Cuando un módulo pase a Nest, anotá aquí cualquier decisión no obvia (como se hace en `CLAUDE.md` del backend PHP).
