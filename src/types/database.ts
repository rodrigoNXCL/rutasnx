export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Rol = 'superadmin' | 'admin' | 'chofer' | 'cliente'
export type TipoGasto = 'combustible' | 'peaje' | 'comida' | 'mecanico' | 'otro'

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
        Insert: Omit<Database['public']['Tables']['empresas']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['empresas']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'id' | 'created_at' | 'ultimo_login'> & {
          id?: string
          created_at?: string
          ultimo_login?: string | null
        }
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['choferes']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['choferes']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['camiones']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['camiones']['Insert']>
      }
      clientes: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          rut: string | null
          telefono: string | null
          email: string | null
          activo: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>
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
          precio_base: number | null
          precio_km: number | null
          activo: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['servicios']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['servicios']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['asignaciones']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['asignaciones']['Insert']>
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
          km_termino: number
          ruta: string | null
          observaciones: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['viajes']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['viajes']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['gastos']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['gastos']['Insert']>
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

export interface SesionUsuario {
  id: string
  empresa_id: string
  email: string
  nombre: string
  rol: Rol
}
