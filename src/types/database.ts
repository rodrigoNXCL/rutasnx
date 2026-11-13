export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Rol = 'superadmin' | 'admin' | 'subadmin' | 'chofer' | 'cliente'
export type TipoGasto = 'combustible' | 'peaje' | 'comida' | 'mecanico' | 'otro'
export type EstadoViaje = 'en_curso' | 'terminado'
export type FlujoServicio = 'simple' | 'puntos'
export type TipoPunto = 'retiro' | 'entrega'
export type AccionPuntoHistorial = 'modificado' | 'anulado'

export interface ArchivoPunto {
  url: string
  nombre: string
  tipo: string
}
export type AccionViajeHistorial = 'creado' | 'modificado' | 'cerrado'

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          nombre: string
          rut: string
          telefono: string | null
          email: string | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          rut: string
          telefono?: string | null
          email?: string | null
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['empresas']['Insert']>
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          empresa_id: string
          email: string
          password_hash: string
          nombre: string
          rol: Rol
          telefono: string | null
          activo: boolean
          ultimo_login: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          email: string
          password_hash: string
          nombre: string
          rol: Rol
          telefono?: string | null
          activo?: boolean
          ultimo_login?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'usuarios_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          }
        ]
      }
      choferes: {
        Row: {
          id: string
          empresa_id: string
          usuario_id: string | null
          nombre: string
          rut: string | null
          licencia: string | null
          telefono: string | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          usuario_id?: string | null
          nombre: string
          rut?: string | null
          licencia?: string | null
          telefono?: string | null
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['choferes']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'choferes_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'choferes_usuario_id_fkey'
            columns: ['usuario_id']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      camiones: {
        Row: {
          id: string
          empresa_id: string
          patente: string
          marca: string | null
          modelo: string | null
          ano: number | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          patente: string
          marca?: string | null
          modelo?: string | null
          ano?: number | null
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['camiones']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'camiones_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          }
        ]
      }
      clientes: {
        Row: {
          id: string
          empresa_id: string
          usuario_id: string | null
          nombre: string
          rut: string | null
          telefono: string | null
          email: string | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          usuario_id?: string | null
          nombre: string
          rut?: string | null
          telefono?: string | null
          email?: string | null
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'clientes_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'clientes_usuario_id_fkey'
            columns: ['usuario_id']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      tipos_servicio: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          nombre: string
          flujo: FlujoServicio
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          codigo: string
          nombre: string
          flujo: FlujoServicio
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['tipos_servicio']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'tipos_servicio_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          }
        ]
      }
      servicios: {
        Row: {
          id: string
          empresa_id: string
          cliente_id: string
          tipo_servicio_id: string
          nombre: string
          descripcion: string | null
          origen: string | null
          destino: string | null
          precio_km: number | null
          precio_base: number | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          cliente_id: string
          tipo_servicio_id?: string | null
          nombre: string
          descripcion?: string | null
          origen?: string | null
          destino?: string | null
          precio_km?: number | null
          precio_base?: number | null
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['servicios']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'servicios_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'servicios_cliente_id_fkey'
            columns: ['cliente_id']
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'servicios_tipo_servicio_id_fkey'
            columns: ['tipo_servicio_id']
            referencedRelation: 'tipos_servicio'
            referencedColumns: ['id']
          }
        ]
      }
      asignaciones: {
        Row: {
          id: string
          empresa_id: string
          chofer_id: string
          camion_id: string
          servicio_id: string
          observaciones: string | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          chofer_id: string
          camion_id: string
          servicio_id: string
          observaciones?: string | null
          activo?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['asignaciones']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'asignaciones_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'asignaciones_chofer_id_fkey'
            columns: ['chofer_id']
            referencedRelation: 'choferes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'asignaciones_camion_id_fkey'
            columns: ['camion_id']
            referencedRelation: 'camiones'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'asignaciones_servicio_id_fkey'
            columns: ['servicio_id']
            referencedRelation: 'servicios'
            referencedColumns: ['id']
          }
        ]
      }
      viajes: {
        Row: {
          id: string
          empresa_id: string
          chofer_id: string
          camion_id: string
          servicio_id: string | null
          tipo_servicio_id: string
          cliente_id: string | null
          fecha: string
          km_inicio: number
          km_termino: number | null
          ruta: string | null
          observaciones: string | null
          foto_km_inicio: string | null
          foto_km_termino: string | null
          estado: EstadoViaje
          iniciado_at: string
          cerrado_at: string | null
          cerrado_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          chofer_id: string
          camion_id: string
          servicio_id?: string | null
          tipo_servicio_id?: string | null
          cliente_id?: string | null
          fecha: string
          km_inicio: number
          km_termino?: number | null
          ruta?: string | null
          observaciones?: string | null
          foto_km_inicio?: string | null
          foto_km_termino?: string | null
          estado?: EstadoViaje
          iniciado_at?: string
          cerrado_at?: string | null
          cerrado_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['viajes']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'viajes_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viajes_chofer_id_fkey'
            columns: ['chofer_id']
            referencedRelation: 'choferes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viajes_camion_id_fkey'
            columns: ['camion_id']
            referencedRelation: 'camiones'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viajes_servicio_id_fkey'
            columns: ['servicio_id']
            referencedRelation: 'servicios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viajes_tipo_servicio_id_fkey'
            columns: ['tipo_servicio_id']
            referencedRelation: 'tipos_servicio'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viajes_cliente_id_fkey'
            columns: ['cliente_id']
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viajes_cerrado_by_fkey'
            columns: ['cerrado_by']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      viaje_puntos: {
        Row: {
          id: string
          empresa_id: string
          viaje_id: string
          cliente_id: string | null
          orden: number
          tipo: TipoPunto
          nombre_punto: string
          nombre_punto_normalizado: string
          km_llegada: number
          foto_guia_url: string
          archivos: ArchivoPunto[]
          captured_at: string
          created_at: string
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
          anulado: boolean
          anulado_at: string | null
          anulado_by: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          viaje_id: string
          cliente_id?: string | null
          orden: number
          tipo: TipoPunto
          nombre_punto: string
          nombre_punto_normalizado: string
          km_llegada: number
          foto_guia_url: string
          archivos?: ArchivoPunto[]
          captured_at?: string
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
          anulado?: boolean
          anulado_at?: string | null
          anulado_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['viaje_puntos']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'viaje_puntos_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_puntos_viaje_id_fkey'
            columns: ['viaje_id']
            referencedRelation: 'viajes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_puntos_cliente_id_fkey'
            columns: ['cliente_id']
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_puntos_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_puntos_updated_by_fkey'
            columns: ['updated_by']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_puntos_anulado_by_fkey'
            columns: ['anulado_by']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      viaje_punto_historial: {
        Row: {
          id: string
          punto_id: string
          viaje_id: string
          empresa_id: string
          accion: AccionPuntoHistorial
          orden_anterior: number | null
          orden_nuevo: number | null
          tipo_anterior: TipoPunto | null
          tipo_nuevo: TipoPunto | null
          nombre_punto_anterior: string | null
          nombre_punto_nuevo: string | null
          nombre_punto_normalizado_anterior: string | null
          nombre_punto_normalizado_nuevo: string | null
          km_llegada_anterior: number | null
          km_llegada_nuevo: number | null
          foto_guia_url_anterior: string | null
          foto_guia_url_nuevo: string | null
          archivos_anterior: ArchivoPunto[] | null
          archivos_nuevo: ArchivoPunto[] | null
          motivo: string
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          punto_id: string
          viaje_id: string
          empresa_id: string
          accion: AccionPuntoHistorial
          orden_anterior?: number | null
          orden_nuevo?: number | null
          tipo_anterior?: TipoPunto | null
          tipo_nuevo?: TipoPunto | null
          nombre_punto_anterior?: string | null
          nombre_punto_nuevo?: string | null
          nombre_punto_normalizado_anterior?: string | null
          nombre_punto_normalizado_nuevo?: string | null
          km_llegada_anterior?: number | null
          km_llegada_nuevo?: number | null
          foto_guia_url_anterior?: string | null
          foto_guia_url_nuevo?: string | null
          archivos_anterior?: ArchivoPunto[] | null
          archivos_nuevo?: ArchivoPunto[] | null
          motivo: string
          changed_by?: string | null
          changed_at?: string
        }
        Update: Partial<Database['public']['Tables']['viaje_punto_historial']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'viaje_punto_historial_punto_id_fkey'
            columns: ['punto_id']
            referencedRelation: 'viaje_puntos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_punto_historial_viaje_id_fkey'
            columns: ['viaje_id']
            referencedRelation: 'viajes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_punto_historial_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_punto_historial_changed_by_fkey'
            columns: ['changed_by']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      viaje_historial: {
        Row: {
          id: string
          viaje_id: string
          empresa_id: string
          accion: AccionViajeHistorial
          km_inicio_anterior: number | null
          km_inicio_nuevo: number | null
          km_termino_anterior: number | null
          km_termino_nuevo: number | null
          foto_km_inicio_anterior: string | null
          foto_km_inicio_nuevo: string | null
          foto_km_termino_anterior: string | null
          foto_km_termino_nuevo: string | null
          observaciones_anterior: string | null
          observaciones_nuevo: string | null
          estado_anterior: string | null
          estado_nuevo: string | null
          motivo: string | null
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          viaje_id: string
          empresa_id: string
          accion: AccionViajeHistorial
          km_inicio_anterior?: number | null
          km_inicio_nuevo?: number | null
          km_termino_anterior?: number | null
          km_termino_nuevo?: number | null
          foto_km_inicio_anterior?: string | null
          foto_km_inicio_nuevo?: string | null
          foto_km_termino_anterior?: string | null
          foto_km_termino_nuevo?: string | null
          observaciones_anterior?: string | null
          observaciones_nuevo?: string | null
          estado_anterior?: string | null
          estado_nuevo?: string | null
          motivo?: string | null
          changed_by?: string | null
          changed_at?: string
        }
        Update: Partial<Database['public']['Tables']['viaje_historial']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'viaje_historial_viaje_id_fkey'
            columns: ['viaje_id']
            referencedRelation: 'viajes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_historial_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viaje_historial_changed_by_fkey'
            columns: ['changed_by']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      gastos: {
        Row: {
          id: string
          empresa_id: string
          viaje_id: string
          tipo: TipoGasto
          monto: number
          descripcion: string | null
          foto_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          viaje_id: string
          tipo: TipoGasto
          monto: number
          descripcion?: string | null
          foto_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['gastos']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'gastos_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gastos_viaje_id_fkey'
            columns: ['viaje_id']
            referencedRelation: 'viajes'
            referencedColumns: ['id']
          }
        ]
      }
      valor_km: {
        Row: {
          id: string
          empresa_id: string
          valor: number
          fecha_desde: string
          fecha_hasta: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          valor: number
          fecha_desde: string
          fecha_hasta: string
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['valor_km']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'valor_km_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'valor_km_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      valor_km_historial: {
        Row: {
          id: string
          valor_km_id: string
          empresa_id: string
          accion: string
          valor_anterior: number | null
          valor_nuevo: number
          fecha_desde_anterior: string | null
          fecha_hasta_anterior: string | null
          fecha_desde_nuevo: string
          fecha_hasta_nuevo: string
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          valor_km_id: string
          empresa_id: string
          accion: string
          valor_anterior?: number | null
          valor_nuevo: number
          fecha_desde_anterior?: string | null
          fecha_hasta_anterior?: string | null
          fecha_desde_nuevo: string
          fecha_hasta_nuevo: string
          changed_by?: string | null
          changed_at?: string
        }
        Update: Partial<Database['public']['Tables']['valor_km_historial']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'valor_km_historial_valor_km_id_fkey'
            columns: ['valor_km_id']
            referencedRelation: 'valor_km'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'valor_km_historial_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'valor_km_historial_changed_by_fkey'
            columns: ['changed_by']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      subadmin_camiones: {
        Row: {
          id: string
          empresa_id: string
          subadmin_id: string
          camion_id: string
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          subadmin_id: string
          camion_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['subadmin_camiones']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'subadmin_camiones_empresa_id_fkey'
            columns: ['empresa_id']
            referencedRelation: 'empresas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subadmin_camiones_subadmin_id_fkey'
            columns: ['subadmin_id']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subadmin_camiones_camion_id_fkey'
            columns: ['camion_id']
            referencedRelation: 'camiones'
            referencedColumns: ['id']
          }
        ]
      }
      cliente_usuarios: {
        Row: {
          id: string
          cliente_id: string
          usuario_id: string
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          usuario_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['cliente_usuarios']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'cliente_usuarios_cliente_id_fkey'
            columns: ['cliente_id']
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cliente_usuarios_usuario_id_fkey'
            columns: ['usuario_id']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Empresa = Database['public']['Tables']['empresas']['Row']
export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type Chofer = Database['public']['Tables']['choferes']['Row']
export type Camion = Database['public']['Tables']['camiones']['Row']
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type TipoServicio = Database['public']['Tables']['tipos_servicio']['Row']
export type Servicio = Database['public']['Tables']['servicios']['Row']
export type Asignacion = Database['public']['Tables']['asignaciones']['Row']
export type Viaje = Database['public']['Tables']['viajes']['Row']
export type ViajePunto = Database['public']['Tables']['viaje_puntos']['Row']
export type ViajePuntoHistorial = Database['public']['Tables']['viaje_punto_historial']['Row']
export type ViajeHistorial = Database['public']['Tables']['viaje_historial']['Row']
export type Gasto = Database['public']['Tables']['gastos']['Row']
export type ValorKm = Database['public']['Tables']['valor_km']['Row']
export type ValorKmHistorial = Database['public']['Tables']['valor_km_historial']['Row']
export type ClienteUsuario = Database['public']['Tables']['cliente_usuarios']['Row']

export interface SesionUsuario {
  id: string
  empresa_id: string
  email: string
  nombre: string
  rol: Rol
}
