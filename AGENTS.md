# Reglas del Proyecto — Revisión Documental AI

## Contexto general

Estamos construyendo una aplicación web interna llamada **Revisión Documental AI**.

El sistema será usado por un equipo pequeño de aproximadamente **5 revisores de documentos**. Cada revisor realiza revisiones manuales y valida que los documentos cumplan ciertos criterios institucionales o administrativos.

El objetivo del sistema no es reemplazar al revisor humano, sino crear un **asistente local de pre-revisión documental** que ayude a detectar omisiones, inconsistencias y posibles incumplimientos antes del dictamen humano final.

Los revisores trabajarán de forma remota desde casa conectándose por **VPN** a una **PC local de trabajo**. La aplicación debe correr en esa PC local y ser accesible únicamente dentro de la red/VPN.

No se debe depender de servicios de pago ni de APIs externas para analizar documentos.

---

## Arquitectura objetivo

La arquitectura base será:

```text
Revisor remoto
   ↓
VPN
   ↓
PC local de trabajo
   ↓
Aplicación web interna
   ├── Frontend Next.js
   ├── Backend FastAPI
   ├── Base de datos local
   ├── Almacenamiento local de documentos
   ├── Extracción de texto / OCR
   ├── Cola de procesamiento
   └── Ollama con modelo LLM local
```

---

## Stack obligatorio

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui (para componentes consistentes con bento grid y dashboards sobrios)
* PDF.js para visor de documentos PDF

### Backend

* Python
* FastAPI
* Pydantic (estrictamente V2)
* SQLAlchemy o cliente de Supabase

### Base de datos / Autenticación

* Supabase local (corriendo en Docker) en lugar de SQLite y PostgreSQL crudo para acelerar el desarrollo del MVP, roles (RLS) y la autenticación.

### IA local

* Ollama corriendo localmente en `localhost:11434`
* Modelos y cuantizaciones recomendadas:
  * `qwen3.5:9b` (Q4_K_M) - Principal recomendado
  * `llama3.1:8b` (Q6_K) - Alternativo
  * `deepseek-r1:32b` (Q3_K_M) - Alternativo para razonamiento avanzado
  * `nomic-embed-text` - Para embeddings
* Structured Outputs: Utilizar el parámetro `format` de la API de Ollama pasando directamente el esquema JSON de Pydantic.

### Extracción documental

* Docling para extracción estructurada
* OCRmyPDF para PDFs escaneados
* Tesseract para OCR

### Cola de procesamiento

* Redis
* RQ

### Vector DB posterior

* ChromaDB

### Acceso interno

* VPN
* Caddy como reverse proxy interno en una etapa posterior

---

## Restricciones obligatorias

No usar:

* Open WebUI
* APIs externas para analizar documentos
* Servicios de pago
* Servicios cloud obligatorios
* OpenAI API, Claude API, Gemini API u otra API externa para revisar documentos
* Almacenamiento externo de documentos
* Análisis documental fuera de la PC local

La IA debe correr localmente mediante Ollama.

---

## Reglas de seguridad

* La aplicación será accesible únicamente por VPN.
* No exponer Ollama directamente a la red.
* No exponer Redis directamente a la red.
* No exponer la base de datos directamente a la red.
* Solo la aplicación web/API debe estar disponible dentro de la VPN.
* Ollama debe permanecer en `localhost:11434`.
* Los documentos deben guardarse localmente en `/storage/documents`.
* Implementar usuarios y roles desde etapas tempranas.
* Registrar auditoría de acciones importantes.

Roles mínimos:

```text
admin
revisor
```

Acciones a auditar:

```text
document_uploaded
document_processed
text_extracted
ocr_processed
ai_review_started
ai_review_completed
human_verdict_saved
document_downloaded
criteria_updated
```

---

## Principio funcional más importante

La IA no aprueba ni rechaza documentos de forma definitiva.

La IA solo genera una **pre-revisión asistida** con:

* criterios cumplidos,
* criterios no cumplidos,
* criterios no encontrados,
* criterios que requieren revisión humana,
* evidencia textual,
* página,
* explicación breve,
* nivel de confianza.

El dictamen final siempre lo realiza un revisor humano.

---

## Flujo funcional principal

```text
1. El revisor inicia sesión.
2. Sube un documento.
3. El sistema guarda el archivo localmente.
4. El backend extrae texto.
5. Si el documento no tiene texto, se marca como candidato a OCR.
6. Si requiere OCR, se procesa con OCRmyPDF/Tesseract.
7. El texto se divide en fragmentos por página o sección.
8. Se aplican reglas determinísticas.
9. Se ejecuta revisión con IA local usando Ollama.
10. La IA responde en JSON validado.
11. El frontend muestra resultados como checklist.
12. El revisor valida, corrige o complementa.
13. Se guarda el dictamen humano.
```

---

## Enfoque de revisión documental

La revisión debe funcionar por capas:

### Capa 1 — Reglas determinísticas

Usar reglas normales antes de usar IA.

Ejemplos:

* detectar folio,
* detectar fecha,
* validar vigencia,
* detectar nombre,
* detectar CURP/RFC/matrícula si aplica,
* validar número de páginas,
* detectar palabras clave,
* validar formato de campos.

### Capa 2 — Extracción y fragmentación

No enviar el documento completo al LLM.

Dividir el contenido en chunks:

* Priorizar **Semantic Chunking** basado en los encabezados (Headers) y párrafos extraídos por Docling (que exporta el documento estructurado en Markdown), usando la longitud de palabras (500 a 1,200 palabras, overlap de 100 a 150 palabras) únicamente como límite secundario.
* Mantener metadatos de página/sección para el visor.

### Capa 3 — IA local

Enviar al modelo solo:

* el criterio,
* fragmentos relevantes,
* reglas de decisión,
* formato JSON obligatorio.

Si no hay evidencia suficiente, la IA debe responder:

```text
requiere_revision
```

o:

```text
no_encontrado
```

Nunca debe inventar datos.

---

## Contrato JSON para revisión IA

Toda respuesta de IA debe validarse con Pydantic.

Formato esperado:

```json
{
  "criterion_id": "C01",
  "status": "cumple | no_cumple | no_encontrado | requiere_revision",
  "confidence": 0.0,
  "evidence": "Texto exacto o resumen breve de evidencia encontrada.",
  "page_number": 1,
  "explanation": "Explicación breve del resultado.",
  "human_action_required": true
}
```

Reglas:

* `status` solo puede usar los valores permitidos.
* `confidence` debe ser número entre 0 y 1.
* `evidence` no debe inventarse.
* `page_number` puede ser `null` si no hay evidencia.
* Si no hay evidencia clara, usar `requiere_revision` o `no_encontrado`.

---

## Estilo visual de la aplicación

La aplicación debe tener una interfaz:

```text
institucional
moderna
limpia
sobria
funcional
profesional
```

Se puede usar estilo **bento grid**, pero solo en pantallas donde aporte valor.

### Usar bento grid en:

* Dashboard principal
* Métricas
* Resumen de documentos
* Productividad por revisor
* Alertas
* Estado general de la cola IA
* Reportes ejecutivos

### No usar bento grid como estructura principal en:

* Pantalla de revisión documental
* Visor PDF
* Checklist detallado
* Dictamen humano

La pantalla de revisión documental debe usar layout tipo workspace profesional:

```text
┌──────────────────────┬────────────────────────┬──────────────────────┐
│ Visor PDF             │ Resultados IA/checklist │ Dictamen humano       │
│ Documento             │ Evidencia               │ Aprobar/Rechazar      │
│ Página/zoom           │ Confianza               │ Comentarios           │
└──────────────────────┴────────────────────────┴──────────────────────┘
```

* **Interactividad Visor-Evidencia**: Al hacer clic en la "evidencia" proporcionada por la IA en el checklist, el visor PDF debe hacer scroll automático y resaltar esa sección exacta en el documento.
* **Librería de Componentes**: Utilizar `shadcn/ui` para construir dashboards, bento grids y la interfaz sobria/institucional de manera rápida y consistente.

La bandeja de documentos debe usar:

```text
Bento de métricas arriba
Tabla profesional abajo
```

---

## Estructura inicial del proyecto

Crear un monorepo:

```text
revision-documental-ai/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   └── shared/
│
├── infra/
│   ├── docker-compose.yml
│   ├── Caddyfile
│   └── scripts/
│
├── storage/
│   ├── documents/
│   ├── processed/
│   └── reports/
│
├── AGENTS.md
└── README.md
```

---

## Fases de implementación

No implementar todo al mismo tiempo.

Trabajar por fases incrementales.

### Fase 1 — MVP base sin IA

Objetivo: tener la app funcionando con carga y consulta de documentos.

Implementar:

* monorepo,
* backend FastAPI,
* frontend Next.js (App Router y shadcn/ui),
* login e infraestructura de usuarios usando Supabase local (Docker),
* carga de documentos,
* listado de documentos,
* detalle de documento,
* visor PDF básico con scroll y resaltado de evidencia,
* almacenamiento local en `/storage/documents`.

Endpoints mínimos:

```text
POST   /auth/login (o integración con Auth de Supabase)
GET    /me

POST   /documents/upload
GET    /documents
GET    /documents/{id}
GET    /documents/{id}/file
```

No implementar todavía:

* OCR,
* Docling,
* Ollama,
* ChromaDB,
* Redis,
* RQ,
* dashboard avanzado.

---

### Fase 2 — Extracción de texto

Implementar:

* extracción de texto de PDF,
* extracción de texto de DOCX,
* tabla `document_chunks`,
* endpoint `POST /documents/{id}/extract-text`,
* endpoint `GET /documents/{id}/chunks`,
* visualización de texto extraído en frontend,
* estado para marcar si requiere OCR.

No implementar todavía IA ni ChromaDB.

---

### Fase 3 — OCR

Implementar:

* detección de PDF sin texto,
* procesamiento con OCRmyPDF,
* integración con Tesseract,
* extracción posterior del texto OCR,
* advertencias de baja calidad OCR.

---

### Fase 4 — Criterios y reglas

Implementar:

* CRUD de criterios,
* tabla `review_criteria`,
* reglas determinísticas,
* tabla de resultados por criterio,
* checklist inicial sin IA.

Tipos de revisión:

```text
rule
semantic
ai
rule_then_ai
```

---

### Fase 5 — IA local con Ollama

Implementar:

* módulo `ai_review`,
* cliente `ollama_client.py`,
* variable `OLLAMA_MODEL=qwen3:8b`,
* endpoint `POST /documents/{id}/review-ai`,
* endpoint `GET /documents/{id}/ai-review-results`,
* validación de JSON con Pydantic,
* guardado en `ai_review_results`,
* visualización en frontend como checklist.

Regla estricta:

```text
La IA no debe inventar datos.
Si no hay evidencia suficiente, debe responder requiere_revision.
```

---

### Fase 6 — Cola de procesamiento

Implementar:

* Redis,
* RQ,
* worker de procesamiento documental,
* estados de trabajo,
* procesamiento en background,
* protección para no saturar la PC con 5 revisores remotos.
* **Bloqueo de concurrencia en GPU**: La cola de RQ que procesa tareas de Ollama debe tener estrictamente `concurrency=1`. La GPU NVIDIA T1000 de 8GB no puede cargar dos instancias del modelo simultáneamente ni procesar dos inferencias pesadas a la vez sin quedarse sin memoria (OOM).

---

### Fase 7 — Búsqueda semántica / RAG

Implementar:

* embeddings con Ollama,
* ChromaDB local,
* búsqueda de chunks relevantes por criterio,
* envío al LLM solo de fragmentos relevantes.

---

### Fase 8 — Auditoría, reportes y endurecimiento

Implementar:

* auditoría completa,
* exportación de reportes,
* dashboard de productividad,
* backups,
* Caddy,
* configuración final para VPN.

---

## Reglas para el agente de código

Antes de modificar código:

1. Revisar estructura existente.
2. Identificar fase actual.
3. No implementar funcionalidades de fases futuras si no se solicitaron.
4. Proponer cambios mínimos y coherentes.
5. Mantener código modular.
6. No romper endpoints existentes.
7. No sobrescribir archivos sensibles.
8. No crear dependencias de pago.
9. No agregar APIs externas para IA.
10. Mantener comentarios útiles, no excesivos.
11. Responder siempre en español.
12. **Validación FastAPI**: Utilizar estrictamente Pydantic V2 para la validación de esquemas en FastAPI; no usar sintaxis depreciada de V1.
13. **Estructura Next.js**: Al generar código de Next.js, usar exclusivamente el App Router (app/) y React Server Components (RSC) donde aplique, minimizando el uso de `use client` a los componentes interactivos como el Visor PDF.

Después de modificar código:

1. Explicar qué se cambió.
2. Indicar archivos modificados.
3. Dar comandos para correr.
4. Dar comandos para probar.
5. Mencionar pendientes o riesgos técnicos.

---

## Convenciones de nombres

Estados de documento:

```text
uploaded
extracting_text
ocr_required
ocr_processing
processing
ready_for_review
ai_reviewing
ai_review_done
human_review_done
error
```

Estados de criterio IA:

```text
cumple
no_cumple
no_encontrado
requiere_revision
```

Rutas principales frontend:

```text
/auth/login
/dashboard
/documents
/documents/upload
/documents/[id]
/documents/[id]/review
/criteria
/admin/users
```

---

## Prioridad actual del proyecto

La prioridad inicial es construir la **Fase 1 — MVP base sin IA**.

No avanzar a IA, OCR, cola, ChromaDB o VPN final hasta tener funcionando:

```text
login (con Supabase local)
subida de documentos
listado de documentos
detalle del documento
visor PDF básico
metadatos en base de datos local (Supabase)
almacenamiento local
```
