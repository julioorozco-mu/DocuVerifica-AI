PROMPT 1: MVP Base

Actúa como arquitecto full-stack senior.

Necesito construir una aplicación web interna llamada “Revisión Documental AI” para un equipo de 5 revisores. La app correrá en una PC local y será accesible únicamente por VPN desde los equipos de los revisores.

Stack obligatorio:
- Frontend: Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui + PDF.js
- Backend: Python + FastAPI + Pydantic V2 estrictamente
- Base de datos y Autenticación: Supabase local (Docker)
- Almacenamiento: Local en /storage/documents

No uses Open WebUI.
No uses servicios de pago.
No uses APIs externas para analizar documentos.
Al generar código de Next.js, usa Server Components (RSC) y minimiza el uso de "use client" solo a componentes interactivos (como el visor PDF).

Primera fase (Fase 1 - MVP):
1. Crear monorepo con apps/web y apps/api.
2. Crear backend FastAPI con endpoints:
   - POST /auth/login (integración con Auth de Supabase)
   - GET /me
   - POST /documents/upload
   - GET /documents
   - GET /documents/{id}
   - GET /documents/{id}/file
3. Crear frontend Next.js con:
   - Login
   - Dashboard (con estilo bento grid sobrio)
   - Lista de documentos (bento de métricas arriba, tabla abajo)
   - Carga de documento
   - Vista detalle de documento (layout workspace: Visor PDF a la izquierda, resultados/dictamen a la derecha)
   - Visor PDF básico con PDF.js (preparado para scroll y resaltado de evidencia)
4. Guardar documentos físicamente en /storage/documents.
5. Registrar metadatos en Supabase local usando los estados permitidos (ej. "uploaded").
6. Usar estructura limpia, modular y preparada para agregar OCR, IA y cola de procesamiento después.

Entrégame:
- estructura de carpetas
- comandos de instalación
- archivos principales
- modelos de base de datos para Supabase
- endpoints FastAPI
- pantallas Next.js
- instrucciones para correr localmente con docker-compose para Supabase

============================================================================>

PROMPT 2: Extracción Documental

Ahora implementa el bloque de extracción documental (Fase 2).

Contexto:
Ya existe una app FastAPI + Next.js con carga de documentos y Supabase local.

Necesito agregar:
1. Servicio de extracción de texto para PDF y DOCX.
2. Integración con Docling para extracción estructurada.
3. Implementar Semantic Chunking basado en encabezados y párrafos de Docling (exportando a Markdown). Usar longitud de 500 a 1,200 palabras y overlap de 100 a 150 palabras como límite secundario.
4. Guardar texto extraído por página/sección en tabla document_chunks, manteniendo los metadatos.
5. Crear endpoint POST /documents/{id}/extract-text.
6. Crear endpoint GET /documents/{id}/chunks.
7. Mostrar en frontend el texto extraído junto al visor del documento.
8. Manejar errores si el documento no tiene texto y actualizar el estado del documento estrictamente a "ocr_required" si esto sucede.

No implementes IA todavía.
No implementes Chroma todavía.
Mantén la validación de FastAPI usando estrictamente Pydantic V2.

===================================================================>

PROMPT 3: Revisión IA Local

Ahora implementa el bloque de revisión con IA local usando Ollama (Fase 5 y componentes de la 6).

Contexto:
Ya existe:
- FastAPI (con Pydantic V2)
- Next.js
- documentos cargados
- extracción de texto y chunks semánticos guardados en Supabase
- criterios de revisión (reglas determinísticas)

Necesito:
1. Crear módulo ai_review.
2. Crear cliente ollama_client.py para Ollama usando http://localhost:11434/api/chat.
3. Usar el modelo configurable OLLAMA_MODEL=qwen3.5:9b.
4. Crear prompt estricto para revisar un criterio usando solo los chunks relevantes del documento.
5. Implementar "Structured Outputs" pasando directamente el esquema JSON de Pydantic V2 al parámetro `format` de la API de Ollama.
6. El contrato JSON obligatorio de respuesta debe contener:
   - criterion_id (string)
   - status ("cumple" | "no_cumple" | "no_encontrado" | "requiere_revision")
   - confidence (float 0.0 - 1.0)
   - evidence (string)
   - page_number (int o null)
   - explanation (string)
   - human_action_required (bool)
7. Guardar resultados en tabla ai_review_results.
8. Crear endpoint POST /documents/{id}/review-ai. PRECAUCIÓN: Si usas una cola (RQ), asegúrate de que tenga estrictamente concurrency=1 para evitar OOM en la GPU.
9. Crear endpoint GET /documents/{id}/ai-review-results.
10. Mostrar resultados en frontend (Next.js) como un checklist.
11. Interactividad Visor-Evidencia: Al hacer clic en la "evidencia" en el checklist del frontend, el visor PDF debe hacer scroll automático y resaltar esa sección.
12. Regla estricta: No permitir que el modelo invente datos. Si no hay evidencia suficiente, el status debe ser "requiere_revision" o "no_encontrado".