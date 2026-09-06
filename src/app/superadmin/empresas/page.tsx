'use client'

import { useState, useEffect, Fragment } from 'react'

interface Empresa {
  id: string
  nombre: string
  rut: string
  telefono: string | null
  email: string | null
  activo: boolean
  created_at: string
}

interface Admin {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  ultimo_login: string | null
  created_at: string
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [adminsPorEmpresa, setAdminsPorEmpresa] = useState<Record<string, Admin[]>>({})
  const [loading, setLoading] = useState(true)

  const [showEmpresaModal, setShowEmpresaModal] = useState(false)
  const [editEmpresa, setEditEmpresa] = useState<Empresa | null>(null)
  const [empresaForm, setEmpresaForm] = useState({ nombre: '', rut: '', telefono: '', email: '', activo: true })
  const [empresaError, setEmpresaError] = useState('')
  const [empresaSaving, setEmpresaSaving] = useState(false)

  const [showAdminModal, setShowAdminModal] = useState<string | null>(null)
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null)
  const [adminForm, setAdminForm] = useState({ nombre: '', email: '', password: '', activo: true })
  const [adminError, setAdminError] = useState('')
  const [adminSaving, setAdminSaving] = useState(false)

  const [expandedEmpresa, setExpandedEmpresa] = useState<string | null>(null)

  useEffect(() => {
    fetchEmpresas()
  }, [])

  async function fetchEmpresas() {
    try {
      const res = await fetch('/api/empresas')
      if (res.ok) {
        const data = await res.json()
        setEmpresas(data)
      }
    } catch (error) {
      console.error('Error fetching empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAdmins(empresaId: string) {
    try {
      const res = await fetch(`/api/empresas/${empresaId}/admins`)
      if (res.ok) {
        const data = await res.json()
        setAdminsPorEmpresa(prev => ({ ...prev, [empresaId]: data }))
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }

  function openNuevaEmpresa() {
    setEditEmpresa(null)
    setEmpresaForm({ nombre: '', rut: '', telefono: '', email: '', activo: true })
    setShowEmpresaModal(true)
  }

  function openEditarEmpresa(empresa: Empresa) {
    setEditEmpresa(empresa)
    setEmpresaForm({
      nombre: empresa.nombre,
      rut: empresa.rut,
      telefono: empresa.telefono || '',
      email: empresa.email || '',
      activo: empresa.activo
    })
    setShowEmpresaModal(true)
  }

  async function guardarEmpresa(e: React.FormEvent) {
    e.preventDefault()
    setEmpresaError('')
    setEmpresaSaving(true)
    try {
      const url = editEmpresa ? `/api/empresas/${editEmpresa.id}` : '/api/empresas'
      const method = editEmpresa ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaForm),
      })

      if (res.ok) {
        setShowEmpresaModal(false)
        fetchEmpresas()
      } else {
        const data = await res.json()
        setEmpresaError(data.error || 'Error al guardar')
      }
    } catch (error) {
      setEmpresaError('Error de conexión')
    } finally {
      setEmpresaSaving(false)
    }
  }

  function openNuevoAdmin(empresaId: string) {
    setEditAdmin(null)
    setAdminForm({ nombre: '', email: '', password: '', activo: true })
    setShowAdminModal(empresaId)
  }

  function openEditarAdmin(admin: Admin, empresaId: string) {
    setEditAdmin(admin)
    setAdminForm({
      nombre: admin.nombre,
      email: admin.email,
      password: '',
      activo: admin.activo
    })
    setShowAdminModal(empresaId)
  }

  async function guardarAdmin(e: React.FormEvent, empresaId: string) {
    e.preventDefault()
    setAdminError('')
    setAdminSaving(true)
    try {
      if (editAdmin) {
        const res = await fetch(`/api/empresas/${empresaId}/admins/${editAdmin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adminForm),
        })
        if (res.ok) {
          setShowAdminModal(null)
          fetchAdmins(empresaId)
        } else {
          const data = await res.json()
          setAdminError(data.error || 'Error al guardar')
        }
      } else {
        const res = await fetch(`/api/empresas/${empresaId}/admins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adminForm),
        })
        if (res.ok) {
          setShowAdminModal(null)
          fetchAdmins(empresaId)
        } else {
          const data = await res.json()
          setAdminError(data.error || 'Error al guardar')
        }
      }
    } catch (error) {
      setAdminError('Error de conexión')
    } finally {
      setAdminSaving(false)
    }
  }

  async function eliminarAdmin(adminId: string, empresaId: string) {
    if (!confirm('¿Estás seguro de eliminar este admin?')) return
    try {
      const res = await fetch(`/api/empresas/${empresaId}/admins/${adminId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAdmins(empresaId)
      }
    } catch (error) {
      console.error('Error eliminando admin:', error)
    }
  }

  function toggleExpand(empresaId: string) {
    if (expandedEmpresa === empresaId) {
      setExpandedEmpresa(null)
    } else {
      setExpandedEmpresa(empresaId)
      if (!adminsPorEmpresa[empresaId]) {
        fetchAdmins(empresaId)
      }
    }
  }

  if (loading) {
    return <div className="text-slate-600">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
        <button
          onClick={openNuevaEmpresa}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          + Nueva Empresa
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {empresas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay empresas registradas
                </td>
              </tr>
            ) : (
              empresas.map((empresa) => (
                <Fragment key={empresa.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900 font-medium">{empresa.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{empresa.rut}</td>
                    <td className="px-4 py-3 text-slate-600">{empresa.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{empresa.telefono || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        empresa.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {empresa.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditarEmpresa(empresa)}
                        className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleExpand(empresa.id)}
                        className="text-slate-600 hover:text-slate-900 text-sm mr-3"
                      >
                        {expandedEmpresa === empresa.id ? 'Ocultar' : 'Ver'} Admins
                      </button>
                      <button
                        onClick={() => openNuevoAdmin(empresa.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        + Admin
                      </button>
                    </td>
                  </tr>
                  {expandedEmpresa === empresa.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 bg-slate-50">
                        <div className="pl-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Admins de {empresa.nombre}:</h4>
                          {adminsPorEmpresa[empresa.id]?.length > 0 ? (
                            <ul className="space-y-2">
                              {adminsPorEmpresa[empresa.id].map(admin => (
                                <li key={admin.id} className="flex items-center justify-between text-sm text-slate-600 bg-white p-2 rounded">
                                  <span>
                                    {admin.nombre} ({admin.email})
                                    {!admin.activo && <span className="text-red-500 ml-2">Inactivo</span>}
                                  </span>
                                  <div>
                                    <button
                                      onClick={() => openEditarAdmin(admin, empresa.id)}
                                      className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => eliminarAdmin(admin.id, empresa.id)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400">Sin admins registrados</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showEmpresaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              {editEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
            </h2>
            {empresaError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {empresaError}
              </div>
            )}
            <form onSubmit={guardarEmpresa} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  value={empresaForm.nombre}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, nombre: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">RUT</label>
                <input
                  type="text"
                  value={empresaForm.rut}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, rut: e.target.value })}
                  placeholder="76.123.456-7"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={empresaForm.email}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  type="text"
                  value={empresaForm.telefono}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, telefono: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={empresaForm.activo}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, activo: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="activo" className="ml-2 text-sm text-slate-700">Empresa activa</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEmpresaModal(false)}
                  className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={empresaSaving}
                  className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {empresaSaving ? 'Guardando...' : (editEmpresa ? 'Guardar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              {editAdmin ? 'Editar Admin' : 'Nuevo Admin'}
            </h2>
            {adminError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {adminError}
              </div>
            )}
            <form onSubmit={(e) => guardarAdmin(e, showAdminModal)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  value={adminForm.nombre}
                  onChange={(e) => setAdminForm({ ...adminForm, nombre: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {editAdmin ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  minLength={editAdmin ? 0 : 8}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400"
                  required={!editAdmin}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="adminActivo"
                  checked={adminForm.activo}
                  onChange={(e) => setAdminForm({ ...adminForm, activo: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="adminActivo" className="ml-2 text-sm text-slate-700">Admin activo</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(null)}
                  className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adminSaving}
                  className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {adminSaving ? 'Guardando...' : (editAdmin ? 'Guardar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
