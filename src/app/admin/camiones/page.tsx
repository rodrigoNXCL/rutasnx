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
    return <div className="text-slate-600">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Camiones</h1>
        <button
          onClick={openNuevo}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          + Nuevo Camión
        </button>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Patente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Marca</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Modelo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Año</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {camiones.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay camiones registrados
                </td>
              </tr>
            ) : (
              camiones.map((camion) => (
                <tr key={camion.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900 font-bold">{camion.patente}</td>
                  <td className="px-4 py-3 text-slate-600">{camion.marca || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{camion.modelo || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{camion.ano || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      camion.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {camion.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEditar(camion)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">
                      Editar
                    </button>
                    <button onClick={() => eliminar(camion.id)} className="text-red-600 hover:text-red-800 text-sm">
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
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              {editCamion ? 'Editar Camión' : 'Nuevo Camión'}
            </h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Patente *</label>
                <input
                  type="text"
                  value={form.patente}
                  onChange={(e) => setForm({ ...form, patente: e.target.value.toUpperCase() })}
                  placeholder="BBBB-00"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Marca</label>
                  <input
                    type="text"
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    placeholder="Ej: Volvo"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Modelo</label>
                  <input
                    type="text"
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    placeholder="Ej: FH 440"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Año</label>
                <input
                  type="number"
                  value={form.ano}
                  onChange={(e) => setForm({ ...form, ano: e.target.value })}
                  placeholder="2020"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="activo" className="ml-2 text-sm text-slate-700">Camión activo</label>
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
