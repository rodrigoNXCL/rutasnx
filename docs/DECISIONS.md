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
