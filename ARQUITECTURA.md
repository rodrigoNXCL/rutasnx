# NXChile — Documento de Arquitectura v1.1

## 1. Visión General

Aplicación web de control de kilómetros de rutas y gastos asociados para operaciones de transporte en Chile.

- Admin (PC): Dashboard para gestionar transportistas, camiones, choferes y consultar reportes.
- Chofer (Móvil web): Registro diario de kilómetros y gastos con evidencia fotográfica.

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | Next.js 15 (App Router) | Fullstack, SSR, Server Actions, soporte nativo en Netlify |
| Lenguaje | TypeScript | Tipado estricto, menos errores en producción |
| UI/Estilos | Tailwind CSS + shadcn/ui | Desarrollo rápido, consistente y mobile-first |
| Base de Datos | PostgreSQL (Supabase) | Robusta, relacional, free tier suficiente |
| Auth | Supabase Auth | Gestión de usuarios y roles (admin/chofer) |
| Storage | Supabase Storage | Almacenamiento de fotos de gastos (bucket privado) |
| Deploy | Netlify | Soporte nativo de Next.js, free tier generoso, CI/CD desde Git |

## 3. Arquitectura de Despliegue

```
┌─────────────────────────────────────────────┐
│ Netlify │
│ ┌───────────────────────────────────────┐ │
│ │ Next.js 15 (App Router) │ │
│ │ (Edge Functions / Server Actions) │ │
│ │ │ │
│ │ /admin/* → Dashboard PC │ │
│ │ /chofer/* → Registro Móvil │ │
│ │ /login → Auth │ │
│ └──────────────┬────────────────────────┘ │
└─────────────────┼────────────────────────────┘
│ (HTTPS, API REST/RPC)
┌─────────▼─────────┐
│ Supabase │
│ ┌──────────────┐ │
│ │ PostgreSQL │ │ (Row Level Security activado)
│ ├──────────────┤ │
│ │ Auth │ │
│ ├──────────────┤ │
│ │ Storage │ │ (Bucket: 'gastos')
│ └──────────────┘ │
└────────────────────┘
```

## 4. Modelo de Datos (Supabase)

### 4.1 Tablas Principales

**transportistas**
- id (uuid, PK)
- nombre (text, NOT NULL)
- rut (text, UNIQUE, formato chileno)
- telefono (text)
- email (text)
- activo (boolean, default true)
- created_at (timestamptz, default now())

**camiones**
- id (uuid, PK)
- transportista_id (uuid, FK → transportistas.id)
- patente (text, UNIQUE, NOT NULL)
- marca (text)
- modelo (text)
- ano (int)
- activo (boolean, default true)
- created_at (timestamptz, default now())

**choferes**
- id (uuid, PK)
- transportista_id (uuid, FK → transportistas.id)
- user_id (uuid, FK → auth.users.id)
- nombre (text, NOT NULL)
- rut (text, UNIQUE)
- licencia (text)
- telefono (text)
- activo (boolean, default true)
- created_at (timestamptz, default now())

**viajes**
- id (uuid, PK)
- chofer_id (uuid, FK → choferes.id)
- camion_id (uuid, FK → camiones.id)
- fecha (date, NOT NULL, timezone America/Santiago)
- km_inicio (int, NOT NULL)
- km_termino (int, NOT NULL, CHECK >= km_inicio)
- ruta (text)
- observaciones (text)
- created_at (timestamptz, default now())

**gastos**
- id (uuid, PK)
- viaje_id (uuid, FK → viajes.id)
- tipo (text: 'combustible','peaje','comida','mecanico','otro')
- monto (int, en CLP, sin decimales)
- descripcion (text)
- foto_url (text, path en Supabase Storage)
- created_at (timestamptz, default now())

### 4.2 Relaciones

- transportistas 1 ──── * camiones
- transportistas 1 ──── * choferes
- choferes       1 ──── * viajes
- camiones       1 ──── * viajes
- viajes         1 ──── * gastos

### 4.3 Reglas de Seguridad (RLS)

- RLS activado en todas las tablas.
- Chofer: solo puede INSERT/SELECT sus propios viajes y gastos.
- Admin: puede SELECT/INSERT/UPDATE todo.
- CHECK: km_termino >= km_inicio en viajes.

## 5. Autenticación y Roles

- Mecanismo: Supabase Auth (Email/Password).
- Tabla perfiles vinculada a auth.users con columna rol ('admin' | 'chofer').
- Flujo:
  1. Admin crea al chofer desde el dashboard (email y password temporal).
  2. Chofer inicia sesión en /login.
  3. Middleware de Next.js lee el rol y redirige: /admin/dashboard o /chofer/registro.

## 6. Storage de Fotos

- Bucket: gastos (privado).
- Estructura: gastos/{viaje_id}/{gasto_id}.jpg
- Reglas RLS: solo el chofer dueño del viaje puede subir. Admin puede leer todo.
- Límite: 5MB por foto, formatos jpg/png/webp.

## 7. Configuración de Netlify

Archivo netlify.toml en la raíz:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_USE_NETLIFY_EDGE = "true"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## 8. Estructura de Directorios

```
nxchile/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── transportistas/page.tsx
│   │   │   ├── camiones/page.tsx
│   │   │   ├── choferes/page.tsx
│   │   │   └── reportes/page.tsx
│   │   ├── (chofer)/
│   │   │   ├── layout.tsx
│   │   │   ├── registro/page.tsx
│   │   │   └── historial/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   └── utils.ts
│   ├── middleware.ts
│   └── types/
│       └── database.ts
├── supabase/
│   └── migrations/
├── netlify.toml
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 9. Reglas de Negocio Clave

- **Fecha chilena**: el formulario del chofer fuerza America/Santiago.
- **Km válidos**: km_termino >= km_inicio.
- **Viaje único por día/camión**: validar que no exista otro viaje del mismo camión en la misma fecha.
- **Monto en CLP**: entero, sin decimales. Se formatea con separador de miles en UI.
- **Foto obligatoria por gasto**: cada gasto debe tener al menos una foto.
- **RUT chileno**: validar formato y dígito verificador.

## 10. Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

## 11. Plan de Desarrollo Incremental

| Paso | Tarea | Entregable |
|------|-------|------------|
| 1 | Configurar Supabase (Tablas, RLS, Bucket) | DB lista y segura |
| 2 | Configurar Next.js + Netlify + Auth + Middleware | Login y redirección por rol funcionando |
| 3 | Admin: CRUD Transportistas y Camiones | Gestión de flota básica |
| 4 | Admin: CRUD Choferes (con creación de usuario) | Gestión de personal completa |
| 5 | Chofer: Formulario de Registro de Viaje (Kms) | Core del negocio funcional |
| 6 | Chofer: Registro de Gastos + Subida de Fotos | Evidencia y trazabilidad completa |
| 7 | Admin: Dashboard de Reportes y Validación | Cierre del ciclo operativo |

## 12. Riesgos y Mitigación

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Chofer sin conexión en ruta | Alto | Fase 1: requiere conexión mínima al enviar. Fase 2: PWA con IndexedDB para modo offline. |
| Fotos de alta resolución | Medio | Compresión en cliente antes de subir. Límite bucket: 5MB/archivo. |
| Zona horaria incorrecta | Medio | Forzar America/Santiago en input de fecha y en Server Actions. |
| Supabase free tier (500MB) | Bajo | Suficiente para inicio, migrar a Pro cuando crezca. |
