'use client'

import { useState, useEffect } from 'react'

interface TipoServicio {
  id: string
  codigo: string
  nombre: string
  flujo: 'simple' | 'puntos'
  activo: boolean
  created_at: string
  servicios_count: number
}

export default function TiposServicioPage() {
  const [tipos, setTipos] = useState<TipoServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<TipoServicio | null>(null)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    flujo: 'simple' as 'simple' | 'puntos',
    activo: true,
  })

  useEffect(() => {
    fetchTipos()
  }, [])

  async function fetchTipos() {
    try {
      const res = await fetch('/api/tipos-servicio')
      if (res.ok) {
        setTipos(await res.json())
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error cargando tipos de servicio')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function openNuevo() {
    setEditando(null)
    setForm({ codigo: '', nombre: '', flujo: 'simple', activo: true })
    setError('')
    setShowModal(true)
  }

  function openEditar(tipo: TipoServicio) {
    setEditando(tipo)
    setForm({
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      flujo: tipo.flujo,
      activo: tipo.activo,
    })
    setError('')
    setShowModal(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = editando ? `/api/tipos-servicio/${editando.id}` : '/api/tipos-servicio'
      const method = editando ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error guardando el tipo de servicio')
        return
      }

      setShowModal(false)
      await fetchTipos()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActivo(tipo: TipoServicio) {
    setError('')

    try {
      const res = await fetch(`/api/tipos-servicio/${tipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: tipo.nombre,
          flujo: tipo.flujo,
          activo: !tipo.activo,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error actualizando el tipo de servicio')
        return
      }

      await fetchTipos()
    } catch {
      setError('Error de conexión')
    }
  }

  async function eliminar(tipo: TipoServicio) {
    setError('')

    if (tipo.codigo === 'reparto') {
      setError('El tipo Reparto es el predeterminado; puedes desactivarlo pero no eliminarlo.')
      return
    }

    if (tipo.servicios_count > 0) {
      setError('Este tipo está en uso. Desactívalo en lugar de eliminarlo.')
      return
    }

    if (!confirm(`¿Eliminar el tipo "${tipo.nombre}"?`)) return

    try {
      const res = await fetch(`/api/tipos-servicio/${tipo.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error eliminando el tipo de servicio')
        return
      }

      await fetchTipos()
    } catch {
      setError('Error de conexión')
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-zinc-500">Cargando...</div>
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Tipos de servicio</h1>
            <p className="text-sm text-zinc-500 mt-1">Definen el flujo que verá el chofer al iniciar la ruta.</p>
          </div>
          <button
            onClick={openNuevo}
            className="w-full sm:w-auto px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
            style={{ background: '#10B981' }}
          >
            + Nuevo tipo
          </button>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl border break-words" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {tipos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin tipos de servicio registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tipos.map((tipo) => (
              <div
                key={tipo.id}
                className="rounded-xl p-4 sm:p-5 border transition-colors hover:border-zinc-700"
                style={{ background: '#141414', borderColor: '#2A2A2A' }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-white break-words">{tipo.nombre}</p>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        {tipo.codigo}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full ${
                        tipo.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {tipo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-2">
                      Flujo: {tipo.flujo === 'puntos' ? 'Por puntos' : 'Simple'}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {tipo.servicios_count} servicio{tipo.servicios_count === 1 ? '' : 's'} asociado{tipo.servicios_count === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <button
                      onClick={() => openEditar(tipo)}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActivo(tipo)}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {tipo.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    {tipo.codigo !== 'reparto' && tipo.servicios_count === 0 && (
                      <button
                        onClick={() => eliminar(tipo)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto border"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-5">
              {editando ? 'Editar tipo de servicio' : 'Nuevo tipo de servicio'}
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
                <p className="text-sm text-red-400 break-words">{error}</p>
              </div>
            )}

            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  Código
                </label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="Ej: fruta"
                  disabled={!!editando}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors disabled:opacity-60"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
                {editando && (
                  <p className="text-xs text-zinc-600 mt-1">El código no se puede modificar.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Fruta"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  Flujo del chofer
                </label>
                <select
                  value={form.flujo}
                  onChange={(e) => setForm({ ...form, flujo: e.target.value as 'simple' | 'puntos' })}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                >
                  <option value="simple">Simple (km inicio y término)</option>
                  <option value="puntos">Por puntos (retiro / entrega)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="rounded accent-emerald-600"
                />
                <label htmlFor="activo" className="text-sm text-zinc-400">Activo</label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#10B981' }}
                >
                  {saving ? 'Guardando...' : editando ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
