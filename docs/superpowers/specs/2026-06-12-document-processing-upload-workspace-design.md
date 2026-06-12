# Diseño: procesamiento desde carga y workspace unificado

## Contexto

La pantalla `/documents` ya es el centro operativo de carga e historial. La pantalla `/documents/[id]` contiene herramientas de extracción, chunks, selección de modelo, lanzamiento de IA y dictamen. La pantalla `/documents/[id]/review` contiene el mejor workspace visual: visor PDF con minimapa, evidencias IA, resaltado al hacer clic y dictamen en columnas.

La decisión aprobada es consolidar estas funciones en una sola ruta canónica, conectar la configuración de carga con endpoints reales y ampliar el backend para soportar prioridad y selección de criterios individuales.

## Objetivos

- Usar `/documents/[id]` como workspace único de revisión documental.
- Eliminar la ruta `/documents/[id]/review` y actualizar los enlaces internos.
- Permitir que `/documents` envíe documentos con un plan de procesamiento seleccionado.
- Respetar el flujo de negocio: carga, extracción, OCR si aplica, IA si aplica.
- Aplicar siempre los criterios globales activos.
- Permitir seleccionar criterios individuales como plantillas adicionales.
- Persistir prioridad real del documento para historial visual del revisor.
- Mantener `Notificar revisor` como pendiente/deshabilitado.

## Rutas frontend

### `/documents`

La pantalla debe conservar carga, archivos en cola, historial y resumen documental. El bloque `Configuración de carga` pasa de decorativo a funcional.

Controles activos:

- `Prioridad local`: baja, media, alta. Se guarda en backend.
- `Extraer texto`: habilitado. Si se selecciona, tras subir se llama al flujo de extracción.
- `OCR automático`: habilitado como parte de extracción. No llama un endpoint propio; indica que el backend lo dispara cuando detecta PDF escaneado. Si `Extraer texto` esta apagado, este control queda apagado/deshabilitado.
- `Pre-revisión IA`: habilitado. Si se selecciona, el frontend activa tambien `Extraer texto` y `OCR automático`, porque la IA depende de texto disponible.
- `Modelo IA`: selector con los modelos ya usados en el workspace.
- `Criterios a aplicar`: muestra globales y permite seleccionar individuales.

Controles pendientes:

- `Notificar revisor`: visible pero deshabilitado.
- `Guardar borrador`: pendiente si no hay soporte real.

### `/documents/[id]`

Esta ruta queda como workspace canónico. Debe combinar:

- visor PDF dinamico con minimapa,
- badges de evidencias por pagina,
- click en evidencia para cambiar de pagina y resaltar texto,
- resultados de pre-revisión IA,
- texto/chunks extraidos cuando aplique,
- dictamen humano.

La pantalla debe usar el layout profesional de revision. En desktop se recomienda mantener tres columnas o un panel equivalente:

- visor PDF,
- resultados IA/texto,
- dictamen.

En pantallas estrechas puede usar tabs o apilamiento, pero sin perder las acciones principales.

### `/documents/[id]/review`

Se elimina la pagina y se actualizan todos los links internos para apuntar a `/documents/[id]`.

No se conserva redirect porque la app es interna y no hay requisito de compatibilidad con enlaces externos. Esto evita mantener dos rutas para la misma experiencia.

## Flujo de procesamiento

El frontend no debe saltarse pasos ni ejecutar IA antes de que exista texto extraido.

Flujo al subir desde `/documents`:

1. `POST /documents/upload` con archivo y prioridad.
2. Si `Extraer texto` esta activo, iniciar `POST /documents/{id}/extract-text`.
3. Si el resultado indica `ocr_required`, el backend encola OCR.
4. Si `Pre-revisión IA` esta activa:
   - si la extracción termina en `ready_for_review`, iniciar IA;
   - si se requiere OCR, la IA debe esperar hasta que OCR termine y el documento vuelva a estar listo para revision.
5. El historial y la cola visual se actualizan con el estado actual.

Para evitar depender de que el navegador siga abierto, el backend debe poder recordar que la IA quedo solicitada despues de OCR. Para este cambio se usara una tabla asociada al documento:

- guardar en `document_processing_requests` los criterios individuales seleccionados y el modelo solicitado;
- cuando OCR finalice, si hay solicitud de IA pendiente, encolar `process_document_ai_review`.

## Criterios como plantillas

Los criterios funcionan como plantillas aplicables al analisis.

Tipos:

- Globales: `reviewer_id IS NULL`.
- Individuales: `reviewer_id = current_user.id`.

Reglas:

- Los criterios globales activos siempre se aplican.
- Los criterios individuales activos se aplican solo si el usuario los selecciona en `/documents`.
- Si no se selecciona ningun criterio individual, se aplican solo los globales.
- Si se seleccionan X + Y, se aplican globales + X + Y.
- El backend debe validar que cada criterio seleccionado pertenece al usuario actual y esta activo.
- No se deben aceptar criterios individuales de otro revisor.
- Los criterios desactivados no se aplican.

Contrato recomendado para IA:

```json
{
  "model_name": "qwen3.5:9b",
  "criterion_ids": ["uuid-criterio-individual"]
}
```

El servicio de IA debe resolver internamente:

```text
criterios = globales activos + criterios individuales seleccionados validos
```

## Prioridad real

La prioridad sirve como referencia visual para que el revisor sepa que documento atender primero.

Valores permitidos:

```text
baja
media
alta
```

Cambios requeridos:

- Agregar columna `priority` en `documents`, default `media`.
- Exponer `priority` en `DocumentResponse`.
- Aceptar `priority` en `POST /documents/upload`.
- Mostrar prioridad en historial de `/documents`.
- Mostrar prioridad en el encabezado del workspace `/documents/[id]`.

La prioridad no cambia automaticamente el orden de Redis/RQ en este alcance. Puede usarse para ordenar visualmente el historial si no rompe el orden actual.

## Backend

### Documentos

Actualizar:

- modelo SQLAlchemy `Document`,
- schema Pydantic V2 `DocumentResponse`,
- endpoint `POST /documents/upload`,
- migracion Supabase.

El upload debe aceptar `priority` como campo multipart opcional y normalizarlo a `baja`, `media` o `alta`.

### IA

Actualizar `AIReviewRequest` para aceptar `criterion_ids`.

Actualizar `trigger_ai_review` para:

- validar documento,
- validar criterios individuales seleccionados,
- registrar en auditoria el modelo y criterios seleccionados,
- encolar `process_document_ai_review(document_id, model_name, criterion_ids)` si el documento ya esta listo;
- guardar una solicitud pendiente y devolver estado `pending_ocr` si el documento esta en `ocr_required` u `ocr_processing`.

Si el documento sigue en `uploaded` y no tiene chunks, el endpoint debe responder error de conflicto indicando que primero se requiere extraccion de texto. En la UI esto no deberia ocurrir porque seleccionar IA activa extraccion automaticamente.

Actualizar `process_document_ai_review` para aplicar:

- criterios globales activos,
- criterios individuales seleccionados y validados.

Si no hay criterios aplicables, el documento puede marcarse `ai_review_done` sin resultados.

### OCR y continuidad de IA

Como OCR ya se dispara desde extracción, el cambio debe respetar esa integracion.

Si se solicita IA y el documento requiere OCR, el sistema debe conservar la solicitud para correr IA despues de OCR. La opcion recomendada es una tabla pequeña `document_processing_requests` o columnas acotadas en `documents`.

Para mantener bajo el alcance, se prefiere tabla:

- `document_id`,
- `requested_ai`,
- `model_name`,
- `selected_criterion_ids`,
- `created_by`,
- `created_at`,
- `updated_at`.

Esto evita sobrecargar `documents` con JSON de configuracion temporal.

## Frontend

### `DocumentUploadClient`

Debe incorporar estado real para:

- `extractText`,
- `autoOcr`,
- `runAiReview`,
- `selectedModel`,
- `selectedIndividualCriterionIds`.

Debe cargar criterios con `GET /criteria`:

- globales activos se muestran como "Siempre aplicados";
- individuales activos se muestran con checkboxes.

El boton de carga debe:

- subir archivo con prioridad,
- ejecutar el plan seleccionado,
- mostrar estados por paso en `Archivos en cola`,
- recargar historial al terminar cada transicion importante.

### Workspace

Unificar la logica duplicada de `/documents/[id]` y `/documents/[id]/review`.

El workspace debe mantener:

- `PDFViewer` con `highlightText`, `highlightStatus`, `allEvidences`;
- `AIReviewChecklist` con `onResultsLoaded`;
- extracción/chunks;
- dictamen humano.

Los enlaces desde historial deben abrir `/documents/{id}`.

## Errores y estados

- Si upload falla, no ejecutar pasos posteriores.
- Si extracción falla, no ejecutar IA.
- Si extracción devuelve `ocr_required`, mostrar que OCR quedo en cola.
- Si IA falla, mostrar error y conservar el documento en historial.
- Si no hay criterios globales ni individuales seleccionados, advertir antes de lanzar IA o permitir que backend marque `ai_review_done` sin resultados.
- `Notificar revisor` debe quedar deshabilitado con etiqueta pendiente.

## Seguridad

- Todos los endpoints nuevos o modificados deben usar `get_current_user`.
- `GET /documents/{id}/ai-review-results` debe protegerse con autenticacion igual que el resto de documentos.
- La validacion de criterios seleccionados debe impedir acceso a plantillas de otro revisor.
- No se agregan APIs externas ni servicios de pago.

## Pruebas y verificacion

Backend:

- migracion aplica correctamente;
- upload acepta prioridad y devuelve prioridad;
- `review-ai` acepta criterios seleccionados;
- criterios globales se aplican siempre;
- criterios individuales de otro usuario son rechazados;
- endpoint de resultados IA requiere autenticacion.

Frontend:

- `/documents` carga criterios y documentos;
- al subir con solo carga, el documento queda `uploaded`;
- al subir con extracción, se llama `extract-text`;
- al subir con extracción + IA, se respeta la secuencia;
- los links del historial abren `/documents/[id]`;
- el workspace conserva resaltado por evidencia y dictamen.

Verificacion visual:

- probar `/documents` en desktop y mobile;
- probar `/documents/[id]` con PDF y evidencia IA;
- confirmar que texto de botones y badges no se sobrepone.

## Fuera de alcance

- Notificaciones reales a revisores.
- Ordenamiento real de RQ por prioridad.
- Asignacion automatica de revisor.
- Nuevos modelos Ollama o cambios al contrato JSON de resultado IA.
- RAG, ChromaDB o embeddings.
