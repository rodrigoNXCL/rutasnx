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
- `/cliente/servicios` - Portal cliente: servicios y rutas expandibles
- `/cliente/informes` - Descarga de informes (placeholder)

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

## APIs Implementadas

- `POST /api/viajes/iniciar` - Inicia el día (km inicio + foto km)
- `GET /api/viajes/hoy` - Obtiene viaje activo del día
- `PUT /api/viajes/[id]/terminar` - Termina el día (km término + foto + gastos en lote)
- `PUT /api/viajes/[id]` - Edita km inicio/término, observaciones y fotos de km
- `POST /api/gastos` - Registra gastos de un viaje
- `PATCH /api/gastos/[id]` - Edita un gasto (tipo, monto, descripción, foto)
- `DELETE /api/gastos/[id]` - Elimina un gasto
- `POST /api/upload` - Upload de fotos (bucket: `gastos` o `km-fotos`)
- `GET /api/cliente/servicios` - Servicios y rutas del cliente logueado (vía `clientes.usuario_id`, gastos filtrados solo a `peaje`)

## Deploy

- **URL**: https://nxrutas.devnx-trans.workers.dev
- **Plataforma**: Cloudflare Workers (vinext)
- **Repo**: https://github.com/rodrigoNXCL/rutasnx

## Último Cambio

Rediseño Linear dark en toda la app + portal cliente funcional (servicios y rutas con gastos/fotos). Clientes vinculados a sus usuarios con `clientes.usuario_id` (migraciones 003 y 004). Deploy actualizado en nxrutas.

Actualización: el cliente ve solo gastos de tipo `peaje`; el chofer puede editar rutas terminadas (km, observaciones, fotos y CRUD de gastos).

## Bloqueos

Ninguno activo.
