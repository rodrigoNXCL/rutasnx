'use client'

import { useState, useEffect } from 'react'

interface Chofer {
  id: string
  nombre: string
  rut: string | null
  licencia: string | null
  telefono: string | null
  activo: boolean
  created_at: string
  usuarios: { email: string } | null
}

export default function ChoferesPage() {
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editChofer, setEditChofer] = useState<Chofer | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    licencia: '',
    telefono: '',
    activo: true,
    crear_usuario: false,
    password: ''
  })

  useEffect(() => {
    fetchChoferes()
  }, [])

  async function fetchChoferes() {
    try {
      const res = await fetch('/api/choferes')
      if (res.ok) {
        setChoferes(await res.json())
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  function openNuevo() {
    setEditChofer(null)
    setForm({
      nombre: '',
      rut: '',
      licencia: '',
      telefono: '',
      activo: true,
      crear_usuario: false,
      password: ''
    })
    setShowModal(true)
  }

  function openEditar(chofer: Chofer) {
    setEditChofer(chofer)
    setForm({
      nombre: chofer.nombre,
      rut: chofer.rut || '',
      licencia: chofer.licencia || '',
      telefono: chofer.telefono || '',
      activo: chofer.activo,
      crear_usuario: false,
      password: ''
    })
    setShowModal(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editChofer ? `/api/choferes/${editChofer.id}` : '/api/choferes'
      const method = editChofer ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setShowModal(false)
        fetchChoferes()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error guardando:', error)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este chófer?')) return
    try {
      const res = await fetch(`/api/choferes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchChoferes()
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">Chóferes</h1>
          <button
            onClick={openNuevo}
            className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
            style={{ background: '#10B981' }}
          >
            + Nuevo
          </button>
        </div>

        {choferes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin chóferes registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {choferes.map((chofer) => (
              <div key={chofer.id} className="rounded-xl p-5 border transition-colors hover:border-zinc-700" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{chofer.nombre}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {[chofer.rut, chofer.licencia, chofer.telefono].filter(Boolean).join(' · ') || 'Sin detalles'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {chofer.usuarios ? (
                      <span className="text-xs text-emerald-400">{chofer.usuarios.email}</span>
                    ) : (
                      <span className="text-xs text-zinc-600">Sin acceso</span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      chofer.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {chofer.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button onClick={() => openEditar(chofer)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                      Editar
                    </button>
                    <button onClick={() => eliminar(chofer.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
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
              {editChofer ? 'Editar Chófer' : 'Nuevo Chófer'}
            </h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: e.target.value })}
                  placeholder="RUT"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.licencia}
                  onChange={(e) => setForm({ ...form, licencia: e.target.value })}
                  placeholder="Licencia"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Teléfono"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
              </div>

              {!editChofer && (
                <div className="border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="crear_usuario"
                      checked={form.crear_usuario}
                      onChange={(e) => setForm({ ...form, crear_usuario: e.target.checked })}
                      className="rounded accent-emerald-600"
                    />
                    <label htmlFor="crear_usuario" className="text-sm text-zinc-400">
                      Crear acceso móvil
                    </label>
                  </div>

                  {form.crear_usuario && (
                    <div>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Contraseña"
                        className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                        style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                        required={form.crear_usuario}
                      />
                    </div>
                  )}
                </div>
              )}

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
                  {editChofer ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}