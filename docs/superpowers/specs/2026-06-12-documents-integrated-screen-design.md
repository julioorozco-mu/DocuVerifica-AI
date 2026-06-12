# Diseño: pantalla integrada de documentos

## Contexto

La pantalla nueva `DocumentUploadClient` en `/documents/upload` introduce una experiencia más completa para carga de documentos: área de arrastrar y soltar, configuración visual de carga, cola local y flujo del documento. La pantalla anterior `/documents` mantiene funciones reales necesarias: listado conectado a `GET /documents`, métricas simples y acciones hacia detalle y revisión.

La decisión aprobada es reemplazar la pantalla visible anterior por una pantalla integrada en `/documents`, conservando sus funcionalidades dentro del nuevo diseño. `/documents/upload` debe quedar como alias o redirección hacia `/documents` para no romper enlaces existentes.

## Objetivo

Convertir `/documents` en el centro operativo de documentos para Fase 1:

- iniciar carga de documentos,
- ver el archivo seleccionado antes de subirlo,
- consultar historial real de documentos,
- abrir detalle y revisión de documentos existentes,
- mostrar métricas reales derivadas del listado,
- evitar prometer acciones de OCR, IA, cola Redis o notificaciones antes de que esas fases estén implementadas.

## Alcance funcional

### Funciones que deben quedar activas

- Validar sesión con `GET /auth/me`.
- Subir un archivo con `POST /documents/upload`.
- Aceptar únicamente PDF y DOCX, alineado con el backend actual.
- Mostrar `Archivos en cola` como cola local de archivos seleccionados antes de subir.
- Mostrar `Historial de documentos` con datos reales desde `GET /documents`.
- Calcular métricas de la página desde el listado real:
  - total,
  - subidos,
  - listos para revisión,
  - finalizados,
  - errores.
- Acciones por documento:
  - `Detalle` hacia `/documents/[id]`,
  - `Revisar` hacia `/documents/[id]/review`,
  - descarga o visualización si se mantiene una acción explícita usando los endpoints existentes.
- Actualizar el historial después de una carga exitosa sin forzar navegación innecesaria.

### Funciones que no deben activarse todavía

Estas opciones pueden mostrarse como información de flujo futuro, pero no como controles funcionales activos:

- OCR automático al cargar.
- Extraer texto automáticamente al cargar.
- Ejecutar pre-revisión IA al cargar.
- Notificar al revisor asignado.
- Selección real de criterios a aplicar durante la carga.
- Cola Redis/RQ o estados de procesamiento en background.

Si se conservan visualmente, deben aparecer deshabilitadas o etiquetadas como próximas fases para evitar confusión operativa.

## Estructura de pantalla

La pantalla `/documents` usará el layout institucional actual con `AppSidebar` y `AppHeader`.

La zona principal tendrá dos columnas en desktop:

- Columna principal:
  - tarjeta de carga de documentos,
  - tabla `Archivos en cola`,
  - tabla `Historial de documentos`.
- Columna lateral:
  - configuración/resumen de carga,
  - métricas reales,
  - flujo del documento con estados reales.

En móvil o pantallas estrechas, las columnas se apilan en una sola columna, manteniendo primero carga, luego cola, luego historial.

## Tabla de historial

La tabla nueva reemplaza a la tabla de la pantalla anterior, pero con el estilo claro/institucional de la pantalla nueva.

Columnas recomendadas:

- Documento.
- Tipo.
- Tamaño.
- Fecha de carga.
- Estado.
- Acciones.

Comportamiento:

- Mostrar skeleton o estado de carga mientras se consulta `GET /documents`.
- Mostrar estado vacío cuando no existan documentos.
- Permitir búsqueda por nombre de archivo.
- Permitir filtro por estado como mejora mínima si no complica el alcance.
- Mapear estados técnicos a etiquetas legibles, sin cambiar los valores del backend.

## Endpoints

La pantalla integrada debe usar únicamente endpoints existentes de Fase 1 y los ya presentes en el proyecto:

- `GET /auth/me`.
- `POST /documents/upload`.
- `GET /documents`.
- `GET /documents/{id}` mediante las rutas de detalle existentes.
- `GET /documents/{id}/file` o `GET /documents/{id}/file-data` solo si se agrega acción de descarga o vista.

No se requiere cambiar backend para este diseño inicial.

## Rutas

- `/documents`: pantalla integrada principal.
- `/documents/upload`: alias o redirección a `/documents`.
- El sidebar debe apuntar a `/documents` para la entrada principal de documentos.

La pantalla anterior `DocumentsListClient` puede retirarse de la ruta principal una vez que sus funciones estén migradas. Si se conserva durante transición, no debe ser accesible desde navegación principal.

## Manejo de errores

- Si no hay token, redirigir a login como en el resto de pantallas autenticadas.
- Si falla `GET /auth/me`, cerrar sesión local y redirigir.
- Si falla `GET /documents`, mostrar mensaje recuperable en la tabla de historial.
- Si falla la carga, mostrar el error del backend en la tarjeta de carga.
- Si la carga es exitosa, limpiar archivo seleccionado, refrescar historial y mostrar confirmación breve.

## Rendimiento y React

- Cargar perfil e historial en paralelo cuando sea posible.
- Derivar métricas con `useMemo` desde el arreglo de documentos.
- Evitar duplicar estado derivado.
- Mantener el historial en estado local solo como respuesta de `GET /documents`.
- Evitar redirección post-carga hacia otra pantalla; refrescar en sitio reduce navegación innecesaria.

## Criterios de aceptación

- Al entrar a `/documents`, se ve la nueva pantalla integrada.
- La carga de PDF/DOCX usa `POST /documents/upload`.
- Tras cargar un documento, el historial se actualiza con el documento nuevo.
- La tabla de historial usa `GET /documents`.
- Cada fila permite ir a detalle y revisión.
- `/documents/upload` no muestra una experiencia divergente.
- No hay controles activos que prometan OCR, IA, notificaciones o criterios automáticos en Fase 1.
- El build de Next.js pasa.
- El lint focalizado de los archivos modificados pasa.
