'use client'

import { useState, useEffect } from 'react'

export default function EmpresasClient() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [rut, setRut] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')

  interface Empresa {
    id: string
    nombre: string
    rut: string
    telefono: string | null
    email: string | null
    activo: boolean
    created_at: string
  }

  useEffect(() => {
    fetch('/api/admin/empresas', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        setEmpresas(data)
      })
      .catch(() => {
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
        body: JSON.stringify({ nombre, rut, telefono, password }),
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
      setTelefono('')
      setPassword('')
      fetch('/api/admin/empresas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
        .then((res) => res.json())
        .then((data) => setEmpresas(data))
        .catch(() => setError('Error refrescando lista'))
      return
    } catch {
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

      <div className="mt-8">
        <h2 className="text-lg font-medium text-white mb-3">Empresas</h2>
        {empresas.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin empresas registradas</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-zinc-500 border-b border-zinc-800">
                  <th className="text-left px-4 py-2 font-medium">Nombre</th>
                  <th className="text-left px-4 py-2 font-medium">RUT</th>
                  <th className="text-left px-4 py-2 font-medium">Teléfono</th>
                  <th className="text-left px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="border-b border-zinc-800/60 last:border-b-0">
                    <td className="px-4 py-2 text-white">{empresa.nombre}</td>
                    <td className="px-4 py-2 text-zinc-400">{empresa.rut}</td>
                    <td className="px-4 py-2 text-zinc-400">{empresa.telefono || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        empresa.activo
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-zinc-500/15 text-zinc-400'
                      }`}>
                        {empresa.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
