# CURRENT.md

## Paso Actual del Plan de Desarrollo

**Paso 3** - Funcionalidades core completadas

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
- [ ] Reportes con puntos y guías
- [ ] Offline/PWA e idempotencia de sincronización

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
- `/admin/empresas` - Crear empresa + usuario admin automático
- `/admin/tipos-servicio` - Catálogo de tipos de servicio por empresa
- `/admin/asignaciones` - Asignar chofer+camión a servicio
- `/admin/reportes` - Reportes con tabs: Informes (PDF/CSV rutas terminadas), Resumen Diario (PDF/CSV), Valorizador KM (PDF/CSV)
- `/admin/valorizador` - Gestión del valorizador de kilometraje (CRUD + historial de cambios)
- `/admin/usuarios` - Consulta de usuarios activos de la empresa
- `/chofer/registro` - Registro de viajes (mobile)
- `/chofer/historial` - Historial de viajes
- `/cliente/servicios` - Portal cliente: servicios y rutas expandibles
- `/cliente/informes` - Informes PDF/CSV de rutas terminadas
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
2. **Registrar puntos** → retiro/entrega con nombre autocompletado, odómetro de llegada y **foto de guía obligatoria** (bucket `guias`).
3. **Cerrar ruta** → acción separada del último punto: odómetro de término obligatorio (puede superar al último punto), foto de odómetro opcional.
4. **Correcciones** → editar o anular puntos exige `motivo`; queda registro en `viaje_punto_historial`. Editar la ruta deja registro en `viaje_historial`.

Reglas:
- `viajes.fecha` es la fecha de inicio; si la ruta cruza medianoche, todos los puntos mantienen esa fecha.
- Solo puede existir una ruta `en_curso` por camión y por chofer.
- Se permiten varias rutas secuenciales por camión/día.
- Puntos anulados no se muestran al chofer/cliente y se excluyen de reportes.

## APIs Implementadas

- `POST /api/viajes/iniciar` - Inicia el día (km inicio + foto km)
- `GET /api/viajes/hoy` - Obtiene viaje activo del día
- `PUT /api/viajes/[id]/terminar` - Termina el día (km término + foto + gastos en lote)
- `PUT /api/viajes/[id]` - Edita km inicio/término, observaciones y fotos de km
- `POST /api/gastos` - Registra gastos de un viaje
- `PATCH /api/gastos/[id]` - Edita un gasto (tipo, monto, descripción, foto)
- `DELETE /api/gastos/[id]` - Elimina un gasto
- `GET /api/viajes/[id]/puntos` - Lista puntos de una ruta (`incluir_anulados=true` para admin)
- `POST /api/viajes/[id]/puntos` - Crea un punto (foto de guía obligatoria, odómetro validado)
- `PUT /api/viajes/[id]/puntos/[puntoId]` - Edita un punto (motivo obligatorio, auditoría)
- `DELETE /api/viajes/[id]/puntos/[puntoId]` - Anula un punto (motivo obligatorio, auditoría)
- `GET /api/puntos/sugerencias` - Autocompletado de puntos por cliente (normalizado)
- `GET /api/tipos-servicio` / `POST /api/tipos-servicio` - Catálogo de tipos de servicio
- `PUT /api/tipos-servicio/[id]` / `DELETE /api/tipos-servicio/[id]` - Edición/desactivación lógica
- `POST /api/upload` - Upload de fotos (buckets: `gastos`, `km-fotos`, `guias`)
- `GET /api/cliente/servicios` - Servicios y rutas del cliente logueado (vía `cliente_usuarios`, gastos filtrados solo a `peaje`)
- `GET /api/cliente/informes` - Informe de rutas terminadas del cliente en un periodo (solo gastos `peaje`)
- `GET /api/admin/informes` - Informe de rutas terminadas de la empresa en un periodo (todos los gastos + URLs de imágenes km/gastos)
- `GET /api/admin/usuarios` - Usuarios (cuentas de login) de la empresa, con filtro por activos/rol
- `GET /api/admin/resumen-diario` - Resumen diario de la empresa (fecha, km, valor km, valor total, peajes, petróleo, otros)
- `GET /api/cliente/resumen-diario` - Resumen diario del cliente (fecha, km, peajes)
- `GET/POST/PUT/DELETE /api/admin/valorizador` - CRUD de valorizaciones de km (con auditoría en `valor_km_historial`)
- `GET /api/admin/valorizador/historial` - Historial de cambios del valorizador
- `POST /api/clientes/[id]/usuarios` - Agregar usuario a un cliente
- `DELETE /api/clientes/[id]/usuarios/[usuarioId]` - Quitar usuario de un cliente
- `GET /s/[bucket]/[file]` - Redirect a la imagen real en Supabase Storage (URL corta de respaldos)

## Deploy

- **URL**: https://nxrutas.devnx-trans.workers.dev
- **Plataforma**: Cloudflare Workers (vinext)
- **Repo**: https://github.com/rodrigoNXCL/rutasnx

## Último Cambio

**Fase 1-2 de tipos de servicio y flujo por puntos.** Catálogo `tipos_servicio` por empresa (`reparto` simple / `fruta` puntos), servicios y viajes con snapshot de tipo y cliente, y soporte de múltiples rutas por camión/día (una sola abierta por camión/chofer). Se agregaron puntos de viaje con foto de guía obligatoria, odómetro absoluto, anulación lógica y auditoría (`viaje_punto_historial`, `viaje_historial`), bucket público `guias`, y APIs de puntos/autocompletado. La UI del chofer ya distingue el flujo `puntos`: registra puntos con autocompletado, foto de guía y odómetro; permite corregir/anular con motivo; y el cierre de ruta es una acción separada con odómetro final y foto opcional. `GET /api/viajes/hoy` ahora busca la ruta abierta sin filtrar por fecha (soporte cruce de medianoche) y `GET /api/viajes/fecha` devuelve `viajes[]` manteniendo `viaje` por compatibilidad. **Bug resuelto (2026-11-06)**: el punto no se guardaba porque `PuntosRuta` se renderizaba dentro del formulario de cierre de ruta (formularios HTML anidados), lo que además disparaba `terminarDia` y mostraba un error confuso. Se sacó `PuntosRuta` del formulario de cierre. También el `orden` del nuevo punto se calcula ahora sobre el máximo histórico (incluyendo anulados), evitando colisiones con `UNIQUE(viaje_id, orden)`. Se corrigió `/admin/empresas` (estado `telefono` faltante y `GET` de empresas) y el tipado del filtro `estado` en `/api/admin/viajes`. Además, el admin ahora puede **agregar o quitar acceso al portal desde la edición del cliente**: el acceso se gestiona vía `cliente_usuarios`, se puede revocar el usuario principal (limpiando `clientes.usuario_id`) y al re-agregar un email existente se reactiva y re-vincula la cuenta sin duplicarla. Pendiente: reportes con puntos y guías, offline/PWA e idempotencia de sincronización, portal cliente con puntos y restringir `/admin/empresas` a superadmin.

Anterior: El **Resumen Diario** quedó integrado dentro de **Reportes** (tabs: Informes / Resumen Diario / Valorizador KM). Nuevo **Valorizador de Kilometraje** (`/admin/valorizador`): el admin asigna un valor por km para un rango de fechas (con validación de solapamiento), queda guardado y se lista en un informe PDF/CSV dentro de Reportes; cada creación/modificación/eliminación queda registrada en `valor_km_historial` (auditoría). El tab **Valorizador KM** muestra el resumen diario **valorizado**: km del día × valor por km aplicable a la fecha, con totalización de la columna valor total. Nuevo soporte **multi-usuario por cliente** (tabla `cliente_usuarios`): se pueden asociar varios logins a un cliente y todos acceden a la info asociada; la gestión se hace desde Clientes → "N usuarios". Los APIs de cliente ahora resuelven el cliente vía `cliente_usuarios`. Informes de rutas terminadas en PDF/CSV para cliente (`/cliente/informes`) y admin (tab Informes). El informe del admin incluye **URLs de imágenes** (km inicio/término y comprobantes) y el **detalle completo de gastos** (todos los tipos); el del cliente solo gastos `peaje`. Las URLs de los respaldos se entregan **acortadas** (`/s/{bucket}/{file}`, redirect al storage) para no ocupar espacio en el PDF/CSV y permitir descargar cada respaldo. Antes del detalle de gastos y evidencias, el PDF muestra un bloque de **totales** (rutas, km recorridos y gastos). Se agrega en admin la **consulta de usuarios activos** (`/admin/usuarios`). Se resuelve toda la deuda de tipos TypeScript (fix del `never` en `types/database.ts` con `Relationships` y esquema real).

Actualización: el cliente ve solo gastos de tipo `peaje`; el chofer puede editar rutas terminadas (km, observaciones, fotos y CRUD de gastos).

## Bloqueos

Ninguno activo.
