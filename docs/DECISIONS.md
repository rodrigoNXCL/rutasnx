# DECISIONS.md

## Decisiones de Arquitectura v2.0

### Multi-Tenancy
- Cada empresa de transporte es un tenant independiente.
- Todas las tablas tienen `empresa_id` como FK.
- Admin de cada empresa solo ve datos de su empresa.
- Superadmin tiene visión global.

### Auth Propia (sin Supabase Auth)
- Tabla `usuarios` con `email`, `password_hash` (SHA-256).
- Sesiones manejadas con cookie encriptada (AES-256-GCM).
- No依赖 Supabase Auth.

### Modelo de Datos
- Tablas principales: empresas, usuarios, choferes, camiones, clientes, servicios, tipos_servicio, viajes, viaje_puntos, gastos, asignaciones.
- Relaciones: empresa → (usuarios, choferes, camiones, clientes, servicios, tipos_servicio, asignaciones)
- servicios → viajes → (gastos, viaje_puntos)
- asignaciones: chofer+camión asignados a un servicio (relación muchos a muchos)
- Auditoría: viaje_historial y viaje_punto_historial.

### Asignaciones (Modelo de Negocio)
- Admin asigna permanentemente un chofer + camión a un servicio.
- Un servicio puede tener múltiples asignaciones (distintos vehículos/turnos).
- Un chofer puede tener múltiples asignaciones (distintos servicios).
- Campo `activo` para activar/pausar sin eliminar.

### Creación automática de admin
- Al crear una empresa desde el dashboard super‑admin, se genera automáticamente un usuario‑admin vinculado a esa empresa.
- El admin recibe un email derivado del RUT de la empresa (formato `admin@<rut>.cl`) y una password definida en el formulario de creación.
- El admin tiene acceso exclusivo a los datos de su empresa (los endpoints de admin filtran por `empresa_id`).
- El super‑admin puede reasignar el admin a otra empresa mediante la actualización del campo `empresa_id` en `usuarios`.

### Roles
- `superadmin`: solo existe a nivel plataforma (1-2 usuarios).
- `admin`: uno por empresa.
- `chofer`: empleados de la empresa.
- `cliente`: contratantes del servicio.

### Reglas de Negocio
- Fecha chilena forzada (America/Santiago).
- km_termino >= km_inicio (CHECK en BD).
- Se permiten múltiples rutas por camión/día; solo una `en_curso` por camión y por chofer (índices únicos parciales).
- `viajes.fecha` es la fecha de inicio; si la ruta cruza medianoche, puntos y cierre mantienen esa fecha.
- Montos en CLP (enteros, sin decimales).

### Roles
- `superadmin`: solo existe a nivel plataforma (1-2 usuarios).
- `admin`: uno por empresa.
- `chofer`: empleados de la empresa.
- `cliente`: contratantes del servicio.

### Reglas de Negocio
- Fecha chilena forzada (America/Santiago).
- km_termino >= km_inicio (CHECK en BD).
- Se permiten múltiples rutas por camión/día; solo una `en_curso` por camión y por chofer (índices únicos parciales).
- `viajes.fecha` es la fecha de inicio; si la ruta cruza medianoche, puntos y cierre mantienen esa fecha.
- Montos en CLP (enteros, sin decimales).
- Foto obligatoria por gasto.
- Validación RUT chileno.

### Diseño de Interfaz
- Estética "Linear dark" en toda la aplicación: fondo `#0D0D0D`, tarjetas `#141414`, bordes `#2A2A2A`, inputs `#1A1A1A`, acento emerald `#10B981`.

### Portal Cliente
- Clientes vinculados a su usuario de login mediante `clientes.usuario_id` (FK → usuarios).
- El usuario cliente se crea con `email = RUT` (login por RUT).
- Los clientes existentes se vincularon con backfill SQL por RUT/email (migración 004).
- El mandante ve **solo gastos tipo `peaje`** de sus rutas (`GET /api/cliente/servicios` filtra). El resto de tipos (combustible, comida, mecánico, otro) queda interno del chofer.

### Edición de Rutas (Chofer)
- El chofer puede editar rutas terminadas desde el historial: km inicio/término, observaciones, fotos de km y **CRUD de gastos** (`POST/PATCH/DELETE /api/gastos[/id]`).
- Ownership verificado por sesión: los endpoints de chofer resuelven `choferes.usuario_id` y validan que el recurso pertenezca al viaje del chofer. La edición guarda evidencia fotográfica de comprobantes (bucket `gastos`/`km-fotos`).

### Tipos de Servicio y Flujo por Puntos
- Catálogo `tipos_servicio` por empresa con `flujo` (`simple` | `puntos`). Seed: `reparto` (simple) y `fruta` (puntos). Gestión en `/admin/tipos-servicio`.
- `reparto` no se puede eliminar; los tipos en uso se desactivan, no se borran.
- El flujo `puntos` registra N puntos de tipo `retiro`/`entrega`; cada punto exige nombre, odómetro de llegada absoluto y **foto de guía obligatoria** (bucket `guias`).
- Autocompletado de puntos por empresa + cliente, normalizado (sin acentos, minúsculas), reutilizando registros previos.
- El cierre es una acción separada del último punto: `km_termino` obligatorio, puede ser mayor al último punto (ej. regreso), foto de odómetro opcional.
- Editar o anular puntos exige `motivo`; se conserva foto anterior como archivo nuevo y se audita en `viaje_punto_historial` / `viaje_historial`.
- Anulación lógica (`anulado`), no borrado físico. Anulados no se muestran a chofer/cliente y se excluyen de reportes.
- Admin/superadmin también pueden editar rutas y puntos, con las mismas reglas de auditoría.
- Offline previsto: IDs UUID generados en cliente, IndexedDB, compresión JPEG, sincronización idempotente y PWA (pendiente de UI).

### Informes PDF/CSV
- Los informes abarcan **solo rutas terminadas** (`viajes.estado = 'terminado'`).
- **Cliente** (`/cliente/informes` + `GET /api/cliente/informes`): ve solo sus rutas y gastos de tipo `peaje` (misma regla que el portal).
- **Admin** (`/admin/reportes` + `GET /api/admin/informes`): ve todas las rutas de su empresa y el **detalle completo de gastos** (todos los tipos), e incluye **URLs de imágenes** (`foto_km_inicio`, `foto_km_termino`, `foto_url` de gastos) en el detalle, el CSV y el PDF.
- Exportación con `jspdf` + `jspdf-autotable` (PDF) y CSV descargable (BOM UTF-8).
- Filtrado por periodo (fechas Chile), con filtros opcionales por servicio/chófer/camión en el admin.
- Las URLs de las imágenes de respaldo se **acortan** en el reporte (`/s/{bucket}/{file}` → redirect 302 al storage real) para no ocupar espacio en el CSV/PDF; así cliente y admin pueden descargar cada respaldo directamente.
- El PDF incluye un bloque de **totales** (rutas, km recorridos y gastos) entre la tabla resumen y el detalle de gastos/evidencias.

### Usuarios Activos (Admin)
- `/admin/usuarios` + `GET /api/admin/usuarios`: lista las cuentas de login (`usuarios`) de la empresa, con toggle "Solo activos" y filtro por rol. Muestra `ultimo_login` para consultar actividad.

### Resumen Diario (PDF/CSV)
- `/admin/resumen` + `GET /api/admin/resumen-diario`: columnas fecha, km del día, total peajes, total petróleo y otros gastos.
- `/cliente/resumen` + `GET /api/cliente/resumen-diario`: mismo resumen pero el cliente ve **solo peajes** (regla de visibilidad del portal cliente).
- Se genera en un rango de fechas de ruta (`desde`/`hasta`), solo rutas terminadas, con bloque de totales.
- **Resumen Diario quedó integrado dentro de Reportes** (tabs: Informes / Resumen Diario / Valorizador KM) para mantener el dashboard ordenado.

### Valorizador de Kilometraje (solo admin)
- Tabla `valor_km`: `valor` (CLP por km), `fecha_desde`, `fecha_hasta`, `created_by`. Validación de solapamiento de rangos por empresa.
- Tabla `valor_km_historial`: auditoría de cada creación/modificación/eliminación (valor anterior/nuevo, rangos, usuario, fecha).
- `/admin/valorizador`: gestión (CRUD) + historial de cambios.
- El tab "Valorizador KM" de Reportes muestra un informe como el Resumen Diario pero con columnas adicionales: **valor por km** aplicable a la fecha y **valor total** (km × valor), con totalización de la columna valor total.

### Multi-usuario por Cliente
- Tabla `cliente_usuarios` (cliente_id, usuario_id): relación muchos a muchos entre clientes y usuarios de login.
- Se mantiene `clientes.usuario_id` como usuario principal (backward compat).
- Los APIs de cliente resuelven el cliente vía `cliente_usuarios` (un usuario puede estar asociado a varios clientes y viceversa).
- La gestión se hace desde Clientes → "N usuarios" (agregar/quitar logins).

### Cambio de Camión en un Servicio (misma ruta, otro vehículo)
- **Regla de negocio**: cuando un camión sale de un servicio (ej. va a mantención o se reasigna) y entra otro, el chofer se mantiene y solo cambia el camión. No es un cambio a mitad de ruta, sino desde el siguiente día.
- **Los viajes guardan su propio `camion_id`**, independiente de la asignación: las rutas ya registradas con el camión viejo conservan su patente y **no se pierden ni se modifican** al cambiar la asignación.
- **La asignación solo habilita al chofer para iniciar el día** (le indica qué camión manejar en qué servicio). Para el cambio:
  1. Admin crea una **asignación nueva** (chofer + camión nuevo + mismo servicio).
  2. Admin **desactiva** la asignación vieja (badge "Activo" → "Inactivo"). Queda como historial.
- **Los informes y el resumen diario no se afectan**: filtran por `empresa_id` + rango de fechas + estado, **no por camión** (el filtro por camión es opcional). Un mes con rutas de dos camiones distintos se agrega automáticamente en totales, detalle y valorización; el detalle muestra la patente de cada viaje para identificar el camión.

### Rutas por Rol
- `/superadmin/*` → solo superadmin
- `/admin/*` → admin, superadmin
- `/chofer/*` → solo chofer
- `/cliente/*` → solo cliente
- `/auth/login` → público

## Histórico de Decisiones

| Fecha | Decisión | Justificación |
|-------|-----------|----------------|
| 2026-09-03 | v1.0 con Supabase Auth | Initial |
| 2026-09-05 | v2.0 multi-tenant + auth propia | Escalabilidad, control de auditoría |
| 2026-09-05 | Tabla asignaciones sin fecha | Admin asigna chofer+camión a servicio (no por jornada diaria) |
| 2026-09-06 | Columna `clientes.usuario_id` (Opción A) | Vincular portal cliente con su usuario, sin heurísticas |
| 2026-09-06 | Diseño UI "Linear dark" | Estética moderna y consistente en toda la plataforma |
| 2026-09-06 | Migración a vinext + worker `nxrutas` | Deploy Next.js en Cloudflare Workers |
| 2026-09-06 | Cliente ve solo gastos de tipo `peaje` | El mandante consulta solo la información relevante de sus rutas; costos internos quedan fuera del portal |
| 2026-09-06 | Edición de rutas por el chofer (km, fotos, obs y CRUD gastos) | Corrección de registros con evidencia fotográfica, con ownership verificado |
| 2026-09-07 | Informes PDF/CSV de rutas (cliente solo peaje; admin todos los gastos + URLs de imágenes) | El admin requiere el detalle completo de gastos para rendición interna; el cliente solo lo relevante de sus rutas |
| 2026-09-07 | Consulta de usuarios activos en admin | Permite al admin ver las cuentas de login de su empresa y su actividad |
| 2026-09-07 | Regenerar `package-lock.json` completo para CI Linux (`@emnapi/*`) | `npm ci` de Cloudflare fallaba por faltar deps optional de sharp solo en Linux/wasm |
| 2026-09-07 | Resumen diario PDF/CSV (admin: peajes/petróleo/otros; cliente: solo peajes) | Visión consolidada por día de km y gastos, descargable en rango de fechas |
| 2026-09-07 | Resumen Diario integrado dentro de Reportes (tabs) | Mantener el dashboard ordenado |
| 2026-09-07 | Valorizador de km con historial de auditoría | Valorizar rutas por rango de fechas con trazabilidad de cambios |
| 2026-09-07 | Multi-usuario por cliente (tabla cliente_usuarios) | Varios logins pueden acceder a la info de un mismo cliente |
| 2026-10-14 | Cambio de camión en un servicio = asignación nueva + desactivar la vieja | Viajes conservan su camion_id; informes agregan por empresa+fecha sin filtrar por camión, por lo que un mes con dos camiones no se afecta |
| 2026-11-06 | `PuntosRuta` nunca se anida dentro de otro `<form>` | Formularios anidados disparan el submit del formulario externo (cierre de ruta) y rompen el guardado de puntos |
| 2026-11-06 | `orden` de un punto nuevo = máximo histórico (incluye anulados) + 1 | Evita colisiones con `UNIQUE(viaje_id, orden)` cuando existen puntos anulados |
| 2026-11-06 | Acceso al portal se gestiona vía `cliente_usuarios` | Permite agregar/quitar acceso (incluido el usuario principal); se limpia `clientes.usuario_id` y se desactiva la cuenta si no tiene más clientes |
| 2026-11-06 | Re-agregar un email existente reutiliza la cuenta | Se reactiva y re-vincula en vez de crear usuarios duplicados |
| 2026-11-06 | Informe de puntos para cliente en tabla plana por punto | Facilita lectura diaria y exportación; incluye guías por enlace corto y solo considera rutas cerradas con puntos vigentes |
| 2026-11-06 | Informe de puntos ordenado por patente y fecha, con filtros en BD | La temporada de fruta genera muchos registros; se evita cargar todo en memoria y se advierte que las rutas en tránsito no aparecen |
| 2026-11-06 | Índice `(cliente_id, estado, fecha)` en `viajes` | Los informes de cliente filtran por cliente, estado y rango de fechas; el índice existente parte por `empresa_id` y no aplica a esa consulta |
| 2026-11-06 | Informe de puntos compartido entre cliente y admin (`InformePuntos` + `/api/admin/informes/puntos`) | Reutiliza tabla, PDF/CSV, filtros y orden; el admin agrega filtros por cliente/servicio y la empresa se resuelve por sesión |
| 2026-11-06 | El detalle de ruta del portal cliente incluye puntos y guías | El mandante necesita ver los puntos y descargar las guías sin salir de `/cliente/servicios`; solo puntos vigentes |
| 2026-11-06 | `/admin/empresas` y `/api/admin/empresas` restringidos a `superadmin` | Evita que un admin de empresa cree empresas o usuarios admin; la UI oculta el link y la API responde 403 |
| 2026-11-06 | Puntos offline en IndexedDB + sincronización idempotente por UUID | El chofer puede registrar puntos sin señal; al reconectar se reintenta el mismo `id` y el backend devuelve el punto existente (200) en vez de duplicarlo |
| 2026-11-06 | Service worker cachea solo el shell de `/chofer` y assets estáticos | Permite abrir el registro sin conexión sin cachear HTML de admin/cliente; los `/api/*` siempre van a red |
| 2026-11-06 | Ruta activa cacheada en `localStorage` (`rutasnx:viaje-activo`) | Permite renderizar el formulario de puntos offline aunque `/api/viajes/hoy` no responda |
| 2026-11-06 | Lista de puntos sincronizados cacheada en `localStorage` (`rutasnx:puntos:{viajeId}`) | Offline se conserva el último odómetro y los puntos ya enviados; los pendientes viven en IndexedDB |
| 2026-11-06 | Suite de pruebas con Vitest para helpers puros | Valida CSV (escape/fórmulas), fechas, RUT y rango del valorizador sin depender de Supabase ni del runtime de Workers |
| 2026-11-09 | Puntos multiarchivo en `viaje_puntos.archivos` JSONB, manteniendo `foto_guia_url` como imagen principal | Permite varias imágenes/documentos sin tabla adicional; conserva compatibilidad con informes, CSV y vistas que usan la foto principal |
| 2026-11-09 | PDF permitido solo en el bucket `guias` | Las guías pueden ser documentos; gastos y odómetros siguen restringidos a imágenes |
| 2026-11-09 | Registro de puntos local-first con timeout y heurística de red | Evita que el chofer espere una subida colgada en mala señal; el punto se guarda primero en IndexedDB y se sincroniza después |
| 2026-11-09 | Eliminar la ruta `580a5b1b-456e-4c6f-af10-cf6a0ca7a118` (09/11/2026) | Fecha incorrecta; no tenía puntos, gastos ni historial. La asignación, chofer, camión y servicio se mantienen |
