---
aliases:
  - README Erp-Pinca
---
# PINCA — ERP de Pinturas Industriales

Sistema ERP web para **Pinturas Industriales del Caribe S.A.S.** (PINCA).
Cubre el flujo completo del negocio: catálogo de productos, inventarios por bodega,
formulaciones, producción, ventas (cotizaciones / remisiones / facturas),
compras, cartera, pagos, rentabilidad y trazabilidad de lotes.

## Estructura del repositorio

Este es un monorepo con dos proyectos:

```
PROYECTO_PINCA/
├── pinca_backend_nest/  ← API REST (NestJS 11 + TypeORM + MySQL) — sirve también el frontend + /uploads
└── pinca_frontend/      ← SPA (React 19 + Vite 7 + TailwindCSS 4)
```

Cada subproyecto tiene su propio `README.md` y `CLAUDE.md` (documentación
exhaustiva para agentes IA).

> **Migración CI4 → NestJS: completa.** El backend legacy (PHP + CodeIgniter 4)
> ya no existe en este repo. NestJS sirve el 100% de la API, el build estático
> del frontend y `/uploads` (ver `pinca_backend_nest/src/main.ts`). Detalle de
> arquitectura en [`pinca_backend_nest/GUIA_NESTJS_PINCA.md`](../GUIA_NESTJS_PINCA.md)
> (nota: ese archivo aún describe partes de la fase de convivencia con CI4 — desactualizado,
> confiar en `pinca_backend_nest/CLAUDE.md` para el estado actual).

## Stack

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, Vite 7, TailwindCSS 4, TanStack Query 5, Zustand 5, react-hook-form, react-router 7, lucide-react, recharts, jsPDF, xlsx |
| Backend | NestJS 11, TypeORM, MySQL 8 — puerto `:3009` |
| Infra dev | Docker Compose (stack `pinca-erp`: API Nest + MySQL + phpMyAdmin), Vite dev server (frontend) |

## Cómo levantar el stack completo

### 1. Backend (NestJS + MySQL)

```bash
cd pinca_backend_nest
cp .env.example .env       # ajustar TOKEN_SECRET, DB_*, claves de IA, etc.
docker compose up -d       # levanta db + api + phpMyAdmin (stack pinca-erp)
```

Servicios expuestos:

| Servicio | URL | Notas |
|---|---|---|
| API backend | `http://localhost:3009/api` | NestJS — también sirve el frontend estático y `/uploads` |
| phpMyAdmin | `http://localhost:8081` | Administración visual de MySQL |
| MySQL | `localhost:3306` (dentro de la red Docker) | DB `gestorpincadb` |

Detalle del stack, límites de `start:dev` en drvfs y receta de pruebas en
[`pinca_backend_nest/CLAUDE.md`](../CLAUDE.md).

### 2. Frontend (React + Vite)

```bash
cd pinca_frontend
cp .env.example .env       # default apunta a http://localhost:3009/api
npm install
npm run dev
```

App disponible en `http://localhost:5173`.

Build de producción:

```bash
npm run build              # genera dist/ — Nest lo sirve directamente (ver docker-compose.yml)
npm run preview            # sirve dist/ localmente
```

## Variables de entorno principales

### Backend (`pinca_backend_nest/.env`)

| Variable | Default | Descripción |
|---|---|---|
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | ver `.env.example` | Conexión a MySQL |
| `TOKEN_SECRET` | (cambiar) | Secreto para firmar JWT — rotarlo invalida todas las sesiones |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | Origen permitido para CORS |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` | — | Proveedor de IA primario (clasificador químico en `sincronizacion`) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | — | Proveedor de IA de respaldo |
| `PORT` | `3009` | Puerto de la API |

### Frontend (`pinca_frontend/.env`)

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3009/api` | URL del backend (sin slash final) |

## Troubleshooting común

- **CORS rechazado en dev**: confirmar que `CORS_ALLOWED_ORIGIN` en `pinca_backend_nest/.env` coincide con el origen del frontend (`http://localhost:5173` en dev).
- **JWT inválido / "Token expirado"**: revisar `TOKEN_SECRET` en `.env` del backend y reiniciar el contenedor. El frontend hace `GET /api/auth/me` antes de renderizar — si responde 401, redirige a `/login` automáticamente.
- **Cambios en `src/` no se reflejan**: si el proyecto vive en `/mnt/c/...` (drvfs), el watch de `start:dev` no dispara — correr `docker restart pinca-erp-api` y esperar ~40s.
- **`npm install` falla por permisos en WSL**: borrar `node_modules` y `package-lock.json`, luego reinstalar (`rm -rf node_modules package-lock.json && npm install`).
- **Build de Vite > 500 KB warning**: ya hay `manualChunks` configurados + lazy loading de páginas. Si crece, considerar dynamic imports adicionales (ver `pinca_frontend/CLAUDE.md` §10).

## Documentación detallada

- [`pinca_backend_nest/CLAUDE.md`](../CLAUDE.md) — estado actual del backend, comandos, patrones de código, receta de pruebas
- [`pinca_backend_nest/GUIA_NESTJS_PINCA.md`](../GUIA_NESTJS_PINCA.md) — arquitectura (contrato JWT/RBAC, estructura de módulos); partes desactualizadas de la fase de convivencia con CI4
- [`pinca_frontend/README.md`](../../pinca_frontend/README.md) — guía del frontend
- [`pinca_frontend/CLAUDE.md`](../../pinca_frontend/CLAUDE.md) — documentación interna del frontend (1300+ líneas, fuente de verdad visual + arquitectura)

## Licencia

Privado — propiedad de Pinturas Industriales del Caribe S.A.S.
