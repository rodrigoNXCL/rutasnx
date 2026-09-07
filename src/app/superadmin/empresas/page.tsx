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
      const url = editAdmin
        ? `/api/empresas/${empresaId}/admins/${editAdmin.id}`
        : `/api/empresas/${empresaId}/admins`
      const method = editAdmin ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
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
    return <div className="p-8 text-sm text-zinc-500">Cargando...</div>
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Empresas</h1>
          <button
            onClick={openNuevaEmpresa}
            className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
            style={{ background: '#10B981' }}
          >
            + Nueva
          </button>
        </div>

        {empresas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin empresas registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {empresas.map((empresa) => (
              <Fragment key={empresa.id}>
                <div className="rounded-xl p-5 border transition-colors hover:border-zinc-700" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">{empresa.nombre}</p>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {empresa.rut} · {empresa.email || empresa.telefono || 'Sin contacto'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${
                        empresa.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {empresa.activo ? 'Activa' : 'Inactiva'}
                      </span>
                      <button onClick={() => openEditarEmpresa(empresa)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                        Editar
                      </button>
                      <button onClick={() => toggleExpand(empresa.id)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                        {expandedEmpresa === empresa.id ? 'Ocultar' : 'Admins'}
                      </button>
                      <button onClick={() => openNuevoAdmin(empresa.id)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                        + Admin
                      </button>
                    </div>
                  </div>

                  {expandedEmpresa === empresa.id && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Admins de {empresa.nombre}</p>
                      {adminsPorEmpresa[empresa.id]?.length > 0 ? (
                        <div className="space-y-2">
                          {adminsPorEmpresa[empresa.id].map(admin => (
                            <div key={admin.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: '#1A1A1A' }}>
                              <div>
                                <p className="text-sm font-medium text-white">{admin.nombre}</p>
                                <p className="text-xs text-zinc-500">{admin.email}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                {!admin.activo && <span className="text-xs text-red-400">Inactivo</span>}
                                <button onClick={() => openEditarAdmin(admin, empresa.id)} className="text-xs text-zinc-500 hover:text-white">
                                  Editar
                                </button>
                                <button onClick={() => eliminarAdmin(admin.id, empresa.id)} className="text-xs text-red-400 hover:text-red-300">
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">Sin admins</p>
                      )}
                    </div>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {showEmpresaModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowEmpresaModal(false)}>
          <div className="rounded-xl p-6 w-full max-w-md border" style={{ background: '#141414', borderColor: '#2A2A2A' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">
              {editEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
            </h2>
            {empresaError && (
              <p className="mb-4 text-sm text-red-400">{empresaError}</p>
            )}
            <form onSubmit={guardarEmpresa} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={empresaForm.nombre}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, nombre: e.target.value })}
                  placeholder="Nombre"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={empresaForm.rut}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, rut: e.target.value })}
                  placeholder="RUT"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  value={empresaForm.email}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, email: e.target.value })}
                  placeholder="Email"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
                <input
                  type="text"
                  value={empresaForm.telefono}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, telefono: e.target.value })}
                  placeholder="Teléfono"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="empActivo"
                  checked={empresaForm.activo}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, activo: e.target.checked })}
                  className="rounded accent-emerald-600"
                />
                <label htmlFor="empActivo" className="text-sm text-zinc-400">Activa</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmpresaModal(false)}
                  className="flex-1 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={empresaSaving}
                  className="flex-1 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#10B981' }}
                >
                  {empresaSaving ? 'Guardando...' : (editEmpresa ? 'Guardar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowAdminModal(null)}>
          <div className="rounded-xl p-6 w-full max-w-md border" style={{ background: '#141414', borderColor: '#2A2A2A' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">
              {editAdmin ? 'Editar Admin' : 'Nuevo Admin'}
            </h2>
            {adminError && (
              <p className="mb-4 text-sm text-red-400">{adminError}</p>
            )}
            <form onSubmit={(e) => guardarAdmin(e, showAdminModal)} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={adminForm.nombre}
                  onChange={(e) => setAdminForm({ ...adminForm, nombre: e.target.value })}
                  placeholder="Nombre"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="Email"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder={editAdmin ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required={!editAdmin}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="adminActivo"
                  checked={adminForm.activo}
                  onChange={(e) => setAdminForm({ ...adminForm, activo: e.target.checked })}
                  className="rounded accent-emerald-600"
                />
                <label htmlFor="adminActivo" className="text-sm text-zinc-400">Activo</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(null)}
                  className="flex-1 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adminSaving}
                  className="flex-1 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#10B981' }}
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