'use client'

import { useCallback, useEffect, useState } from 'react'

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

interface Subadmin {
  id: string
  nombre: string
  email: string
  activo: boolean
  camion_ids: string[]
}

interface CamionOpcion {
  id: string
  patente: string
  marca: string | null
  activo: boolean
}

const ROL_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  subadmin: 'Subadmin',
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

  const [subadmins, setSubadmins] = useState<Subadmin[]>([])
  const [camiones, setCamiones] = useState<CamionOpcion[]>([])
  const [seleccion, setSeleccion] = useState<Record<string, string[]>>({})
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    camion_ids: [] as string[],
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const cargarSubadmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/subadmins')
      if (!res.ok) return
      const data = await res.json()
      setSubadmins(data.subadmins || [])
      setCamiones(data.camiones || [])

      const mapa: Record<string, string[]> = {}
      for (const subadmin of data.subadmins || []) {
        mapa[subadmin.id] = subadmin.camion_ids || []
      }
      setSeleccion(mapa)
    } catch {
      // silencioso
    }
  }, [])

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarSubadmins()
  }, [cargarSubadmins])

  const activos = usuarios.filter((u) => u.activo).length

  function alternarCamion(lista: string[], camionId: string): string[] {
    return lista.includes(camionId)
      ? lista.filter((id) => id !== camionId)
      : [...lista, camionId]
  }

  async function crearSubadmin(e: React.FormEvent) {
    e.preventDefault()
    setMensaje('')
    setGuardando(true)
    try {
      const res = await fetch('/api/admin/subadmins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMensaje(data.error || 'No se pudo crear el subadmin')
        return
      }
      setForm({ nombre: '', email: '', password: '', camion_ids: [] })
      setMensaje('Subadmin creado')
      await cargarSubadmins()
    } catch {
      setMensaje('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  async function guardarCamiones(subadminId: string) {
    setMensaje('')
    setGuardando(true)
    try {
      const res = await fetch(`/api/admin/subadmins/${subadminId}/camiones`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camion_ids: seleccion[subadminId] || [] }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMensaje(data.error || 'No se pudieron guardar los camiones')
        return
      }
      setMensaje('Camiones actualizados')
    } catch {
      setMensaje('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

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

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-white tracking-tight mb-1">Subadmins</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Los subadmins solo ven rutas, reportes e información de los camiones que les asignes.
        </p>

        {mensaje && (
          <div className="mb-5 p-3 rounded-xl border" style={{ background: '#0D2D1D', borderColor: '#0D5D3D' }}>
            <p className="text-sm text-emerald-400">{mensaje}</p>
          </div>
        )}

        <form
          onSubmit={crearSubadmin}
          className="rounded-xl border p-5 mb-6 space-y-4"
          style={{ background: '#141414', borderColor: '#2A2A2A' }}
        >
          <p className="text-sm font-medium text-white">Nuevo subadmin</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre"
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
              style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email de acceso"
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
              style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Contraseña (mín. 6)"
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
              style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Camiones asignados
            </p>
            <div className="flex flex-wrap gap-2">
              {camiones.length === 0 && (
                <span className="text-xs text-zinc-600">No hay camiones registrados</span>
              )}
              {camiones.map((camion) => {
                const activo = form.camion_ids.includes(camion.id)
                return (
                  <button
                    key={camion.id}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, camion_ids: alternarCamion(form.camion_ids, camion.id) })
                    }
                    className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                    style={{
                      background: activo ? '#1A2D2A' : '#1A1A1A',
                      borderColor: activo ? '#10B981' : '#2A2A2A',
                      color: activo ? '#34d399' : '#a1a1aa',
                    }}
                  >
                    {camion.patente}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: '#10B981' }}
          >
            {guardando ? 'Guardando...' : 'Crear subadmin'}
          </button>
        </form>

        {subadmins.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay subadmins.</p>
        ) : (
          <div className="space-y-3">
            {subadmins.map((subadmin) => {
              const lista = seleccion[subadmin.id] || []
              return (
                <div
                  key={subadmin.id}
                  className="rounded-xl border p-5"
                  style={{ background: '#141414', borderColor: '#2A2A2A' }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">{subadmin.nombre}</p>
                      <p className="text-xs text-zinc-500">{subadmin.email}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        subadmin.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {subadmin.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {camiones.map((camion) => {
                      const activo = lista.includes(camion.id)
                      return (
                        <button
                          key={camion.id}
                          type="button"
                          onClick={() =>
                            setSeleccion({
                              ...seleccion,
                              [subadmin.id]: alternarCamion(lista, camion.id),
                            })
                          }
                          className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                          style={{
                            background: activo ? '#1A2D2A' : '#1A1A1A',
                            borderColor: activo ? '#10B981' : '#2A2A2A',
                            color: activo ? '#34d399' : '#a1a1aa',
                          }}
                        >
                          {camion.patente}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => guardarCamiones(subadmin.id)}
                    disabled={guardando}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: '#2A2A2A' }}
                  >
                    Guardar camiones
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
