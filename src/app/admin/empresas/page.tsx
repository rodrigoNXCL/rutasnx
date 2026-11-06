'use client'

import { useState, useEffect } from 'react'

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')

  interface Empresa {
    id: string
    nombre: string
    rut: string
    telefono: string | null
    email: string | null
    activo: boolean
    creado_en: string
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetch('/api/admin/empresas', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        setEmpresas(data)
      })
      .catch((err) => {
        setError('Error cargando empresas')
      })
      .finally(() => setLoading(false))
  }, [])

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setExito('')

    if (!nombre || !rut || !password) {
      setError('Completa todos los campos')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, rut, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al crear empresa y admin')
        return
      }

      const data = await res.json()
      setExito(
        `Empresa "${data.empresa.nombre}" creada. Admin: ${data.usuario.email} (password: ${password})`
      )
      setNombre('')
      setRut('')
      setPassword('')
      // Volvemos a cargar la lista de empresas
      fetch('/api/admin/empresas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
        .then((res) => res.json())
        .then((data) => setEmpresas(data))
        .catch((err) => setError('Error refrescando lista'))
      return
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6" style={{ background: '#0D0D0D' }}>
      <h1 className="text-2xl font-semibold text-white mb-6">Crear Empresa + Admin</h1>

      {error && (
        <div className="mb-4 p-4 rounded-xl border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {exito && (
        <div className="mb-4 p-4 rounded-xl border" style={{ background: '#0D2D1D', borderColor: '#0D5D3D' }}>
          <p className="text-sm text-emerald-400">{exito}</p>
        </div>
      )}

      <form onSubmit={manejarSubmit} className="rounded-xl p-6 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1">Nombre de la empresa</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
              placeholder="Ej: Transportes Test"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1">RUT (sin puntos)</label>
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
              placeholder="7600000001"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1">Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
              placeholder="+56 2 2222 2222"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-1">Password del admin</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
              placeholder="AdminTest2024!"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: '#10B981' }}
        >
          {loading ? 'Creando...' : 'Crear empresa y admin'}
        </button>
      </form>
    </div>
  )
}