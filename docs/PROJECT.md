# PROJECT.md

## Visión del Proyecto

rutasNX es una plataforma web multi-tenant para que empresas de transporte en Chile rendición diariamente kilómetros recorridos y gastos asociados a sus rutas, con evidencia fotográfica de los comprobantes.

## Cliente Inicial

RCC Servicios EIRL.

## Actores del Sistema

| Rol | Descripción |
|-----|-------------|
| Super-admin | Dueño de la plataforma. Gestiona empresas y admins. |
| Admin | Representante de la empresa transportista. Gestiona flota, choferes, clientes. |
| Chofer | Empleado. Registra kilómetros y gastos desde dispositivo móvil. |
| Cliente/Mandante | Contrata el servicio. Consulta kilómetros, gastos y descarga informes. |

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
│   │   ├── admin/              # Dashboard admin (+ reportes, usuarios)
│   │   ├── chofer/             # Interfaz móvil chofer
│   │   ├── cliente/            # Portal cliente (+ informes)
│   │   └── page.tsx
│   ├── lib/
│   │   ├── supabase/           # Clientes Supabase
│   │   ├── auth.ts             # Auth propia (hash, sessions)
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

v2.6 implementada; migración aplicada en Supabase y pendiente desplegar en Cloudflare Workers.
- Rediseño UI completo con estética "Linear dark"
- Login funcional con auth propia
- Admin: CRUD completo + asignaciones + dashboard con detalle de rutas + reportes (tabs: Informes, Resumen Diario, Valorizador KM, Puntos y Guías) + valorizador de km con auditoría + usuarios activos + multi-usuario por cliente
- Chofer: registro de viajes con gastos y fotos; flujo por puntos (retiro/entrega con al menos una imagen de guía y hasta 5 imágenes/documentos, incluido PDF) con captura local-first y sincronización idempotente
- Puntos: guardado inmediato en IndexedDB, aviso de conexión lenta, timeout de subida y reintento/descarte de pendientes
- Cliente: portal con sus servicios y rutas (kilómetros, gastos, puntos y guías en detalle) + informes PDF/CSV + resumen diario + informe de puntos y guías
- Informes: solo rutas terminadas; el cliente solo gastos `peaje`, el admin todos los gastos y URLs de imágenes
- Valorizador KM: valor por km en rangos de fecha, con historial de auditoría e informe valorizado (km × valor)
- Multi-usuario por cliente: varios logins pueden acceder a la info de un mismo cliente
- PWA: manifest + service worker para el shell de `/chofer`; puntos pendientes en IndexedDB (`rutasnx-offline`) y ruta activa en `localStorage`
- `/admin/empresas` restringido a `superadmin` (API 403 + link oculto)
- Tipos TypeScript alineados al esquema real (sin `never`); `npx tsc --noEmit`, `npm test` (Vitest) y `npm run build` OK
- Repo: https://github.com/rodrigoNXCL/rutasnx
- URL: https://nxrutas.devnx-trans.workers.dev
