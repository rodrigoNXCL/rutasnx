'use client'

import { useState, useEffect } from 'react'

interface Chofer {
  id: string
  nombre: string
  rut: string | null
}

interface Camion {
  id: string
  patente: string
  marca: string | null
}

interface Servicio {
  id: string
  nombre: string
  clientes: { nombre: string } | null
}

interface Asignacion {
  id: string
  chofer_id: string
  camion_id: string
  servicio_id: string
  observaciones: string | null
  activo: boolean
  created_at: string
  choferes: { id: string; nombre: string; rut: string | null }
  camiones: { id: string; patente: string }
  servicios: { id: string; nombre: string }
}

export default function AsignacionesPage() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    chofer_id: '',
    camion_id: '',
    servicio_id: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [asigRes, choferRes, camionRes, servRes] = await Promise.all([
        fetch('/api/asignaciones'),
        fetch('/api/choferes'),
        fetch('/api/camiones'),
        fetch('/api/servicios'),
      ])

      if (asigRes.ok) setAsignaciones(await asigRes.json())
      if (choferRes.ok) setChoferes(await choferRes.json())
      if (camionRes.ok) setCamiones(await camionRes.json())
      if (servRes.ok) setServicios(await servRes.json())
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  function openNuevo() {
    setForm({ chofer_id: '', camion_id: '', servicio_id: '', observaciones: '' })
    setShowModal(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/asignaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setShowModal(false)
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error guardando:', error)
    }
  }

  async function toggleActivo(asignacion: Asignacion) {
    try {
      const res = await fetch(`/api/asignaciones/${asignacion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !asignacion.activo, observaciones: asignacion.observaciones }),
      })
      if (res.ok) fetchData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta asignación?')) return
    try {
      const res = await fetch(`/api/asignaciones/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">Asignaciones</h1>
          <button
            onClick={openNuevo}
            className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
            style={{ background: '#10B981' }}
          >
            + Nueva
          </button>
        </div>

        {asignaciones.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin asignaciones registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {asignaciones.map((a) => (
              <div key={a.id} className={`rounded-xl p-5 border transition-colors hover:border-zinc-700 ${!a.activo ? 'opacity-60' : ''}`} style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{a.choferes?.nombre || '-'}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {a.camiones?.patente || '-'} · {a.servicios?.nombre || '-'}
                    </p>
                    {a.servicios && (
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {servicios.find(s => s.id === a.servicios?.id)?.clientes?.nombre || ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleActivo(a)}
                      className={`text-xs px-2.5 py-1 rounded-full cursor-pointer ${
                        a.activo
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {a.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    <button onClick={() => eliminar(a.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
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
            <h2 className="text-lg font-semibold text-white mb-5">Nueva Asignación</h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <select
                  value={form.servicio_id}
                  onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                >
                  <option value="">Servicio</option>
                  {servicios.map(s => (
                    <option key={s.id} value={s.id} className="text-white">{s.nombre} {s.clientes ? `- ${s.clientes.nombre}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={form.chofer_id}
                  onChange={(e) => setForm({ ...form, chofer_id: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                >
                  <option value="">Chofer</option>
                  {choferes.map(c => (
                    <option key={c.id} value={c.id} className="text-white">{c.nombre} {c.rut ? `(${c.rut})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={form.camion_id}
                  onChange={(e) => setForm({ ...form, camion_id: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                >
                  <option value="">Camión</option>
                  {camiones.map(c => (
                    <option key={c.id} value={c.id} className="text-white">{c.patente} {c.marca ? `- ${c.marca}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Observaciones"
                  rows={2}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
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
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}