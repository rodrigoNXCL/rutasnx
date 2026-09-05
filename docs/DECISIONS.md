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
