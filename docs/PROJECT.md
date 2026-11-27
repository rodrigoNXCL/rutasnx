# PROJECT.md

## Visión del Proyecto

rutasNX es una plataforma web multi-tenant para que empresas de transporte en Chile rindan diariamente kilómetros recorridos y gastos asociados a sus rutas, con evidencia fotográfica de los comprobantes.

## Cliente Inicial

RCC Servicios EIRL.

## Actores del Sistema

| Rol | Descripción |
|-----|-------------|
| Super-admin | Dueño de la plataforma. Gestiona empresas y admins. |
| Admin | Representante de la empresa transportista. Gestiona flota, choferes, clientes y usuarios. |
| Subadmin | Usuario de la empresa con alcance limitado a los camiones asignados. Consulta rutas/reportes y registra en nombre de sus chóferes autorizados. |
| Chofer | Empleado. Registra kilómetros y gastos desde dispositivo móvil. |
| Cliente/Mandante | Contrata el servicio. Consulta kilómetros, puntos, peajes y descarga informes. |

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) + vinext |
| Lenguaje | TypeScript |
| UI/Estilos | Tailwind CSS (diseño "Linear dark") |
| Base de Datos | PostgreSQL (Supabase) |
| Auth | Auth propia (tabla usuarios) |
| Storage | Supabase Storage |
| Deploy | Cloudflare Workers (worker `nxrutas`) |

## Estructura del Proyecto

```
rutasnx/
├── src/
│   ├── app/
│   │   ├── api/auth/login/      # Login API
│   │   ├── api/auth/logout/     # Logout API
│   │   ├── auth/login/         # Login page
│   │   ├── superadmin/          # Dashboard super-admin
│   │   ├── admin/              # Dashboard admin (+ registros, rutas, reportes, gestión)
│   │   ├── chofer/             # Interfaz móvil chofer
│   │   ├── cliente/            # Portal cliente (+ informes)
│   │   └── page.tsx
│   ├── lib/
│   │   ├── supabase/           # Clientes Supabase
│   │   ├── auth.ts             # Auth propia (hash, sessions)
│   │   ├── subadmin.ts         # Alcance de camiones/chóferes/servicios del subadmin
│   │   ├── viaje-access.ts     # Autorización de acceso a un viaje por rol
│   │   ├── offline-queue.ts    # Cola de puntos offline (IndexedDB)
│   │   ├── informe-puntos.ts   # Helpers de informe (CSV/fechas)
│   │   └── utils.ts
│   ├── components/
│   │   ├── InformePuntos.tsx   # Informe compartido cliente/admin
│   │   └── PwaRegister.tsx     # Registro del service worker
│   ├── middleware.ts           # Routing por rol
│   └── types/database.ts       # Tipos TypeScript
├── public/
│   ├── sw.js                   # Service worker (PWA)
│   └── icon*.svg               # Iconos PWA
├── docs/
├── supabase/migrations/        # Migraciones SQL
├── vitest.config.ts            # Config de pruebas
└── ARQUITECTURA.md
```

## Estado

Plataforma operativa al 2026-11-27 (v2.6 + registro en nombre de chóferes), desplegada en producción (Cloudflare Workers).
- Rediseño UI completo con estética "Linear dark"
- Login funcional con auth propia y middleware por rol (`superadmin`, `admin`, `subadmin`, `chofer`, `cliente`)
- Navegación admin con menús **Operación** (Registros, Rutas, Reportes, Valorizador) y **Administración** (Jornadas, Camiones, Chóferes, Clientes, Servicios, Tipos de servicio, Usuarios; Empresas solo superadmin)
- Admin: CRUD completo + asignaciones + dashboard con métricas y detalle de rutas + reportes (tabs: Informes, Resumen Diario, Valorizador KM, Puntos y Guías) + valorizador de km con auditoría + usuarios activos + multi-usuario por cliente + gestión de subadmins
- Registro en nombre de chóferes (`/admin/registros`): iniciar/cerrar rutas, agregar/corregir puntos y gestionar gastos para cualquier chófer (admin/superadmin) o para chóferes/camiones autorizados (subadmin)
- Subadmin: acceso a Dashboard, Registros, Rutas y Reportes; lectura filtrada por `subadmin_camiones` y escritura acotada a sus chóferes/camiones/servicios; ve los gastos de sus camiones
- Chofer: registro de viajes con gastos y fotos; flujo por puntos (retiro/entrega con evidencia opcional: al menos una imagen cuando se adjunta y hasta 5 imágenes/documentos, incluido PDF) con captura local-first y sincronización idempotente
- Puntos: guardado inmediato en IndexedDB, aviso de conexión lenta, timeout de subida de archivos (20 s), reintento/descarte de pendientes y sincronización por UUID; acepta puntos capturados dentro del período de una ruta ya cerrada
- Puntos multiarchivo: `viaje_puntos.archivos` JSONB con `{url, nombre, tipo}`; `foto_guia_url` se conserva como imagen principal
- Cliente: portal con sus servicios y rutas (kilómetros, puntos, guías y gastos tipo `peaje` en detalle) + informes PDF/CSV + resumen diario + informe de puntos y guías
- Informes: solo rutas terminadas; el cliente solo gastos `peaje`, el admin/subadmin todos los gastos y URLs de imágenes; los informes, CSV y PDF listan todos los archivos del punto
- Valorizador KM: valor por km en rangos de fecha, con historial de auditoría e informe valorizado (km × valor)
- Multi-usuario por cliente: varios logins pueden acceder a la info de un mismo cliente
- Chofer multi-camión: al iniciar elige entre sus asignaciones activas; el servidor valida que el camión esté asignado
- PWA: manifest + service worker para el shell de `/chofer`; puntos pendientes en IndexedDB (`rutasnx-offline`) y ruta activa en `localStorage`
- `/admin/empresas` restringido a `superadmin` (API 403 + link oculto)
- Base de datos: migraciones `20261105` (tipos de servicio/multiruta), `20261106` (puntos e índice), `20261109` (multiarchivo) y `20261110` (subadmin) aplicadas y verificadas
- Calidad: `npx tsc --noEmit`, `npm test` (21 pruebas), `npm run build`, `npm run build:vinext` y `npm run deploy:prod` OK
- Guardrails de avance en `CURRENT.md` (sección "Guardrails (No Retroceder)")
- Repo: https://github.com/rodrigoNXCL/rutasnx
- URL: https://nxrutas.devnx-trans.workers.dev
- Último deploy: 2026-11-27, Version ID `1a22546a-1395-4d2e-9ef3-35394a3cd834` (registro en nombre de chóferes para admin/subadmin)
