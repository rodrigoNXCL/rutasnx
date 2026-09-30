export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Rol = 'superadmin' | 'admin' | 'chofer' | 'cliente'
export type TipoGasto = 'combustible' | 'peaje' | 'comida' | 'mecanico' | 'otro'
export type EstadoViaje = 'en_curso' | 'terminado'

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

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
      servicios: {
        Row: {
          id: string
          empresa_id: string
          cliente_id: string
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
          fecha: string
          km_inicio: number
          km_termino: number | null
          ruta: string | null
          observaciones: string | null
          foto_km_inicio: string | null
          foto_km_termino: string | null
          estado: EstadoViaje
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          chofer_id: string
          camion_id: string
          servicio_id?: string | null
          fecha: string
          km_inicio: number
          km_termino?: number | null
          ruta?: string | null
          observaciones?: string | null
          foto_km_inicio?: string | null
          foto_km_termino?: string | null
          estado?: EstadoViaje
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
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Empresa = Database['public']['Tables']['empresas']['Row']
export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type Chofer = Database['public']['Tables']['choferes']['Row']
export type Camion = Database['public']['Tables']['camiones']['Row']
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type Servicio = Database['public']['Tables']['servicios']['Row']
export type Asignacion = Database['public']['Tables']['asignaciones']['Row']
export type Viaje = Database['public']['Tables']['viajes']['Row']
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
