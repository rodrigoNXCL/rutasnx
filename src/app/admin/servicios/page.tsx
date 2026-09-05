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
    return <div className="text-slate-600">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Servicios</h1>
        <button
          onClick={openNuevo}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          + Nuevo Servicio
        </button>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Precio Base</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Precio/KM</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {servicios.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay servicios registrados
                </td>
              </tr>
            ) : (
              servicios.map((servicio) => (
                <tr key={servicio.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900 font-medium">{servicio.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{servicio.clientes?.nombre || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {servicio.precio_base ? `$${servicio.precio_base.toLocaleString('es-CL')}` : '$0'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {servicio.precio_km ? `$${servicio.precio_km.toLocaleString('es-CL')}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      servicio.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {servicio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEditar(servicio)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">
                      Editar
                    </button>
                    <button onClick={() => eliminar(servicio.id)} className="text-red-600 hover:text-red-800 text-sm">
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              {editServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Cliente *</label>
                <select
                  value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Ruta Zona Norte"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Origen</label>
                  <input
                    type="text"
                    value={form.origen}
                    onChange={(e) => setForm({ ...form, origen: e.target.value })}
                    placeholder="Ej: Santiago"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Destino</label>
                  <input
                    type="text"
                    value={form.destino}
                    onChange={(e) => setForm({ ...form, destino: e.target.value })}
                    placeholder="Ej: San Bernardo"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Precio Base (CLP)</label>
                  <input
                    type="number"
                    value={form.precio_base}
                    onChange={(e) => setForm({ ...form, precio_base: e.target.value })}
                    placeholder="0"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Precio por KM (CLP)</label>
                  <input
                    type="number"
                    value={form.precio_km}
                    onChange={(e) => setForm({ ...form, precio_km: e.target.value })}
                    placeholder="Ej: 150"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="activo" className="ml-2 text-sm text-slate-700">Servicio activo</label>
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
