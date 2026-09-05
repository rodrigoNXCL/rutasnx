# CURRENT.md

## Paso Actual del Plan de Desarrollo

**Paso 2** - Funcionalidades core del admin y chofer

## Estado General

- [x] Estructura de directorios creada
- [x] Tipos TypeScript definidos v2.0
- [x] Auth propia implementada (`src/lib/auth.ts`)
- [x] Middleware actualizado para 4 roles
- [x] SQL v2.0 ejecutado en Supabase
- [x] Asignaciones table creada y funcional
- [x] Superadmin: dashboard, empresas CRUD, admin management
- [x] Admin: CRUD camiones, choferes, clientes, servicios, asignaciones
- [x] Chofer: registro de viajes, historial, gastos
- [x] Cliente: servicios e informes (placeholders)
- [ ] Crear empresa inicial (RCC)
- [ ] Crear usuario superadmin
- [ ] Configurar Netlify

## Estructura de Rutas Implementada

- `/auth/login` - Login (público)
- `/superadmin/dashboard` - Gestión de empresas
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

## Asignaciones (modelo de negocio)

El admin asigna **un chofer + camión a un servicio** de forma permanente. Un servicio puede tener múltiples asignaciones (distintos turnos o vehículos). Un chofer puede tener múltiples asignaciones (distintos servicios).

Tabla `asignaciones`:
- `chofer_id` → chofer asignado
- `camion_id` → camión asignado
- `servicio_id` → servicio a atender
- `activo` → true/false para activar/pausar
- `observaciones` → notas del admin

Flujo chofer:
1. Ve sus asignaciones activas
2. Selecciona con cuál trabajar (si tiene varias)
3. Registra km_inicio, km_termino, observaciones
4. Registra gastos (combustible, peaje, comida, mecánico, otro)

## APIs Implementadas

- `GET/POST /api/asignaciones` - Lista y crea asignaciones
- `PUT/DELETE /api/asignaciones/[id]` - Modifica y elimina
- `GET /api/chofer/asignacion` - Asignaciones activas del chofer logueado
- `POST /api/viajes` - Registra viaje
- `POST /api/gastos` - Registra gastos de un viaje

## Último Cambio

Modelo de asignaciones: admin asigna chofer+camión a servicio (no por jornada diaria).

## Bloqueos

Ninguno activo.
