# DATABASE.md

## Configuración de Base de Datos

### Proveedor
Supabase (PostgreSQL)

### Variables de Entorno
```
NEXT_PUBLIC_SUPABASE_URL=https://tjqfhgkldlhlixaokaxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Estado de Configuración
- [x] Variables de entorno configuradas
- [x] Dashboard admin: creación de empresa + usuario admin automático
- [x] SQL v2.0 aplicado
- [x] Tabla asignaciones creada
- [x] Bucket 'gastos' configurado (políticas públicas de lectura)
- [x] Bucket 'guias' configurado (público, 5MB, jpg/png/webp)
- [x] Bucket 'guias' con PDF habilitado (migración `20261109`; verificado con upload/delete)
- [x] Columna `clientes.usuario_id` aplicada (migración 003)
- [x] Backfill clientes ↔ usuarios ejecutado (migración 004)
- [x] RLS habilitado en tablas principales
- [x] Índice `idx_viajes_cliente_estado_fecha` aplicado (migración `20261106_informe_puntos_index`)
- [x] Empresa RCC creada (RCC Servicios EIRL)
- [x] Usuario superadmin creado (1 usuario activo verificado)
- [x] Migración `20261109_puntos_multiarchivo` aplicada y verificada en Supabase (2026-11-09)
- [ ] Migración `20261110_subadmin` (rol `subadmin` + tabla `subadmin_camiones`) — aplicar en Supabase

## Migraciones

- `supabase/migrations/001_schema_v2.sql` - Schema completo v2.0
- `supabase/migrations/002_asignaciones.sql` - Tabla asignaciones
- `supabase/migrations/003_clientes_usuario_id.sql` - Columna `usuario_id` en clientes
- `supabase/migrations/004_clientes_backfill_usuario.sql` - Backfill vínculo clientes ↔ usuarios
- `supabase/migrations/20261105_fase1_tipos_servicio_multiruta.sql` - Tipos de servicio por empresa + soporte de múltiples rutas por camión/día
- `supabase/migrations/20261106_fase2_viaje_puntos.sql` - Puntos de viaje, historial de auditoría y bucket de guías
- `supabase/migrations/20261106_informe_puntos_index.sql` - Índice compuesto para informes de puntos por cliente/estado/fecha
- `supabase/migrations/20261109_puntos_multiarchivo.sql` - Multiarchivo por punto (`archivos` JSONB) y auditoría de archivos en historial; permite PDF en bucket `guias`
- `supabase/migrations/20261110_subadmin.sql` - Rol `subadmin` y tabla `subadmin_camiones` (camiones asignados por el admin a cada subadmin)

## Notas de No Retroceso

- `viaje_puntos.archivos` (jsonb, default `[]`) y `viaje_punto_historial.archivos_anterior/nuevo` deben mantenerse: las APIs e informes dependen de ellas.
- `foto_guia_url` se conserva como imagen principal y fallback de compatibilidad; no reemplazarla por `archivos`.
- El bucket `guias` debe mantener `application/pdf` en `allowed_mime_types` y el límite de 5 MB por archivo.
- El máximo de 5 archivos y los límites de tipo/tamaño se validan en la aplicación (`src/lib/archivos-punto.ts` y APIs de puntos/upload); la evidencia es opcional.
- El rol `subadmin` y la tabla `subadmin_camiones` son la fuente del alcance de datos del subadmin (solo los camiones asignados). No filtrar por empresa únicamente.

## Backups

[Placeholder]
