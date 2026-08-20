---
aliases:
  - Config Obsidian
---
# Configuración local de Obsidian (no versionada)

`.obsidian/` vive en la raíz de la bóveda (`PROYECTO_PINCA/.obsidian/`) y **no está en ningún repo git** — la raíz del monorepo no es un repositorio, así que esa carpeta no viaja entre PCs. Este documento existe para poder replicar a mano la configuración en otra máquina (ej. la PC de casa).

## Grupos de color (Vista Gráfica → Filtros → Grupos)

Configurados el 2026-08-20. El **orden importa**: Obsidian aplica el color del **primer** grupo que matchea una nota, así que las reglas específicas (`file:...`) van antes que las generales (`path:...`) — si no, todo lo de `pinca_backend_nest` se pintaría del color genérico de backend y nunca se verían los colores específicos de `PENDIENTES`, `000_INDICE_PROYECTO` o los `README`.

Para reconstruirlo a mano: **Configuración → Vista Gráfica global → Grupos → Nuevo grupo**, y cargar cada fila en este orden exacto:

| # | Query | Color (hex) | Qué resalta |
|---|---|---|---|
| 1 | `file:PENDIENTES` | `#E74C3C` (rojo/coral) | La nota de pendientes |
| 2 | `file:000_INDICE_PROYECTO` | `#F1C40F` (dorado) | El índice/hub del proyecto |
| 3 | `file:README` | `#BDC3C7` (gris claro) | Todos los README (backend, frontend, docs) |
| 4 | `path:templates` | `#1ABC9C` (verde azulado) | Las plantillas de Obsidian |
| 5 | `path:PINCA_WEB_docs` | `#E67E22` (naranja) | Docs de la extensión PINCA_WEB |
| 6 | `path:pinca_frontend` | `#9B59B6` (morado) | Resto de notas de frontend |
| 7 | `path:pinca_backend_nest` | `#4A90D9` (azul) | Resto de notas de backend |

**Nota**: como la regla 3 (`file:README`) va antes que la 6/7, **los 3 README del proyecto (backend, frontend y `docs/README.md`) se ven todos del mismo gris** — no se distinguen por repo. Es intencional (lo específico gana), pero si se prefiere que el README de frontend se vea morado como el resto de ese repo, hay que mover la regla `path:pinca_frontend` antes que `file:README`.

## Atajo: editar `.obsidian/graph.json` directo

En vez de cargar los 7 grupos a mano desde la UI, se puede pegar este bloque directo en `colorGroups` dentro de `PROYECTO_PINCA/.obsidian/graph.json` (con Obsidian cerrado, para que no lo pise al guardar):

```json
"colorGroups": [
  { "query": "file:PENDIENTES", "color": { "a": 1, "rgb": 15158332 } },
  { "query": "file:000_INDICE_PROYECTO", "color": { "a": 1, "rgb": 15844367 } },
  { "query": "file:README", "color": { "a": 1, "rgb": 12436423 } },
  { "query": "path:templates", "color": { "a": 1, "rgb": 1752220 } },
  { "query": "path:PINCA_WEB_docs", "color": { "a": 1, "rgb": 15105570 } },
  { "query": "path:pinca_frontend", "color": { "a": 1, "rgb": 10181046 } },
  { "query": "path:pinca_backend_nest", "color": { "a": 1, "rgb": 4886745 } }
]
```

## Otros ajustes de esa sesión

- **`showOrphans: true`** — el grafo muestra también notas sin ningún enlace (útil para detectar huérfanas como pasó con `Plantillas/plantilla_endpoint.md`, ya eliminada).
- **Sin plugins de comunidad instalados** (`community-plugins.json` vacío) — solo los núcleo (Graph, Backlinks, Outgoing Links, etc. activados por defecto).
- Si el grafo aparece desconectado/incompleto después de mover o traer archivos por `git pull`: **`Ctrl+P` → "Reload app without saving"** para forzar el reindexado. No es necesario mover ningún archivo de vuelta a la raíz — vimos que era solo caché desactualizado.
