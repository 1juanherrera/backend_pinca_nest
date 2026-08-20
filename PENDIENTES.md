Relacionado con: [[GUIA_NESTJS_PINCA]]
Ver configuración en: [[pinca_backend_nest/README|README Backend]]
# Pendientes del proyecto PINCA

_Generado 2026-07-30, reorganizado por estado 2026-08-20. Ver memoria del asistente para contexto/detalle completo de cada punto._

## 🔴 Por Hacer

### Facturación electrónica (Factus)

- [ ] **Datos de empresa en Factus sin actualizar** — el sandbox sigue mostrando "FACTUS V2" en vez del NIT/razón social real de PINCA (`PUT /v2/companies` nunca se hizo).
- [ ] **Sandbox de Factus es una cuenta compartida genérica** — para producción, Factus debe activar una cuenta propia con el NIT real de PINCA.
- [ ] **Gaps de datos en `clientes`** — faltan columnas `identification_document_code`, `legal_organization_code`, `tribute_code`, `municipality_code` en la entidad `Cliente`, necesarias para mapear un cliente real al formato de Factus.
- [ ] **Conectar `facturacion-electronica` al flujo real de `facturas`** — hoy es un módulo aislado/harness que no toca nada real; es el paso grande, diferido a propósito hasta terminar de evaluar.
- [ ] **Decisión de fondo sin tomar**: si PINCA se queda con Factus o evalúa otro proveedor DIAN.
- [ ] **`characterSet: PC858_EURO` sin verificar** contra el modelo real de impresora — revisar si tildes/ñ salen bien al imprimir de verdad.

### Impresora térmica

- [ ] **Impresión real de la tirilla sin probar** — falta la IP de la impresora térmica en la sede del cliente. Cuando se tenga: setear `PRINTER_IP` en `pinca_backend_nest/.env` + `docker compose up -d --force-recreate -V api`, luego probar `POST /facturacion-electronica/facturas/:number/tirilla/imprimir`.

### Frontend / PDFs

- [ ] **`ExportTrazabilidad`** sigue con el diseño viejo (`pdfHeader.js`, banda negra/amarilla) — no migrado al diseño branded (`DocPdf.jsx`).
- [ ] **`ExportProduccion`** sigue con jsPDF crudo, sin plantilla — no migrado.

### Nómina

- [ ] **SMMLV y auxilio de transporte son placeholders** — sin prestaciones sociales ni retención en la fuente calculadas.

### Facturación interna (módulo `facturas`, no Factus)

- [ ] **Retenciones UVT** — quedaron explícitamente en pausa por decisión del usuario ("ahora no"), no por falta de tiempo.

### Deploy

- [ ] **`trust proxy` sin configurar** en el backend (confirmado con grep 2026-07-30) — pendiente para cuando se haga deploy real.

### Seguridad (revisión pre-deploy, 2026-08-06)

_Checklist operacional/infra, no de código — a revisar en las semanas previas al deploy._

- [ ] **Rotar `GEMINI_API_KEY`** — sigue en claro en `.env`, ya documentado como pendiente en `pinca_backend_nest/CLAUDE.md`.
- [ ] **`TOKEN_SECRET` (JWT) nuevo para producción** — generar uno largo y específico, nunca reusar el de dev/sandbox.
- [ ] **Confirmar credenciales de Factus/OpenRouter de producción** (no las de sandbox) con permisos mínimos necesarios.
- [ ] **Definir quién tiene acceso a los secretos de producción** y cómo se rotan si alguien deja el proyecto.
- [ ] **phpMyAdmin no debe quedar expuesto públicamente** — restringir por IP/firewall o detrás de VPN/túnel SSH.
- [ ] **Puerto de MySQL (3306) no debe estar expuesto a Internet** — solo accesible dentro de la red interna de Docker/el servidor.
- [ ] **Confirmar qué puertos quedan abiertos** hacia afuera en el firewall del servidor (idealmente solo 80/443).
- [ ] **HTTPS con certificado real** (Let's Encrypt u otro) con renovación automática — no arrancar producción sin esto.
- [ ] **`CORS_ALLOWED_ORIGIN` apuntando al dominio real de producción** (no `localhost`).
- [ ] **Cookies/headers de sesión con flags `Secure`/`HttpOnly`/`SameSite`** una vez haya dominio real con HTTPS.
- [ ] **SSH con llave (no password)**, `root` login deshabilitado, fail2ban o equivalente en el servidor.
- [ ] **2FA en la cuenta del hosting/VPS y en el registrador del dominio.**
- [ ] **Definir quién tiene acceso SSH/Docker al servidor de producción.**
- [ ] **Backups automáticos y programados** — hoy son manuales (`pinca_backend_nest/backups/`).
- [ ] **Backups fuera del servidor de producción** (si el servidor cae o lo comprometen, el backup local no sirve).
- [ ] **Probar una restauración completa desde backup** al menos una vez antes del deploy.
- [ ] **Proceso de actualización de dependencias con CVEs conocidos** post-deploy (aunque sea manual y mensual).
- [ ] **Política de tratamiento de datos personales (Ley 1581 de 2012, Colombia)** — el sistema maneja datos de empleados (nómina) y clientes; confirmar con el cliente si tienen o necesitan una política registrada.
- [ ] **Definir retención de logs/backups con datos personales.**
- [ ] **Monitoreo/alertas mínimas** (servidor caído, errores 500 masivos) — hoy no hay nada de esto.
- [ ] **Plan simple de incident response** ("si esto se cae a las 2am, ¿quién responde y cómo?").
- [ ] **Separación real entre sandbox (Factus, etc.) y producción** — evitar que un error de configuración dispare algo real contra el ambiente equivocado.

### Fórmulas

- [ ] **Falta decidir cuál PVA usar en VINILO T2 ECONOMICO** (3 kg, línea 14 de la formulación, hoy como nota pendiente sin insumo asignado): RESIFLEX 610 ($5.040/kg, 1 proveedor) vs RESIFLEX F55M ($6.723-7.620/kg, 2 proveedores). Decisión pospuesta por el usuario.

---

## 🟡 En Proceso

### Facturación electrónica (Factus)

- [ ] **Logo de Factus da 500** en el sandbox — reintentar `POST /v2/companies/logo` más adelante o reportar a soporte de Factus.
- [ ] **⚠️ Nómina Electrónica DIAN vía Factus — BLOQUEADA (2026-08-03)**: probado el sandbox real, `POST /v2/payrolls` (crear) da `403 "La empresa no tiene habilitada la creación de este documento"`. La cuenta compartida solo puede listar, no crear. Acción tuya: gestionar con soporte de Factus la habilitación de Nómina Electrónica (posible plan/costo aparte). Retomar cuando esté habilitado — nada de código escrito todavía, decisión explícita de pausar.

### Frontend / PDFs

- [ ] **⚠️ Acción tuya: correr `npm install` en Windows** antes del próximo `npm run dev`/`build` — instalar/desinstalar `qrcode` desde WSL le quitó dos veces a `node_modules/@rollup` el binario `rollup-win32-x64-msvc` (mismo bug ya conocido, ver memoria `frontend-rollup-cross-platform-node-modules`). Sin este paso, Vite en Windows va a fallar con "Cannot find module @rollup/rollup-win32-x64-msvc".

---

## 🟢 Completado

### Frontend / PDFs

- [x] **Estilo "Factus" agregado** (2026-07-30) a Cotización, Remisión, Orden de Compra y Recibo de pago — toggle nuevo junto a Carta/Tiquete en cada exporter (`CotizacionFactusStyleDoc.jsx`, `RemisionFactusStyleDoc.jsx`, `OrdenCompraFactusStyleDoc.jsx`, `ReciboFactusStyleDoc.jsx`). NO aplica a `facturas` (si son electrónicas DIAN vía Factus, el PDF legal tiene que ser el que entrega Factus, no uno reformateado). Header final SIN QR (se probó con QR de texto plano, decorativo, y se quitó a pedido del usuario): logo a la izquierda, título + número + datos de la empresa alineados a la derecha (dos columnas, no centrado). La dependencia `qrcode` se instaló y luego se desinstaló otra vez (ya no queda en `package.json`).
- [x] **Gaps de datos resueltos (2026-07-30)**: `cotizaciones.service.ts` (`findAll`/`findOne`) ahora trae `nit_cliente`/`ciudad`/`direccion`; `ordenes-compra.service.ts` (`detalle`) ahora trae `nit_proveedor`/`direccion_proveedor`; `pagos-cliente.service.ts` (`index`) ahora trae `nit_cliente`. Validado en runtime contra Docker (OC-003 real con NIT/dirección de BRENNTAG COLOMBIA; fila `__TEST__` insertada/borrada para cotizaciones). Beneficia también a los formatos Carta/Tiquete existentes, no solo al estilo Factus.
- [x] **Bug corregido en `ExportRecibo.jsx`**: `buildConfig` leía `pago.factura_numero` en vez de `pago.numero_factura` (el campo real que devuelve el backend) — el campo "Factura" del recibo salía siempre vacío en Carta/Tiquete. Corregido.

### Seguridad

- [x] **`npm audit` en ambos repos** (2026-08-06). Backend: 6→**0 vulnerabilidades** con `npm audit fix` (sin `--force`). Frontend: 15→**0 vulnerabilidades** — la mayoría con `npm audit fix` (sin `--force`), más 2 arregladas a mano:
  - **react-router 7.18.2 → 8.3.0** (breaking change). Revisado el changelog real de v8: los cambios rompedores son del data router (RouterProvider/middleware/loaders/actions); esta app usa el router declarativo clásico (BrowserRouter/Routes/Route), no afectado. Validado con build + lint + dev server de Vite (pre-bundle sin errores). **Falta**: pasada visual rápida en `npm run dev` de Windows — no se pudo clickear en un navegador real desde este contenedor (sin Chromium/Playwright).
  - **xlsx 0.18.5 → 0.20.3**, pinneado a la URL versionada del CDN oficial de SheetJS (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) — dejaron de publicar parches al registro de npm tras una disputa. Validado con smoke test directo (genera un `.xlsx` real con las 4 APIs que usa el proyecto).
  Build/lint/typecheck verdes en ambos repos.

### Fórmulas

- [x] **VINILO BLANCO TIPO 2** tenía `AGUA=0` en la formulación — resuelto 2026-08-04, puesto en 240 (indicado directamente por el usuario, no visible en la foto de la libreta).
- [x] **Agregados 2 productos nuevos desde fotos de libreta (2026-08-04)**: `VINILO T2 ECONOMICO` (id 461) y `VINILO T1 COMERCIAL` (id 462), con sus formulaciones completas transcritas de la libreta. Insumo nuevo creado: `REGULADOR PH` (id 460), vinculado al proveedor COLARQUIM que ya existía suelto.

### Setup de Obsidian

- [x] **Carpeta `templates/` creada (2026-08-20)** con `plantilla_endpoint.md` (estructura para documentar endpoints NestJS) y `plantilla_componente.md` (estructura para componentes Frontend).
- [x] **`000_INDICE_PROYECTO.md` actualizado (2026-08-20)** con enlaces a las nuevas plantillas.
- [x] **Nota `PENDIENTES` reorganizada en checklist por estado (2026-08-20)** — dividida en 🔴 Por Hacer / 🟡 En Proceso / 🟢 Completado.
- [x] **Duplicidad `Plantillas/` (ES, raíz sin git) vs `templates/` (EN) resuelta (2026-08-20)**: se eliminó `Plantillas/` (incompleta) y `templates/` se movió a `pinca_backend_nest/templates/` — la raíz de la bóveda no es un repo git, así que las plantillas quedaban sin versionar ahí; ahora viven dentro del repo del backend, donde sí se commitean.
