'use client'

import { useEffect, useState } from 'react'
import PuntosRuta from '@/app/chofer/registro/PuntosRuta'

interface TipoServicio {
  id: string
  codigo: string
  nombre: string
  flujo: 'simple' | 'puntos'
}

interface Ruta {
  id: string
  fecha: string
  km_inicio: number
  km_termino: number | null
  estado: string
  iniciado_at: string
  cerrado_at: string | null
  cliente_id: string | null
  tipo_servicio_id: string
  camiones: { id: string; patente: string; marca: string | null } | null
  choferes: { id: string; nombre: string } | null
  servicios: { id: string; nombre: string } | null
  tipos_servicio: TipoServicio | null
  puntos_count: number
  primera_guia: string | null
}

interface Opcion {
  id: string
  nombre: string
}

function fechaChile(diasAtras: number): string {
  const fecha = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000)
  return fecha.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}

function formatFecha(value: string): string {
  return new Date(value + 'T00:00:00').toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
  })
}

export default function AdminRutas() {
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [choferes, setChoferes] = useState<Opcion[]>([])
  const [clientes, setClientes] = useState<Opcion[]>([])
  const [tipos, setTipos] = useState<TipoServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [filtros, setFiltros] = useState({
    desde: fechaChile(6),
    hasta: fechaChile(0),
    estado: '',
    chofer_id: '',
    cliente_id: '',
    tipo_servicio_id: '',
  })

  const [seleccionada, setSeleccionada] = useState<Ruta | null>(null)
  const [editKmInicio, setEditKmInicio] = useState('')
  const [editKmTermino, setEditKmTermino] = useState('')
  const [editObs, setEditObs] = useState('')
  const [editMotivo, setEditMotivo] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    cargarCatalogos()
    cargarRutas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cargarCatalogos() {
    try {
      const [resChoferes, resClientes, resTipos] = await Promise.all([
        fetch('/api/choferes'),
        fetch('/api/clientes'),
        fetch('/api/tipos-servicio'),
      ])

      if (resChoferes.ok) setChoferes(await resChoferes.json())
      if (resClientes.ok) setClientes(await resClientes.json())
      if (resTipos.ok) setTipos(await resTipos.json())
    } catch (err) {
      console.error('Error cargando catálogos:', err)
    }
  }

  async function cargarRutas() {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        desde: filtros.desde,
        hasta: filtros.hasta,
      })

      if (filtros.estado) params.set('estado', filtros.estado)
      if (filtros.chofer_id) params.set('chofer_id', filtros.chofer_id)
      if (filtros.cliente_id) params.set('cliente_id', filtros.cliente_id)
      if (filtros.tipo_servicio_id) params.set('tipo_servicio_id', filtros.tipo_servicio_id)

      const res = await fetch(`/api/admin/viajes?${params.toString()}`)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error cargando rutas')
        return
      }

      setRutas(await res.json())
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function abrirRuta(ruta: Ruta) {
    setSeleccionada(ruta)
    setEditKmInicio(String(ruta.km_inicio))
    setEditKmTermino(ruta.km_termino != null ? String(ruta.km_termino) : '')
    setEditObs('')
    setEditMotivo('')
    setEditError('')
    setSuccess('')
  }

  function cerrarRuta() {
    setSeleccionada(null)
    setEditError('')
  }

  async function guardarRuta(e: React.FormEvent) {
    e.preventDefault()

    if (!seleccionada) return

    setEditError('')
    setSuccess('')

    if (seleccionada.tipos_servicio?.flujo === 'puntos' && !editMotivo.trim()) {
      setEditError('El motivo de la corrección es obligatorio')
      return
    }

    const kmInicio = parseInt(editKmInicio)
    const kmTermino = editKmTermino ? parseInt(editKmTermino) : null

    if (!Number.isInteger(kmInicio) || kmInicio < 0) {
      setEditError('Odómetro inicial inválido')
      return
    }

    if (kmTermino !== null && (!Number.isInteger(kmTermino) || kmTermino < kmInicio)) {
      setEditError('Km término debe ser mayor o igual a km inicio')
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/viajes/${seleccionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          km_inicio: kmInicio,
          km_termino: kmTermino,
          observaciones: editObs || null,
          motivo: editMotivo.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setEditError(data.error || 'Error guardando la ruta')
        return
      }

      setSeleccionada({
        ...seleccionada,
        km_inicio: kmInicio,
        km_termino: kmTermino,
      })
      setEditMotivo('')
      setSuccess('Ruta actualizada')
      await cargarRutas()

      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setEditError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Rutas</h1>
          <p className="text-sm text-zinc-500 mt-1">Consulta y corrige rutas, puntos y evidencias.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          cargarRutas()
        }}
        className="rounded-xl p-4 border mb-6"
        style={{ background: '#141414', borderColor: '#2A2A2A' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
            >
              <option value="">Todos</option>
              <option value="en_curso">En curso</option>
              <option value="terminado">Terminadas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Tipo</label>
            <select
              value={filtros.tipo_servicio_id}
              onChange={(e) => setFiltros({ ...filtros, tipo_servicio_id: e.target.value })}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
            >
              <option value="">Todos</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Chófer</label>
            <select
              value={filtros.chofer_id}
              onChange={(e) => setFiltros({ ...filtros, chofer_id: e.target.value })}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
            >
              <option value="">Todos</option>
              {choferes.map((chofer) => (
                <option key={chofer.id} value={chofer.id}>{chofer.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Cliente</label>
            <select
              value={filtros.cliente_id}
              onChange={(e) => setFiltros({ ...filtros, cliente_id: e.target.value })}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
            >
              <option value="">Todos</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: '#10B981' }}
            >
              {loading ? 'Filtrando...' : 'Filtrar'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mb-5 p-4 rounded-xl border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando rutas...</p>
      ) : rutas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500">Sin rutas en el periodo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {rutas.map((ruta) => (
            <div
              key={ruta.id}
              className="rounded-xl p-4 border"
              style={{ background: '#141414', borderColor: '#2A2A2A' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{formatFecha(ruta.fecha)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      ruta.estado === 'en_curso'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {ruta.estado === 'en_curso' ? 'En curso' : 'Terminada'}
                    </span>
                    {ruta.tipos_servicio && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        {ruta.tipos_servicio.nombre}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 truncate">
                    {ruta.servicios?.nombre || 'Sin servicio'}
                    {ruta.choferes ? ` · ${ruta.choferes.nombre}` : ''}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {ruta.camiones?.patente || 'Sin camión'} · {ruta.puntos_count} punto(s)
                  </p>
                </div>

                {ruta.primera_guia && (
                  <a href={ruta.primera_guia} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={ruta.primera_guia} alt="Guía" className="w-12 h-12 rounded-lg object-cover" />
                  </a>
                )}
              </div>

              <div className="flex items-end justify-between mt-4">
                <div>
                  <p className="text-sm text-white">
                    {ruta.km_inicio.toLocaleString('es-CL')} → {ruta.km_termino != null ? ruta.km_termino.toLocaleString('es-CL') : '...'}
                  </p>
                  {ruta.km_termino != null && (
                    <p className="text-xs text-emerald-400">
                      +{(ruta.km_termino - ruta.km_inicio).toLocaleString('es-CL')} km
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => abrirRuta(ruta)}
                  className="text-xs text-white px-3 py-2 rounded-lg border transition-colors hover:bg-zinc-800"
                  style={{ borderColor: '#2A2A2A' }}
                >
                  Gestionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {seleccionada && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 py-6" onClick={cerrarRuta}>
          <div
            className="rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border"
            style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-5 py-4 border-b" style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}>
              <div>
                <p className="text-sm font-medium text-white">
                  Ruta {formatFecha(seleccionada.fecha)}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {seleccionada.servicios?.nombre || 'Sin servicio'}
                  {seleccionada.choferes ? ` · ${seleccionada.choferes.nombre}` : ''}
                  {seleccionada.camiones ? ` · ${seleccionada.camiones.patente}` : ''}
                </p>
              </div>
              <button type="button" onClick={cerrarRuta} className="text-zinc-500 hover:text-white transition-colors">
                Cerrar
              </button>
            </div>

            <div className="p-5 space-y-5">
              {editError && (
                <div className="p-3 rounded-lg border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
                  <p className="text-xs text-red-400">{editError}</p>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg border" style={{ background: '#0D2D1D', borderColor: '#0D5D3D' }}>
                  <p className="text-xs text-emerald-400">{success}</p>
                </div>
              )}

              <form onSubmit={guardarRuta} className="rounded-xl p-4 border space-y-3" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <p className="text-sm font-medium text-white">Datos de la ruta</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Km inicio</label>
                    <input
                      type="number"
                      value={editKmInicio}
                      onChange={(e) => setEditKmInicio(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
                      style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Km término</label>
                    <input
                      type="number"
                      value={editKmTermino}
                      onChange={(e) => setEditKmTermino(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
                      style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Observaciones</label>
                  <textarea
                    value={editObs}
                    onChange={(e) => setEditObs(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                    style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                    placeholder="Notas de la ruta"
                  />
                </div>

                {seleccionada.tipos_servicio?.flujo === 'puntos' && (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Motivo de la corrección *</label>
                    <textarea
                      value={editMotivo}
                      onChange={(e) => setEditMotivo(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                      style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                      placeholder="Explica qué se corrigió y por qué"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: '#10B981' }}
                >
                  {saving ? 'Guardando...' : 'Guardar datos de ruta'}
                </button>
              </form>

              {seleccionada.tipos_servicio?.flujo === 'puntos' && (
                <PuntosRuta
                  viajeId={seleccionada.id}
                  clienteId={seleccionada.cliente_id}
                  kmInicio={seleccionada.km_inicio}
                  soloEdicion={seleccionada.estado !== 'en_curso'}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
