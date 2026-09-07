'use client'

import { useState, useEffect } from 'react'

interface Camion {
  id: string
  patente: string
  marca: string | null
  modelo: string | null
  ano: number | null
  activo: boolean
  created_at: string
}

export default function CamionesPage() {
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCamion, setEditCamion] = useState<Camion | null>(null)
  const [form, setForm] = useState({ patente: '', marca: '', modelo: '', ano: '', activo: true })

  useEffect(() => {
    fetchCamiones()
  }, [])

  async function fetchCamiones() {
    try {
      const res = await fetch('/api/camiones')
      if (res.ok) {
        setCamiones(await res.json())
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  function openNuevo() {
    setEditCamion(null)
    setForm({ patente: '', marca: '', modelo: '', ano: '', activo: true })
    setShowModal(true)
  }

  function openEditar(camion: Camion) {
    setEditCamion(camion)
    setForm({
      patente: camion.patente,
      marca: camion.marca || '',
      modelo: camion.modelo || '',
      ano: camion.ano?.toString() || '',
      activo: camion.activo
    })
    setShowModal(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editCamion ? `/api/camiones/${editCamion.id}` : '/api/camiones'
      const method = editCamion ? 'PUT' : 'POST'

      const body = {
        ...form,
        ano: form.ano ? parseInt(form.ano) : null
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        fetchCamiones()
      }
    } catch (error) {
      console.error('Error guardando:', error)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este camión?')) return
    try {
      const res = await fetch(`/api/camiones/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCamiones()
      }
    } catch (error) {
      console.error('Error eliminando:', error)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-zinc-500">Cargando...</div>
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Camiones</h1>
          <button
            onClick={openNuevo}
            className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
            style={{ background: '#10B981' }}
          >
            + Nuevo
          </button>
        </div>

        {camiones.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin camiones registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {camiones.map((camion) => (
              <div key={camion.id} className="rounded-xl p-5 border transition-colors hover:border-zinc-700" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{camion.patente}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {[camion.marca, camion.modelo, camion.ano].filter(Boolean).join(' · ') || 'Sin detalles'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      camion.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {camion.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button onClick={() => openEditar(camion)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                      Editar
                    </button>
                    <button onClick={() => eliminar(camion.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowModal(false)}>
          <div className="rounded-xl p-6 w-full max-w-md border" style={{ background: '#141414', borderColor: '#2A2A2A' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">
              {editCamion ? 'Editar Camión' : 'Nuevo Camión'}
            </h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={form.patente}
                  onChange={(e) => setForm({ ...form, patente: e.target.value.toUpperCase() })}
                  placeholder="Patente (BBBB-00)"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  placeholder="Marca"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
                <input
                  type="text"
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  placeholder="Modelo"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
              </div>
              <div>
                <input
                  type="number"
                  value={form.ano}
                  onChange={(e) => setForm({ ...form, ano: e.target.value })}
                  placeholder="Año"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-90"
                  style={{ background: '#10B981' }}
                >
                  {editCamion ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}