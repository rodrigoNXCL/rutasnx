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
│   │   └── utils.ts
│   ├── middleware.ts           # Routing por rol
│   └── types/database.ts       # Tipos TypeScript
├── docs/
├── supabase/migrations/        # Migraciones SQL
└── ARQUITECTURA.md
```

## Estado

v2.3 implementada y desplegada en producción (Cloudflare Workers).
- Rediseño UI completo con estética "Linear dark"
- Login funcional con auth propia
- Admin: CRUD completo + asignaciones + dashboard con detalle de rutas + reportes PDF/CSV + usuarios activos
- Chofer: registro de viajes con gastos y fotos
- Cliente: portal con sus servicios y rutas (kilómetros y gastos en detalle) + informes PDF/CSV
- Informes: solo rutas terminadas; el cliente solo gastos `peaje`, el admin todos los gastos y URLs de imágenes
- Tipos TypeScript alineados al esquema real (sin `never`)
- Repo: https://github.com/rodrigoNXCL/rutasnx
- URL: https://nxrutas.devnx-trans.workers.dev
