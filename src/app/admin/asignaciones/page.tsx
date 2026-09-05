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
    return <div className="text-slate-600">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Asignaciones</h1>
        <button
          onClick={openNuevo}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          + Nueva Asignación
        </button>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Chofer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Camión</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Servicio</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {asignaciones.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No hay asignaciones registradas
                </td>
              </tr>
            ) : (
              asignaciones.map((a) => (
                <tr key={a.id} className={`hover:bg-slate-50 ${!a.activo ? 'bg-gray-50 text-gray-400' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{a.choferes?.nombre || '-'}</div>
                    <div className="text-sm text-slate-500">{a.choferes?.rut || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.camiones?.patente || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900">{a.servicios?.nombre || '-'}</div>
                    {a.servicios && (
                      <div className="text-sm text-slate-500">
                        {servicios.find(s => s.id === a.servicios?.id)?.clientes?.nombre || ''}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActivo(a)}
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium cursor-pointer ${
                        a.activo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {a.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => eliminar(a.id)} className="text-red-600 hover:text-red-800 text-sm">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-900">Nueva Asignación</h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Servicio *</label>
                <select
                  value={form.servicio_id}
                  onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} {s.clientes ? `- ${s.clientes.nombre}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Chofer *</label>
                <select
                  value={form.chofer_id}
                  onChange={(e) => setForm({ ...form, chofer_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                  required
                >
                  <option value="">Seleccionar chofer</option>
                  {choferes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.rut ? `(${c.rut})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Camión *</label>
                <select
                  value={form.camion_id}
                  onChange={(e) => setForm({ ...form, camion_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                  required
                >
                  <option value="">Seleccionar camión</option>
                  {camiones.map(c => (
                    <option key={c.id} value={c.id}>{c.patente} {c.marca ? `- ${c.marca}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
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
