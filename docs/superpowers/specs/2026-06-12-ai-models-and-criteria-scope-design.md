# AI Models and Criteria Scope Design

## Objetivo

Centralizar los modelos disponibles para procesamiento IA en backend y corregir la creación de criterios para que soporte alcance global o individual de forma explícita.

## Alcance

- Agregar `GET /ai/models` con modelos agrupados por categoría.
- Usar `qwen2.5:3b` como modelo predeterminado para carga y revisión de documentos.
- Consumir el catálogo desde `/documents/upload` y `/documents/[id]`.
- Mantener el simulador de `/criteria` con su selector rápido actual.
- Corregir el error al crear/actualizar criterios causado por auditoría.
- Agregar `scope: "global" | "individual"` al contrato de criterios.
- Permitir criterios globales solo a usuarios `admin`; los revisores crean criterios individuales.

## Diseño

Backend expone un router `/ai` dedicado a metadatos de IA local. La lista vive en una configuración Python simple para evitar duplicación y no consulta Ollama en tiempo real.

El contrato de criterios mantiene `reviewer_id` como persistencia real: `None` significa global y UUID significa individual. El nuevo campo `scope` se acepta en create/update y se devuelve en response como valor derivado para que el frontend no tenga que inferirlo.

Frontend carga `/ai/models` en las pantallas de carga y detalle. Si el endpoint falla, ambas pantallas conservan una lista local mínima con `qwen2.5:3b` por defecto para no bloquear el flujo.

## Pruebas

- Verificar que `/ai/models` existe, agrupa modelos y marca `qwen2.5:3b` como predeterminado.
- Verificar que crear criterio individual asigna `reviewer_id`.
- Verificar que admin puede crear criterio global.
- Verificar que revisor no puede crear criterio global.
- Verificar lint específico y build frontend después de conectar los selectores.
