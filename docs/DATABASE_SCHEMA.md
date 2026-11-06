# DATABASE_SCHEMA.md

## Schema de Base de Datos v2.0

**Fuente de verdad**: `src/types/database.ts`

Migraciones SQL en `supabase/migrations/`.

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

#### tipos_servicio
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| codigo | text | NOT NULL |
| nombre | text | NOT NULL |
| flujo | text | NOT NULL, CHECK IN ('simple','puntos') |
| activo | boolean | default true |
| created_at | timestamptz | default now() |
| | | UNIQUE(empresa_id, codigo) |

#### servicios
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| cliente_id | uuid | FK → clientes.id, NOT NULL |
| tipo_servicio_id | uuid | FK → tipos_servicio.id, NOT NULL |
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
| tipo_servicio_id | uuid | FK → tipos_servicio.id, NOT NULL (snapshot) |
| cliente_id | uuid | FK → clientes.id, SET NULL (snapshot) |
| fecha | date | NOT NULL (fecha de inicio de la ruta) |
| km_inicio | int | NOT NULL |
| km_termino | int | NULL, CHECK >= km_inicio |
| ruta | text | |
| observaciones | text | |
| foto_km_inicio | text | |
| foto_km_termino | text | |
| estado | text | CHECK IN ('en_curso','terminado') |
| iniciado_at | timestamptz | NOT NULL, default now() |
| cerrado_at | timestamptz | |
| cerrado_by | uuid | FK → usuarios.id, SET NULL |
| created_at | timestamptz | default now() |
| | | Índice único parcial: una sola ruta `en_curso` por `camion_id` y por `chofer_id` |

#### viaje_puntos
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| viaje_id | uuid | FK → viajes.id, NOT NULL |
| cliente_id | uuid | FK → clientes.id, SET NULL (snapshot) |
| orden | int | NOT NULL |
| tipo | text | NOT NULL, CHECK IN ('retiro','entrega') |
| nombre_punto | text | NOT NULL |
| nombre_punto_normalizado | text | NOT NULL |
| km_llegada | int | NOT NULL (odómetro absoluto) |
| foto_guia_url | text | NOT NULL |
| captured_at | timestamptz | NOT NULL, default now() |
| created_at | timestamptz | default now() |
| created_by | uuid | FK → usuarios.id, SET NULL |
| updated_at | timestamptz | |
| updated_by | uuid | FK → usuarios.id, SET NULL |
| anulado | boolean | default false |
| anulado_at | timestamptz | |
| anulado_by | uuid | FK → usuarios.id, SET NULL |
| | | UNIQUE(viaje_id, orden) |

#### viaje_punto_historial
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| punto_id | uuid | FK → viaje_puntos.id, NOT NULL |
| viaje_id | uuid | FK → viajes.id, NOT NULL |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| accion | text | NOT NULL, CHECK IN ('modificado','anulado') |
| orden_anterior / orden_nuevo | int | |
| tipo_anterior / tipo_nuevo | text | |
| nombre_punto_anterior / nombre_punto_nuevo | text | |
| nombre_punto_normalizado_anterior / nombre_punto_normalizado_nuevo | text | |
| km_llegada_anterior / km_llegada_nuevo | int | |
| foto_guia_url_anterior / foto_guia_url_nuevo | text | |
| motivo | text | NOT NULL |
| changed_by | uuid | FK → usuarios.id, SET NULL |
| changed_at | timestamptz | default now() |

#### viaje_historial
| Columna | Tipo | Constraints |
|---------|------|-------------|
| id | uuid | PK |
| viaje_id | uuid | FK → viajes.id, NOT NULL |
| empresa_id | uuid | FK → empresas.id, NOT NULL |
| accion | text | NOT NULL, CHECK IN ('creado','modificado','cerrado') |
| km_inicio_anterior / km_inicio_nuevo | int | |
| km_termino_anterior / km_termino_nuevo | int | |
| foto_km_inicio_anterior / foto_km_inicio_nuevo | text | |
| foto_km_termino_anterior / foto_km_termino_nuevo | text | |
| observaciones_anterior / observaciones_nuevo | text | |
| estado_anterior / estado_nuevo | text | |
| motivo | text | |
| changed_by | uuid | FK → usuarios.id, SET NULL |
| changed_at | timestamptz | default now() |

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
- Bucket: 'km-fotos' (privado, 5MB, jpg/png/webp)
- Bucket: 'guias' (público, 5MB, jpg/png/webp)
