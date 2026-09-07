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
- [x] SQL v2.0 aplicado
- [x] Tabla asignaciones creada
- [x] Bucket 'gastos' configurado (políticas públicas de lectura)
- [x] Columna `clientes.usuario_id` aplicada (migración 003)
- [x] Backfill clientes ↔ usuarios ejecutado (migración 004)
- [ ] RLS habilitado
- [ ] Empresa RCC creada
- [ ] Usuario superadmin creado

## Migraciones

- `supabase/migrations/001_schema_v2.sql` - Schema completo v2.0
- `supabase/migrations/002_asignaciones.sql` - Tabla asignaciones
- `supabase/migrations/003_clientes_usuario_id.sql` - Columna `usuario_id` en clientes
- `supabase/migrations/004_clientes_backfill_usuario.sql` - Backfill vínculo clientes ↔ usuarios

## Backups

[Placeholder]
