'use client'

import { useState, useEffect } from 'react'

interface UsuarioActivo {
  id: string
  email: string
  nombre: string
  rol: string
  telefono: string | null
  activo: boolean
  ultimo_login: string | null
  created_at: string
}

const ROL_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  chofer: 'Chófer',
  cliente: 'Cliente',
}

function formatFecha(dt: string | null): string {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  })
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioActivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  const [rol, setRol] = useState('')

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const params = new URLSearchParams()
        if (soloActivos) params.set('activos', 'true')
        if (rol) params.set('rol', rol)
        const res = await fetch(`/api/admin/usuarios?${params}`)
        if (res.ok) {
          setUsuarios(await res.json())
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Error al cargar usuarios')
        }
      } catch {
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }
    fetchUsuarios()
  }, [soloActivos, rol])

  const activos = usuarios.filter((u) => u.activo).length

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">Usuarios</h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSoloActivos(!soloActivos)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              soloActivos ? 'text-white' : 'text-zinc-400'
            }`}
            style={{ background: soloActivos ? '#10B981' : '#2A2A2A' }}
          >
            Solo activos
          </button>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: rol ? '#fff' : '#71717a' }}
          >
            <option value="">Todos los roles</option>
            {Object.entries(ROL_LABEL)
              .filter(([k]) => k !== 'superadmin')
              .map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
          </select>
          <span className="text-sm text-zinc-500">
            {soloActivos ? `${activos} usuario${activos !== 1 ? 's' : ''} activo${activos !== 1 ? 's' : ''}` : `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500">Sin usuarios</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
          <div className="hidden md:grid grid-cols-[1.3fr_1.3fr_0.8fr_0.9fr_1fr] gap-4 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
            <span>Nombre</span>
            <span>Email / Login</span>
            <span>Rol</span>
            <span>Estado</span>
            <span>Último acceso</span>
          </div>
          {usuarios.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-2 md:grid-cols-[1.3fr_1.3fr_0.8fr_0.9fr_1fr] gap-2 md:gap-4 px-5 py-3.5 border-b border-zinc-800 last:border-b-0 items-center"
            >
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Nombre</span>
                <span className="text-sm text-white">{u.nombre}</span>
              </div>
              <div className="min-w-0">
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Login</span>
                <span className="text-sm text-zinc-400 truncate block">{u.email}</span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Rol</span>
                <span className="text-sm px-2 py-0.5 rounded-full text-xs" style={{ background: '#1A1A1A', color: '#a1a1aa' }}>
                  {ROL_LABEL[u.rol] || u.rol}
                </span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Estado</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    u.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Último acceso</span>
                <span className="text-xs text-zinc-400">{formatFecha(u.ultimo_login)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
