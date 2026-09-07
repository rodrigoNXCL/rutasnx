'use client'

import { useState, useEffect } from 'react'

interface Cliente {
  id: string
  nombre: string
}

interface Servicio {
  id: string
  cliente_id: string
  nombre: string
  descripcion: string | null
  origen: string | null
  destino: string | null
  precio_km: number | null
  precio_base: number | null
  activo: boolean
  created_at: string
  clientes: { nombre: string }
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editServicio, setEditServicio] = useState<Servicio | null>(null)
  const [form, setForm] = useState({
    cliente_id: '',
    nombre: '',
    descripcion: '',
    origen: '',
    destino: '',
    precio_km: '',
    precio_base: '',
    activo: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [servRes, cliRes] = await Promise.all([
        fetch('/api/servicios'),
        fetch('/api/clientes')
      ])
      if (servRes.ok && cliRes.ok) {
        setServicios(await servRes.json())
        setClientes(await cliRes.json())
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  function openNuevo() {
    setEditServicio(null)
    setForm({ cliente_id: '', nombre: '', descripcion: '', origen: '', destino: '', precio_km: '', precio_base: '', activo: true })
    setShowModal(true)
  }

  function openEditar(servicio: Servicio) {
    setEditServicio(servicio)
    setForm({
      cliente_id: servicio.cliente_id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      origen: servicio.origen || '',
      destino: servicio.destino || '',
      precio_km: servicio.precio_km?.toString() || '',
      precio_base: servicio.precio_base?.toString() || '',
      activo: servicio.activo
    })
    setShowModal(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editServicio ? `/api/servicios/${editServicio.id}` : '/api/servicios'
      const method = editServicio ? 'PUT' : 'POST'

      const body = {
        ...form,
        precio_km: form.precio_km ? parseFloat(form.precio_km) : null,
        precio_base: form.precio_base ? parseFloat(form.precio_base) : null
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error guardando:', error)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    try {
      const res = await fetch(`/api/servicios/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">Servicios</h1>
          <button
            onClick={openNuevo}
            className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
            style={{ background: '#10B981' }}
          >
            + Nuevo
          </button>
        </div>

        {servicios.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin servicios registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="rounded-xl p-5 border transition-colors hover:border-zinc-700" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{servicio.nombre}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {servicio.clientes?.nombre || 'Sin cliente'}
                      {servicio.origen && servicio.destino && ` · ${servicio.origen} → ${servicio.destino}`}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {servicio.precio_base ? `$${servicio.precio_base.toLocaleString('es-CL')}` : ''}
                      {servicio.precio_km && ` · $${servicio.precio_km.toLocaleString('es-CL')}/km`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      servicio.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {servicio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button onClick={() => openEditar(servicio)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                      Editar
                    </button>
                    <button onClick={() => eliminar(servicio.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
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
          <div className="rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border" style={{ background: '#141414', borderColor: '#2A2A2A' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">
              {editServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <select
                  value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                >
                  <option value="" className="text-white">Seleccionar cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id} className="text-white">{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del servicio"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.origen}
                  onChange={(e) => setForm({ ...form, origen: e.target.value })}
                  placeholder="Origen"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
                <input
                  type="text"
                  value={form.destino}
                  onChange={(e) => setForm({ ...form, destino: e.target.value })}
                  placeholder="Destino"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={form.precio_base}
                  onChange={(e) => setForm({ ...form, precio_base: e.target.value })}
                  placeholder="Precio base"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
                <input
                  type="number"
                  value={form.precio_km}
                  onChange={(e) => setForm({ ...form, precio_km: e.target.value })}
                  placeholder="Precio/km"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
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
                  {editServicio ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}