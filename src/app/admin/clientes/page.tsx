'use client'

import { useState, useEffect } from 'react'

interface Cliente {
  id: string
  nombre: string
  rut: string | null
  telefono: string | null
  email: string | null
  activo: boolean
  created_at: string
  usuarios: { email: string } | null
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCliente, setEditCliente] = useState<Cliente | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    telefono: '',
    email: '',
    activo: true,
    crear_usuario: false,
    password: ''
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    try {
      const res = await fetch('/api/clientes')
      if (res.ok) {
        setClientes(await res.json())
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  function openNuevo() {
    setEditCliente(null)
    setForm({
      nombre: '',
      rut: '',
      telefono: '',
      email: '',
      activo: true,
      crear_usuario: false,
      password: ''
    })
    setShowModal(true)
  }

  function openEditar(cliente: Cliente) {
    setEditCliente(cliente)
    setForm({
      nombre: cliente.nombre,
      rut: cliente.rut || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      activo: cliente.activo,
      crear_usuario: false,
      password: ''
    })
    setShowModal(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editCliente ? `/api/clientes/${editCliente.id}` : '/api/clientes'
      const method = editCliente ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setShowModal(false)
        fetchClientes()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error guardando:', error)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchClientes()
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">Clientes</h1>
          <button
            onClick={openNuevo}
            className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
            style={{ background: '#10B981' }}
          >
            + Nuevo
          </button>
        </div>

        {clientes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin clientes registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="rounded-xl p-5 border transition-colors hover:border-zinc-700" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{cliente.nombre}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {[cliente.email, cliente.telefono].filter(Boolean).join(' · ') || 'Sin contacto'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {cliente.usuarios ? (
                      <span className="text-xs text-emerald-400">{cliente.usuarios.email}</span>
                    ) : (
                      <span className="text-xs text-zinc-600">Sin acceso</span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      cliente.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button onClick={() => openEditar(cliente)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                      Editar
                    </button>
                    <button onClick={() => eliminar(cliente.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
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
              {editCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre"
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
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
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

              {!editCliente && (
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
                      Crear acceso portal
                    </label>
                  </div>

                  {form.crear_usuario && (
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Contraseña"
                      className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                      style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                      required={form.crear_usuario}
                    />
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
                  {editCliente ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}