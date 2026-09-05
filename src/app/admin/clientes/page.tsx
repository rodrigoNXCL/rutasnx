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
    return <div className="text-slate-600">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <button
          onClick={openNuevo}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          + Nuevo Cliente
        </button>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">RUT</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Teléfono</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Acceso Portal</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay clientes registrados
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900 font-medium">{cliente.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{cliente.rut || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{cliente.email || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{cliente.telefono || '-'}</td>
                  <td className="px-4 py-3">
                    {cliente.usuarios ? (
                      <span className="text-emerald-600 text-sm">✓ {cliente.usuarios.email}</span>
                    ) : (
                      <span className="text-slate-400 text-sm">Sin acceso</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      cliente.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEditar(cliente)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">
                      Editar
                    </button>
                    <button onClick={() => eliminar(cliente.id)} className="text-red-600 hover:text-red-800 text-sm">
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
              {editCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">RUT</label>
                <input
                  type="text"
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: e.target.value })}
                  placeholder="76.123.456-7"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Contacto</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                />
              </div>

              {!editCliente && (
                <>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="crear_usuario"
                        checked={form.crear_usuario}
                        onChange={(e) => setForm({ ...form, crear_usuario: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <label htmlFor="crear_usuario" className="ml-2 text-sm font-medium text-slate-700">
                        Crear acceso para portal cliente
                      </label>
                    </div>

                    {form.crear_usuario && (
                      <div className="space-y-4 pl-2 border-l-2 border-emerald-200">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Contraseña *</label>
                          <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            minLength={6}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                            required={form.crear_usuario}
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            El usuario será su RUT: {form.rut || '...'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="activo" className="ml-2 text-sm text-slate-700">Cliente activo</label>
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
