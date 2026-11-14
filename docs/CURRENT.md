# CURRENT.md

## Paso Actual del Plan de Desarrollo

**Paso 4** - v2.6 desplegada: puntos multiarchivo, local-first y confiabilidad de sincronización (2026-11-09)

## Estado General

- [x] Estructura de directorios creada
- [x] Tipos TypeScript definidos v2.0
- [x] Auth propia implementada (`src/lib/auth.ts`)
- [x] Middleware actualizado para 4 roles
- [x] SQL v2.0 ejecutado en Supabase
- [x] Asignaciones table creada y funcional
- [x] Superadmin: dashboard, empresas CRUD, admin management
- [x] Admin: CRUD camiones, choferes, clientes, servicios, asignaciones
- [x] Chofer: registro de viajes, historial, gastos con foto
- [x] Cliente: portal con servicios y rutas en detalle
- [x] Landing page pública en `/`
- [x] Diseño UI Linear dark en todos los módulos
- [x] Deploy en Cloudflare Workers (nxrutas.devnx-trans.workers.dev)
- [x] Informes PDF/CSV en portal cliente y admin (rutas terminadas)
- [x] Resumen diario PDF/CSV en portal cliente y admin (dentro de Reportes)
- [x] Valorizador de kilometraje (admin, con historial de cambios)
- [x] Admin: consulta de usuarios activos
- [x] Multi-usuario por cliente (varios logins por cliente)
- [x] Tipos de servicio por empresa (`reparto`/`fruta`) y soporte multi-ruta por camión/día
- [x] Catálogo admin de tipos de servicio (`/admin/tipos-servicio`)
- [x] BD Fase 2: puntos de viaje, historiales de auditoría y bucket `guias`
- [x] APIs base de puntos: alta, edición con motivo, anulación con motivo y autocompletado
- [x] UI chofer para flujo `puntos` (registro, corrección y anulación con motivo)
- [x] Cierre de ruta con odómetro final y evidencia opcional
- [x] UI admin para editar rutas/puntos (`/admin/rutas`)
- [x] Creación de empresa + admin desde dashboard (`/admin/empresas`)
- [x] Bug de guardado/render de puntos resuelto (formularios anidados y orden único)
- [x] Informe de puntos y guías para cliente (PDF/CSV por fecha, camión y chofer)
- [x] Reportes con puntos y guías en admin (tab "Puntos y Guías")
- [x] Portal cliente con puntos y guías en el detalle de ruta
- [x] Restringir `/admin/empresas` a superadmin
- [x] Offline/PWA e idempotencia de sincronización
- [x] Aplicar índice `idx_viajes_cliente_estado_fecha` en Supabase
- [x] Limpiar errores tsc preexistentes (`validator.ts`, `vite.config.ts`)
- [x] Suite de pruebas automatizadas (Vitest)
- [x] Puntos con múltiples imágenes/documentos (hasta 5, PDF incluido, cámara/galería)
- [x] Registro local-first y aviso de conexión lenta en puntos
- [x] Rol `subadmin` por empresa con acceso solo a rutas/reportes de camiones asignados
- [x] Chofer puede operar varios camiones (selector al iniciar, validado contra asignaciones)

## Registro de Avance

| Fecha | Hito | Estado | Evidencia |
|-------|------|--------|-----------|
| 2026-11-09 | Puntos con hasta 5 imágenes/documentos (JPG/PNG/WEBP/PDF) | Desplegado | Commit `59962d6`; bucket `guias` con PDF |
| 2026-11-09 | Registro local-first, timeout 8 s, aviso de red lenta, reintento y descarte | Desplegado | Commit `59962d6` |
| 2026-11-09 | Informes admin/cliente, CSV y PDF muestran todos los archivos | Desplegado | Commit `59962d6` |
| 2026-11-09 | Migración `20261109_puntos_multiarchivo` aplicada y verificada | Completado | Columnas `archivos` y `archivos_anterior/nuevo`; PDF en `guias` |
| 2026-11-09 | Ruta incorrecta 09/11/2026 eliminada | Completado | `viaje_id=580a5b1b-456e-4c6f-af10-cf6a0ca7a118`; foto de odómetro eliminada (HTTP 400) |
| 2026-11-09 | Eliminación del registro de ruta re-creado 09/11/2026 | Completado | `viaje_id=7cdfe962-dd47-4367-80b0-1526a66a25d9`; sin puntos/gastos/historial |
| 2026-11-09 | Build y despliegue v2.6 en Cloudflare Workers | Completado | Version ID `c71c3c91-244f-4ac6-98d1-f4d2ffe3aca7`; commit docs `d7168fc` |
| 2026-11-09 | Corrección: evidencia opcional en inicio de ruta y puntos | Desplegado | Version ID `66679f46-7144-47c7-beb5-2a4dc3f9181e` |
| 2026-11-09 | Corrección: subida de archivos offline (cámara/múltiples) timeout 8 s → 20 s | Desplegada | Version ID `f645b10b-fddd-4cad-ab84-6d5c3acc51bf` |
| 2026-11-09 | Corrección: informe cliente simple (archivos inline por punto, sin tabla aparte) | Desplegada | Version ID `a6d28d1b-022a-42bc-8a57-82c55a6bc46c` |
| 2026-11-09 | Cliente sin gastos/peajes: APIs y UI limpiadas (servicios, informes, resumen diario) | Desplegada | Version ID `f80eb7c4-80a7-4c2b-a719-5f347b815603` |
| 2026-11-10 | Subadmin por empresa: rol + `subadmin_camiones` y filtro por camiones en APIs admin | Desplegada | Version ID `600565a7-d294-4b57-ab73-337952eab1a5`; aplicar migración `20261110_subadmin` en Supabase |
| 2026-11-10 | Chofer multi-camión: selección de asignación al iniciar y validación de camión asignado | Desplegada | Version ID `600565a7-d294-4b57-ab73-337952eab1a5` |
| 2026-11-14 | Correcciones: acceso de chofer, subadmin solo lectura, 401/403, dedupe/selector de camión | Desplegada | Version ID `95cffdcf-f90c-4e39-bbf7-425c9fb2154f` |
| 2026-11-06 | PWA offline, sincronización idempotente y cierre de informes | Completado | Commit `b2b8e87` |
| 2026-11-08 | Fix spinner infinito en `/chofer/registro` | Completado | Commit `13fa608` |

## Guardrails (No Retroceder)

- No eliminar `viaje_puntos.archivos` ni `viaje_punto_historial.archivos_anterior/nuevo`: la migración ya está aplicada y las APIs/informes dependen de esas columnas.
- Mantener `foto_guia_url` como imagen principal y seguir poblándola; es el fallback de compatibilidad para informes, CSV y vistas antiguas.
- La evidencia es opcional: si se adjunta, el punto admite hasta 5 archivos (JPG/PNG/WEBP/PDF) con máximo 5 MB y PDF solo en el bucket `guias`; si no se adjunta, se guarda sin evidencia. No reintroducir la obligación de adjuntar.
- Mantener el flujo local-first de puntos: guardar en IndexedDB, mostrar "Pendiente", sincronizar por UUID idempotente, timeout de 8 s para la sincronización del punto y timeout de subida de archivos de 20 s (`UPLOAD_ARCHIVOS_TIMEOUT_MS`) y opción "Descartar".
- Los informes admin/cliente, CSV y PDF deben listar todos los archivos de `archivos`, no solo `foto_guia_url`.
- No recrear la ruta `580a5b1b-456e-4c6f-af10-cf6a0ca7a118` ni la foto `km-fotos/1794222187565-ttwcqkc53ok.jpg`.
- Mantener `/api/upload` con subida múltiple y el bucket `guias` con `application/pdf` permitido.
- Antes de desplegar: `npx tsc --noEmit`, `npm test` (21 pruebas) y `npm run build`; para Cloudflare, `npm run build:vinext` y `npm run deploy:prod`.
- El subadmin solo accede a Dashboard, Rutas y Reportes; las APIs de lectura filtran por `subadmin_camiones`. No exponer endpoints de gestión a subadmin.
- El subadmin **sí ve los gastos** de sus camiones (es personal de la empresa, no del cliente); los informes/resumen usan las APIs de admin filtradas por camiones. No aplicar la restricción de gastos del cliente.
- El chofer solo puede iniciar ruta con un camión que tenga asignación activa (`asignaciones`); no permitir camiones arbitrarios.

## Estructura de Rutas Implementada

- `/` - Landing page pública (NXChile info, links a soluciones)
- `/auth/login` - Login (público)
- `/superadmin/dashboard` - Gestión de empresas
- `/superadmin/empresas` - CRUD empresas
- `/admin/dashboard` - Dashboard empresa
- `/admin/camiones` - CRUD camiones
- `/admin/choferes` - CRUD choferes
- `/admin/clientes` - CRUD clientes
- `/admin/servicios` - CRUD servicios
- `/admin/rutas` - Rutas y puntos (filtros, detalle y corrección/anulación)
- `/admin/empresas` - Crear empresa + usuario admin automático (solo superadmin)
- `/admin/tipos-servicio` - Catálogo de tipos de servicio por empresa
- `/admin/asignaciones` - Asignar chofer+camión a servicio
- `/admin/reportes` - Reportes con tabs: Informes (PDF/CSV rutas terminadas), Resumen Diario (PDF/CSV), Valorizador KM (PDF/CSV), Puntos y Guías (PDF/CSV)
- `/admin/valorizador` - Gestión del valorizador de kilometraje (CRUD + historial de cambios)
- `/admin/usuarios` - Consulta de usuarios activos de la empresa
- `/chofer/registro` - Registro de viajes (mobile)
- `/chofer/historial` - Historial de viajes
- `/cliente/servicios` - Portal cliente: servicios y rutas expandibles
- `/cliente/informes` - Informes PDF/CSV de rutas terminadas
- `/cliente/informes/puntos` - Informe PDF/CSV de rutas por puntos y guías (fecha, camión, chofer)
- `/cliente/resumen` - Resumen diario PDF/CSV (fecha, km, peajes)

## Modelo de Asignaciones

El admin asigna **un chofer + camión a un servicio** de forma permanente.

Tabla `asignaciones`:
- `chofer_id` → chofer asignado
- `camion_id` → camión asignado
- `servicio_id` → servicio a atender
- `activo` → true/false para activar/pausar
- `observaciones` → notas del admin

## Flujo Chofer (v2)

El chofer trabaja con un flujo de **Iniciar/Terminar Día**:

1. **Iniciar Día** → Ingresa km inicio + foto del cuenta km (bucket `km-fotos`)
2. **Durante el día** → Registra gastos (combustible, peaje, comida, mecánico, otro) con foto de comprobante (bucket `gastos`)
3. **Terminar Día** → Ingresa km término + foto de respaldo del cuenta km (bucket `km-fotos`)
4. **Editar ruta** (historial) → El chofer puede modificar km inicio/término, observaciones, fotos de km y **gestionar gastos** (agregar, editar, eliminar) con comprobantes, en rutas terminadas

Tabla `viajes` actualizada:
- `foto_km_inicio` → URL de la foto al iniciar
- `foto_km_termino` → URL de la foto al cerrar
- `estado` → 'en_curso' | 'terminado'

Portal cliente: el mandante ve **solo gastos tipo `peaje`** de sus rutas; el resto de tipos queda interno.

### Flujo por puntos (tipo de servicio `fruta`)

1. **Iniciar ruta** → odómetro inicial + foto (opcional según tipo).
2. **Registrar puntos** → retiro/entrega con nombre autocompletado, odómetro de llegada y **evidencia opcional** (hasta 5 imágenes/documentos, incluido PDF, desde cámara, galería o memoria; bucket `guias`).
3. **Cerrar ruta** → acción separada del último punto: odómetro de término obligatorio (puede superar al último punto), foto de odómetro opcional.
4. **Correcciones** → editar o anular puntos exige `motivo`; queda registro en `viaje_punto_historial`. Editar la ruta deja registro en `viaje_historial`.

Reglas:
- `viajes.fecha` es la fecha de inicio; si la ruta cruza medianoche, todos los puntos mantienen esa fecha.
- Solo puede existir una ruta `en_curso` por camión y por chofer.
- Se permiten varias rutas secuenciales por camión/día.
- Puntos anulados no se muestran al chofer/cliente y se excluyen de reportes.

### PWA y captura offline (chofer)

- `manifest.webmanifest` + service worker (`/sw.js`) cachean el shell de `/chofer` y los assets estáticos.
- Los puntos se pueden registrar sin conexión: los archivos y datos se guardan en IndexedDB (`rutasnx-offline`).
- El registro es **local-first**: al agregar un punto se guarda primero en el dispositivo y se muestra de inmediato; la sincronización ocurre en segundo plano.
- Se detecta conexión lenta con `navigator.onLine`/`navigator.connection` y un timeout de subida de archivos de 20 s (sincronización de punto de 8 s). Si la red es lenta o falla, se avisa que el punto quedó en el dispositivo y se puede reintentar con "Sincronizar".
- Al recuperar conexión (o al presionar "Sincronizar"), se suben los archivos en una sola petición y se hace `POST` con el mismo `id` (UUID), por lo que los reintentos son idempotentes.
- El punto pendiente se muestra en la lista con badge "Pendiente"; se advierte sincronizar antes de cerrar la ruta y se puede "Descartar" si no se enviará.
- La ruta activa se cachea en `localStorage` (`rutasnx:viaje-activo`) y la lista de puntos sincronizados en `rutasnx:puntos:{viajeId}` para mantener el último odómetro visible offline.

## APIs Implementadas

- `POST /api/viajes/iniciar` - Inicia el día (km inicio + foto km)
- `GET /api/viajes/hoy` - Obtiene viaje activo del día
- `PUT /api/viajes/[id]/terminar` - Termina el día (km término + foto + gastos en lote)
- `PUT /api/viajes/[id]` - Edita km inicio/término, observaciones y fotos de km
- `POST /api/gastos` - Registra gastos de un viaje
- `PATCH /api/gastos/[id]` - Edita un gasto (tipo, monto, descripción, foto)
- `DELETE /api/gastos/[id]` - Elimina un gasto
- `GET /api/viajes/[id]/puntos` - Lista puntos de una ruta (`incluir_anulados=true` para admin)
- `POST /api/viajes/[id]/puntos` - Crea un punto (evidencia opcional, odómetro validado, hasta 5 archivos en `archivos`; acepta `id` de cliente para reintentos idempotentes y `captured_at`)
- `PUT /api/viajes/[id]/puntos/[puntoId]` - Edita un punto (motivo obligatorio, auditoría de `archivos_anterior/nuevo`)
- `DELETE /api/viajes/[id]/puntos/[puntoId]` - Anula un punto (motivo obligatorio, auditoría)
- `GET /api/puntos/sugerencias` - Autocompletado de puntos por cliente (normalizado)
- `GET /api/tipos-servicio` / `POST /api/tipos-servicio` - Catálogo de tipos de servicio
- `PUT /api/tipos-servicio/[id]` / `DELETE /api/tipos-servicio/[id]` - Edición/desactivación lógica
- `POST /api/upload` - Upload de fotos y documentos (hasta 5 archivos; PDF solo en bucket `guias`)
- `GET /api/cliente/servicios` - Servicios y rutas del cliente logueado (vía `cliente_usuarios`, gastos filtrados solo a `peaje`, incluye puntos y guías de rutas por puntos)
- `GET /api/cliente/informes` - Informe de rutas terminadas del cliente en un periodo (solo gastos `peaje`)
- `GET /api/cliente/informes/puntos` - Informe de rutas por puntos del cliente (fecha, camión, chofer, puntos y guías)
- `GET /api/admin/informes` - Informe de rutas terminadas de la empresa en un periodo (todos los gastos + URLs de imágenes km/gastos)
- `GET /api/admin/informes/puntos` - Informe de puntos y guías de la empresa (filtros cliente/servicio/camión/chofer)
- `GET /api/admin/usuarios` - Usuarios (cuentas de login) de la empresa, con filtro por activos/rol
- `GET/POST /api/admin/empresas` - Lista/crea empresas (solo `superadmin`)
- `GET /api/admin/resumen-diario` - Resumen diario de la empresa (fecha, km, valor km, valor total, peajes, petróleo, otros)
- `GET /api/cliente/resumen-diario` - Resumen diario del cliente (fecha, km, peajes)
- `GET/POST/PUT/DELETE /api/admin/valorizador` - CRUD de valorizaciones de km (con auditoría en `valor_km_historial`)
- `GET /api/admin/valorizador/historial` - Historial de cambios del valorizador
- `POST /api/clientes/[id]/usuarios` - Agregar usuario a un cliente
- `DELETE /api/clientes/[id]/usuarios/[usuarioId]` - Quitar usuario de un cliente
- `GET/POST /api/admin/subadmins` - Lista/crea subadmins de la empresa (solo admin)
- `PUT /api/admin/subadmins/[id]/camiones` - Asigna camiones a un subadmin (solo admin)
- `GET /s/[bucket]/[file]` - Redirect a la imagen real en Supabase Storage (URL corta de respaldos)

## Deploy

- **URL**: https://nxrutas.devnx-trans.workers.dev
- **Plataforma**: Cloudflare Workers (vinext)
- **Repo**: https://github.com/rodrigoNXCL/rutasnx
- **Último deploy**: 2026-11-14, Version ID `95cffdcf-f90c-4e39-bbf7-425c9fb2154f` (acceso de chofer, subadmin solo lectura, 401/403 y selector de camión)

## Historial de Cambios

Los hitos recientes y el estado vigente están en **Registro de Avance** (arriba). Esta sección conserva el detalle de las implementaciones anteriores.

**Fase 1-2 de tipos de servicio y flujo por puntos.** Catálogo `tipos_servicio` por empresa (`reparto` simple / `fruta` puntos), servicios y viajes con snapshot de tipo y cliente, y soporte de múltiples rutas por camión/día (una sola abierta por camión/chofer). Se agregaron puntos de viaje con foto de guía obligatoria, odómetro absoluto, anulación lógica y auditoría (`viaje_punto_historial`, `viaje_historial`), bucket público `guias`, y APIs de puntos/autocompletado. La UI del chofer ya distingue el flujo `puntos`: registra puntos con autocompletado, foto de guía y odómetro; permite corregir/anular con motivo; y el cierre de ruta es una acción separada con odómetro final y foto opcional. `GET /api/viajes/hoy` ahora busca la ruta abierta sin filtrar por fecha (soporte cruce de medianoche) y `GET /api/viajes/fecha` devuelve `viajes[]` manteniendo `viaje` por compatibilidad. **Bug resuelto (2026-11-06)**: el punto no se guardaba porque `PuntosRuta` se renderizaba dentro del formulario de cierre de ruta (formularios HTML anidados), lo que además disparaba `terminarDia` y mostraba un error confuso. Se sacó `PuntosRuta` del formulario de cierre. También el `orden` del nuevo punto se calcula ahora sobre el máximo histórico (incluyendo anulados), evitando colisiones con `UNIQUE(viaje_id, orden)`. Se corrigió `/admin/empresas` (estado `telefono` faltante y `GET` de empresas) y el tipado del filtro `estado` en `/api/admin/viajes`. Además, el admin ahora puede **agregar o quitar acceso al portal desde la edición del cliente**: el acceso se gestiona vía `cliente_usuarios`, se puede revocar el usuario principal (limpiando `clientes.usuario_id`) y al re-agregar un email existente se reactiva y re-vincula la cuenta sin duplicarla. Se agregó el **informe de puntos y guías para el cliente** (`/cliente/informes/puntos`): filtros por rango de fechas, camión y chofer aplicados en la consulta (y opciones en una consulta liviana separada para soportar temporadas con muchos registros); tabla por punto con km inicio, punto, km del punto, km final, total del día y enlace a cada guía; orden por **patente y fecha**; exportación PDF (tabla + apéndice de enlaces clickeables) y CSV; solo rutas cerradas y puntos vigentes, con aviso visible de que las rutas en tránsito no se muestran hasta que el chofer las cierre. En ese momento quedaron pendientes: reportes con puntos y guías en admin, offline/PWA e idempotencia de sincronización, portal cliente con puntos y restringir `/admin/empresas` a superadmin.

**Cierre de pendientes (2026-11-06)**: se agregó el informe de puntos y guías en admin (tab "Puntos y Guías", filtros cliente/servicio/camión/chofer, PDF/CSV), el detalle de puntos y guías en el portal cliente, y se restringió `/admin/empresas` a `superadmin` (API 403 y link oculto). Se implementó PWA + captura offline de puntos con IndexedDB, sincronización idempotente por UUID al reconectar, caché de la ruta activa y aviso de pendientes. Se agregó el índice `idx_viajes_cliente_estado_fecha`, se limpiaron los errores de `tsc` y se incorporó Vitest con pruebas de CSV, fechas, RUT y valorizador. Validación: `npx tsc --noEmit`, `npm test` (13 pruebas) y `npm run build` OK.

**Puntos multiarchivo y conexión lenta (2026-11-09)**: los puntos ahora aceptan hasta 5 imágenes/documentos por registro (JPG, PNG, WEBP y PDF), seleccionables desde cámara, galería o memoria; se mantiene `foto_guia_url` como imagen principal y se agrega `archivos` JSONB con `{url, nombre, tipo}` en `viaje_puntos`, más `archivos_anterior/nuevo` en `viaje_punto_historial`. El bucket `guias` acepta PDF y `/api/upload` sube múltiples archivos en una sola petición. La captura del chofer pasó a un flujo **local-first**: guarda el punto en IndexedDB al instante, muestra badge "Pendiente" y sincroniza en segundo plano; detecta red lenta con `navigator.connection` + timeout de 8 s, avisa que quedó local y permite reintentar o descartar. Los informes admin/cliente, CSV y PDF muestran todos los archivos. Se eliminó la ruta `580a5b1b-456e-4c6f-af10-cf6a0ca7a118` (09/11/2026) por fecha incorrecta; no tenía puntos, gastos ni historial, y se borró su foto de odómetro. La migración `supabase/migrations/20261109_puntos_multiarchivo.sql` quedó aplicada en Supabase (columnas `archivos`, historial y PDF en bucket `guias` verificados) y la versión fue desplegada en Cloudflare Workers (`https://nxrutas.devnx-trans.workers.dev`). Validación: `npx tsc --noEmit`, `npm test` (21 pruebas), `npm run build`, `npm run build:vinext` y `npm run deploy:prod` OK. Corrección posterior: la evidencia (fotos/documentos) quedó como **opcional**; iniciar ruta y registrar puntos ya no exigen adjuntar archivo, aunque se mantienen validaciones y límites (máx. 5 archivos, 5 MB, PDF solo en `guias`) cuando se adjuta. Se eliminó el registro de ruta re-creado el 09/11/2026 (`viaje_id=7cdfe962-dd47-4367-80b0-1526a66a25d9`, estado `en_curso`) tras la corrección; ese registro no tenía puntos, gastos ni historial. Se desplegó con la corrección (Version ID `b6dc8ea4-8218-45c7-a068-4d45ceaef47f`); el último deploy (con el quito del `required`) es el Version ID `66679f46-7144-47c7-beb5-2a4dc3f9181e`.

Anterior: El **Resumen Diario** quedó integrado dentro de **Reportes** (tabs: Informes / Resumen Diario / Valorizador KM). Nuevo **Valorizador de Kilometraje** (`/admin/valorizador`): el admin asigna un valor por km para un rango de fechas (con validación de solapamiento), queda guardado y se lista en un informe PDF/CSV dentro de Reportes; cada creación/modificación/eliminación queda registrada en `valor_km_historial` (auditoría). El tab **Valorizador KM** muestra el resumen diario **valorizado**: km del día × valor por km aplicable a la fecha, con totalización de la columna valor total. Nuevo soporte **multi-usuario por cliente** (tabla `cliente_usuarios`): se pueden asociar varios logins a un cliente y todos acceden a la info asociada; la gestión se hace desde Clientes → "N usuarios". Los APIs de cliente ahora resuelven el cliente vía `cliente_usuarios`. Informes de rutas terminadas en PDF/CSV para cliente (`/cliente/informes`) y admin (tab Informes). El informe del admin incluye **URLs de imágenes** (km inicio/término y comprobantes) y el **detalle completo de gastos** (todos los tipos); el del cliente solo gastos `peaje`. Las URLs de los respaldos se entregan **acortadas** (`/s/{bucket}/{file}`, redirect al storage) para no ocupar espacio en el PDF/CSV y permitir descargar cada respaldo. Antes del detalle de gastos y evidencias, el PDF muestra un bloque de **totales** (rutas, km recorridos y gastos). Se agrega en admin la **consulta de usuarios activos** (`/admin/usuarios`). Se resuelve toda la deuda de tipos TypeScript (fix del `never` en `types/database.ts` con `Relationships` y esquema real).

Actualización: el cliente ve solo gastos de tipo `peaje`; el chofer puede editar rutas terminadas (km, observaciones, fotos y CRUD de gastos).

## Registro de Incidencias y Correcciones Pendientes

Detalles detectados durante las pruebas (2026-11-14) para corregir de forma ordenada.

| # | Detalle | Archivos | Estado |
|---|---------|----------|--------|
| 1 | Edición de chofer no permitía crear/activar el usuario de acceso. Ahora se puede crear/activar y resetear clave desde la edición (email=RUT). | `src/app/api/choferes/[id]/route.ts`, `src/app/admin/choferes/page.tsx` | Desplegado |
| 2 | Las APIs devolvían 500 en vez de 401/403 al faltar permiso. Se agregó `AuthError` + `errorResponse` en las rutas API. | `src/lib/auth.ts`, `src/lib/api-error.ts`, rutas API | Desplegado |
| 3 | Subadmin veía acciones de escritura en `/admin/rutas`. Ahora la vista es solo lectura (oculta edición y acciones de puntos). | `src/app/admin/rutas/page.tsx`, `src/app/chofer/registro/PuntosRuta.tsx` | Desplegado |
| 4 | No había activar/desactivar subadmin ni reset de clave. Agregado `PATCH /api/admin/subadmins/[id]` + botones en Usuarios. | `src/app/api/admin/subadmins/[id]/route.ts`, `src/app/admin/usuarios/page.tsx` | Desplegado |
| 5 | No se validaba que el servicio correspondiera al camión asignado al iniciar ruta. Ahora se valida camión+servicio. | `src/app/api/viajes/iniciar/route.ts` | Desplegado |
| 6 | Verificar en runtime el informe PDF/CSV con un punto de 2+ archivos: deben verse "Abrir 1", "Abrir 2" (una fila por archivo). | `src/components/InformePuntos.tsx` | Pendiente verificación runtime |
| 7 | Verificar en runtime el subadmin (dashboard/rutas/reportes filtrados por sus camiones, **incluyendo gastos**) y el flujo chofer multi-camión. | — | Pendiente verificación runtime |
| 8 | `/api/cliente/informes` quedó sin uso (la página `/cliente/informes` redirige a puntos y guías): evaluar eliminar o mantener por compatibilidad. | `src/app/api/cliente/informes/route.ts` | Pendiente (decisión) |
| 9 | Bloque "Subadmins" en `/admin/usuarios` sin estado de carga propio. Agregado estado de carga. | `src/app/admin/usuarios/page.tsx` | Desplegado |
| 10 | Tras cada deploy, la PWA puede requerir hard refresh para tomar el nuevo shell/JS. | `public/sw.js` | Nota operativa |
| 11 | `subadmin_camiones` tiene RLS habilitado sin políticas (acceso solo vía service role). Documentar/definir políticas si se usa cliente autenticado. | `supabase/migrations/20261110_subadmin.sql` | Nota |
| 12 | Bucket `guias` es público: evaluar bucket privado con URLs firmadas. | Supabase Storage | Pendiente (decisión) |
| 13 | El chofer veía una patente “repetida” con badge Fruta: la UI mostraba las tarjetas de selección y además un panel del camión seleccionado. Se eliminó el panel duplicado y las tarjetas ahora muestran patente, marca, servicio y tipo; la API deduplica asignaciones idénticas (camión+servicio). | `src/app/chofer/registro/page.tsx`, `src/app/api/chofer/asignacion/route.ts` | Desplegado |

**Criterios confirmados:**
- El **subadmin pertenece a la empresa** (no al cliente): **sí ve los gastos** de sus camiones asignados (informes y resumen diario con todos los tipos de gasto), acotado por `subadmin_camiones`.
- El **cliente** sigue sin ver gastos (solo puntos/guías y resumen de km).

## Pendientes Recomendados (no bloqueantes)

- Prueba runtime en dispositivo real: cámara/galería, 5 archivos, PDF, modo avión y reconexión.
- Evaluar limpieza periódica de archivos huérfanos en Storage (subidas exitosas cuyo `POST` falló).
- Evaluar bucket `guias` privado con URLs firmadas; hoy es público para imágenes y PDFs.

## Bloqueos

Ninguno activo.
