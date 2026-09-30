# DATABASE_SCHEMA.md

## Schema de Base de Datos v2.0

**Fuente de verdad**: `src/types/database.ts`

Migraciones SQL en `supabase/migrations/001_schema_v2.sql`.

### Tablas

#### empresas
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| nombre | text | NOT NULL |
| rut | text | UNIQUE, NOT NULL |
| telefono | text | |
| email | text | |
| activo | boolean | default true |
| created_at | timestamptz | default now() |

#### usuarios
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| email | text | UNIQUE, NOT NULL |
| password_hash | text | NOT NULL |
| nombre | text | NOT NULL |
| rol | text | NOT NULL, CHECK IN ('superadmin','admin','chofer','cliente') |
| telefono | text | |
| activo | boolean | default true |
| ultimo_login | timestamptz | |
| created_at | timestamptz | default now() |

#### choferes
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| usuario_id | uuid | FK → usuarios.id, SET NULL |
| nombre | text | NOT NULL |
| rut | text | UNIQUE |
| licencia | text | |
| telefono | text | |
| activo | boolean | default true |
| created_at | timestamptz | default now() |

#### camiones
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| patente | text | NOT NULL |
| activo | boolean | default true |
| created_at | timestamptz | default now() |
| | | UNIQUE(empresa_id, patente) |

#### clientes
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| nombre | text | NOT NULL |
| rut | text | |
| telefono | text | |
| email | text | |
| activo | boolean | default true |
| created_at | timestamptz | default now() |

#### servicios
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| cliente_id | uuid | FK → clientes.id, NOT NULL |
| nombre | text | NOT NULL |
| descripcion | text | |
| origen | text | |
| destino | text | |
| precio_base | numeric(10,2) | default 0 |
| precio_km | numeric(10,2) | |
| activo | boolean | default true |
| created_at | timestamptz | default now() |

#### asignaciones
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| chofer_id | uuid | FK → choferes.id, NOT NULL |
| camion_id | uuid | FK → camiones.id, NOT NULL |
| servicio_id | uuid | FK → servicios.id, NOT NULL |
| observaciones | text | |
| activo | boolean | default true |
| created_at | timestamptz | default now() |
| | | UNIQUE(chofer_id, camion_id, servicio_id) |

#### viajes
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| chofer_id | uuid | FK → choferes.id, NOT NULL |
| camion_id | uuid | FK → camiones.id, NOT NULL |
| servicio_id | uuid | FK → servicios.id, SET NULL |
| fecha | date | NOT NULL |
| km_inicio | int | NOT NULL |
| km_termino | int | NOT NULL, CHECK >= km_inicio |
| ruta | text | |
| observaciones | text | |
| created_at | timestamptz | default now() |
| | | UNIQUE(camion_id, fecha) |

#### gastos
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| viaje_id | uuid | FK → viajes.id, NOT NULL |
| tipo | text | NOT NULL, CHECK IN ('combustible','peaje','comida','mecanico','otro') |
| monto | int | NOT NULL, CHECK >= 0 |
| descripcion | text | |
| foto_url | text | |
| created_at | timestamptz | default now() |

#### valor_km
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| valor | int | NOT NULL, CHECK >= 0 |
| fecha_desde | date | NOT NULL |
| fecha_hasta | date | NOT NULL, CHECK >= fecha_desde |
| created_by | uuid | FK → usuarios.id, SET NULL |
| created_at | timestamptz | default now() |

#### valor_km_historial
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| valor_km_id | uuid | FK → valor_km.id, NOT NULL |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| accion | text | NOT NULL, CHECK IN ('creado','modificado','eliminado') |
| valor_anterior | int | |
| valor_nuevo | int | NOT NULL |
| fecha_desde_anterior | date | |
| fecha_hasta_anterior | date | |
| fecha_desde_nuevo | date | NOT NULL |
| fecha_hasta_nuevo | date | NOT NULL |
| changed_by | uuid | FK → usuarios.id, SET NULL |
| changed_at | timestamptz | default now() |

#### cliente_usuarios
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| cliente_id | uuid | FK → clientes.id, NOT NULL |
| usuario_id | uuid | FK → usuarios.id, NOT NULL |
| created_at | timestamptz | default now() |
| | | UNIQUE(cliente_id, usuario_id) |

## RLS Policies

Implementadas en el SQL de migración para todos los roles.

## Storage

- Bucket: 'gastos' (privado, 5MB, jpg/png/webp)
