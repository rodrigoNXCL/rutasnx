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
- [x] Cliente: servicios e informes (placeholders)
- [x] Landing page pública en `/`
- [x] Deploy en Cloudflare Workers (rutas.nxchile.com)

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
- `/admin/asignaciones` - Asignar chofer+camión a servicio
- `/chofer/registro` - Registro de viajes (mobile)
- `/chofer/historial` - Historial de viajes
- `/cliente/servicios` - Consulta de servicios
- `/cliente/informes` - Descarga de informes

## Modelo de Asignaciones

El admin asigna **un chofer + camión a un servicio** de forma permanente.

Tabla `asignaciones`:
- `chofer_id` → chofer asignado
- `camion_id` → camión asignado
- `servicio_id` → servicio a atender
- `activo` → true/false para activar/pausar
- `observaciones` → notas del admin

Flujo chofer:
1. Ve sus asignaciones activas
2. Selecciona con cuál trabajar (si tiene varias)
3. Registra fecha, km_inicio, km_termino, observaciones
4. Registra gastos con foto de comprobante (combustible, peaje, comida, mecánico, otro)

## APIs Implementadas

- `GET/POST /api/asignaciones` - Lista y crea asignaciones
- `PUT/DELETE /api/asignaciones/[id]` - Modifica y elimina
- `GET /api/chofer/asignacion` - Asignaciones activas del chofer logueado
- `POST /api/viajes` - Registra viaje
- `POST /api/gastos` - Registra gastos de un viaje
- `POST /api/upload` - Upload de fotos a Supabase Storage

## Deploy

- **URL**: https://rutas.nxchile.com
- **Plataforma**: Cloudflare Workers (OpenNext adapter)
- **Repo**: https://github.com/rodrigoNXCL/rutasnx

## Último Cambio

Deploy completado en Cloudflare Workers. Plataforma funcionando en producción.

## Bloqueos

Ninguno activo.
