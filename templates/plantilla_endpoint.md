---
aliases: []
tags: [backend, endpoint, nestjs]
---

# Endpoint: {{title}}

- **Módulo Backend:** [[pinca_backend_nest/README|Backend NestJS]]
- **Controller / Service:** `xxx.controller.ts` / `xxx.service.ts`
- **Método HTTP:** `GET` / `POST` / `PUT` / `PATCH` / `DELETE`
- **Ruta:** `/api/xxx/...`
- **Auth / Roles:** `JwtAuthGuard` + `@Roles('admin')` (ajustar según corresponda)
- **Estado:** 🔴 Por Hacer / 🟡 En Proceso / 🟢 Producción

---

## 📥 Request

**Params / Query:**

```json
{
  "param": "ejemplo"
}
```

**Body:**

```json
{
  "campo": "ejemplo"
}
```

---

## 📤 Response

**Éxito:**

```json
{
  "ok": true,
  "data": {}
}
```

**Error:**

```json
{
  "ok": false,
  "msg": "descripción del error"
}
```

---

## 📝 Notas

- Reglas de negocio / validaciones relevantes.
- Efectos secundarios (transacciones, locks, side-effects en otras tablas).
- Referencias cruzadas: [[pinca_backend_nest/CLAUDE|CLAUDE Backend]]
