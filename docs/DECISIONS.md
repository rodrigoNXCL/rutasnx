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
- 9 tablas: empresas, usuarios, choferes, camiones, clientes, servicios, viajes, gastos, asignaciones.
- Relaciones: empresa → (usuarios, choferes, camiones, clientes, servicios, asignaciones)
- servicios → viajes → gastos (cadena de servicios)
- asignaciones: chofer+camión asignados a un servicio (relación muchos a muchos)

### Asignaciones (Modelo de Negocio)
- Admin asigna permanentemente un chofer + camión a un servicio.
- Un servicio puede tener múltiples asignaciones (distintos vehículos/turnos).
- Un chofer puede tener múltiples asignaciones (distintos servicios).
- Campo `activo` para activar/pausar sin eliminar.

### Roles
- `superadmin`: solo existe a nivel plataforma (1-2 usuarios).
- `admin`: uno por empresa.
- `chofer`: empleados de la empresa.
- `cliente`: contratantes del servicio.

### Reglas de Negocio
- Fecha chilena forzada (America/Santiago).
- km_termino >= km_inicio (CHECK en BD).
- Viaje único por día/camión.
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

### Informes PDF/CSV
- Los informes abarcan **solo rutas terminadas** (`viajes.estado = 'terminado'`).
- **Cliente** (`/cliente/informes` + `GET /api/cliente/informes`): ve solo sus rutas y gastos de tipo `peaje` (misma regla que el portal).
- **Admin** (`/admin/reportes` + `GET /api/admin/informes`): ve todas las rutas de su empresa y el **detalle completo de gastos** (todos los tipos), e incluye **URLs de imágenes** (`foto_km_inicio`, `foto_km_termino`, `foto_url` de gastos) en el detalle, el CSV y el PDF.
- Exportación con `jspdf` + `jspdf-autotable` (PDF) y CSV descargable (BOM UTF-8).
- Filtrado por periodo (fechas Chile), con filtros opcionales por servicio/chófer/camión en el admin.
- Las URLs de las imágenes de respaldo se **acortan** en el reporte (`/s/{bucket}/{file}` → redirect 302 al storage real) para no ocupar espacio en el CSV/PDF; así cliente y admin pueden descargar cada respaldo directamente.

### Usuarios Activos (Admin)
- `/admin/usuarios` + `GET /api/admin/usuarios`: lista las cuentas de login (`usuarios`) de la empresa, con toggle "Solo activos" y filtro por rol. Muestra `ultimo_login` para consultar actividad.

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
