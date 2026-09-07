'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Gasto {
  id: string
  tipo: string
  monto: number
  descripcion: string | null
  foto_url: string | null
}

interface Viaje {
  id: string
  fecha: string
  km_inicio: number
  km_termino: number | null
  foto_km_inicio: string | null
  foto_km_termino: string | null
  estado: string
  observaciones: string | null
  created_at: string
  camiones: { patente: string; marca: string | null } | null
  servicios: { nombre: string; origen: string | null; destino: string | null } | null
  gastos: Gasto[]
}

interface GastoEdit {
  id: string | null
  tipo: string
  monto: string
  descripcion: string
  foto: File | null
  fotoPreview: string | null
  fotoUrl: string | null
  eliminar: boolean
}

const TIPO_GASTO = [
  { value: 'combustible', label: 'Combustible' },
  { value: 'peaje', label: 'Peaje' },
  { value: 'comida', label: 'Comida' },
  { value: 'mecanico', label: 'Mecánico' },
  { value: 'otro', label: 'Otro' },
]

export default function ChoferHistorial() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedViaje, setExpandedViaje] = useState<string | null>(null)

  const [editando, setEditando] = useState<Viaje | null>(null)
  const [editKmInicio, setEditKmInicio] = useState('')
  const [editKmTermino, setEditKmTermino] = useState('')
  const [editObs, setEditObs] = useState('')
  const [editFotoInicio, setEditFotoInicio] = useState<File | null>(null)
  const [editFotoInicioPrev, setEditFotoInicioPrev] = useState<string | null>(null)
  const [editFotoTermino, setEditFotoTermino] = useState<File | null>(null)
  const [editFotoTerminoPrev, setEditFotoTerminoPrev] = useState<string | null>(null)
  const [gastosEdit, setGastosEdit] = useState<GastoEdit[]>([])
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    fetchViajes()
  }, [])

  async function fetchViajes() {
    try {
      const res = await fetch('/api/viajes')
      if (res.ok) {
        setViajes(await res.json())
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Santiago',
    })
  }

  function formatDateShort(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Santiago',
    })
  }

  function openEditar(viaje: Viaje) {
    setEditando(viaje)
    setEditKmInicio(String(viaje.km_inicio))
    setEditKmTermino(viaje.km_termino != null ? String(viaje.km_termino) : '')
    setEditObs(viaje.observaciones || '')
    setEditFotoInicio(null)
    setEditFotoInicioPrev(null)
    setEditFotoTermino(null)
    setEditFotoTerminoPrev(null)
    setGastosEdit(
      (viaje.gastos || []).map((g) => ({
        id: g.id,
        tipo: g.tipo,
        monto: String(g.monto),
        descripcion: g.descripcion || '',
        foto: null,
        fotoPreview: null,
        fotoUrl: g.foto_url,
        eliminar: false,
      }))
    )
    setEditError('')
  }

  function updateGasto(index: number, patch: Partial<GastoEdit>) {
    setGastosEdit((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)))
  }

  function addGastoEditable() {
    setGastosEdit((prev) => [
      ...prev,
      { id: null, tipo: 'peaje', monto: '', descripcion: '', foto: null, fotoPreview: null, fotoUrl: null, eliminar: false },
    ])
  }

  async function uploadFoto(file: File, bucket: string): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      return data.url
    }
    return null
  }

  async function guardarEdicion() {
    if (!editando) return
    setSaving(true)
    setEditError('')

    try {
      let fotoInicioUrl: string | null = null
      let fotoTerminoUrl: string | null = null
      if (editFotoInicio) {
        fotoInicioUrl = await uploadFoto(editFotoInicio, 'km-fotos')
        if (!fotoInicioUrl) {
          setEditError('Error subiendo foto km inicio')
          return
        }
      }
      if (editFotoTermino) {
        fotoTerminoUrl = await uploadFoto(editFotoTermino, 'km-fotos')
        if (!fotoTerminoUrl) {
          setEditError('Error subiendo foto km término')
          return
        }
      }

      const kmInicio = parseInt(editKmInicio)
      const kmTermino = editKmTermino ? parseInt(editKmTermino) : null

      if (kmTermino != null && kmTermino < kmInicio) {
        setEditError('Km término debe ser mayor o igual a km inicio')
        return
      }

      const viajeBody: Record<string, unknown> = {
        km_inicio: kmInicio,
        km_termino: kmTermino,
        observaciones: editObs || null,
      }
      if (fotoInicioUrl) viajeBody.foto_km_inicio = fotoInicioUrl
      if (fotoTerminoUrl) viajeBody.foto_km_termino = fotoTerminoUrl

      const resViaje = await fetch(`/api/viajes/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(viajeBody),
      })

      if (!resViaje.ok) {
        const data = await resViaje.json().catch(() => ({}))
        setEditError(data.error || 'Error guardando la ruta')
        return
      }

      for (const g of gastosEdit) {
        if (g.eliminar) {
          if (g.id) {
            await fetch(`/api/gastos/${g.id}`, { method: 'DELETE' })
          }
          continue
        }

        const monto = parseInt(g.monto)
        if (!monto) continue

        let fotoUrl = g.fotoUrl
        if (g.foto) {
          const nueva = await uploadFoto(g.foto, 'gastos')
          if (!nueva) {
            setEditError('Error subiendo foto del gasto')
            return
          }
          fotoUrl = nueva
        }

        const body = {
          tipo: g.tipo,
          monto,
          descripcion: g.descripcion || null,
          foto_url: fotoUrl,
        }

        if (g.id) {
          await fetch(`/api/gastos/${g.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        } else {
          await fetch('/api/gastos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ viaje_id: editando.id, ...body }),
          })
        }
      }

      setEditando(null)
      fetchViajes()
    } catch (error) {
      console.error('Error guardando edición:', error)
      setEditError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-zinc-500">Cargando...</div>
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">Historial</h1>

        {viajes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin viajes registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {viajes.map((viaje) => (
              <div
                key={viaje.id}
                className="rounded-xl border overflow-hidden"
                style={{ background: '#141414', borderColor: '#2A2A2A' }}
              >
                <button
                  onClick={() => setExpandedViaje(expandedViaje === viaje.id ? null : viaje.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{formatDateShort(viaje.fecha)}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{viaje.camiones?.patente || 'Sin camión'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {viaje.km_inicio.toLocaleString('es-CL')} → {viaje.km_termino ? viaje.km_termino.toLocaleString('es-CL') : '...'}
                      </p>
                      {viaje.km_termino && (
                        <p className="text-xs text-emerald-400 mt-0.5">
                          +{(viaje.km_termino - viaje.km_inicio).toLocaleString('es-CL')} km
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      viaje.estado === 'en_curso'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {viaje.estado === 'en_curso' ? 'En curso' : 'Listo'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform ${expandedViaje === viaje.id ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedViaje === viaje.id && (
                  <div className="border-t px-5 py-5" style={{ borderColor: '#2A2A2A' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{formatDate(viaje.fecha)}</p>
                        {viaje.servicios && <p className="text-sm text-zinc-400 mt-0.5">{viaje.servicios.nombre}</p>}
                      </div>
                      <button
                        onClick={() => openEditar(viaje)}
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-3 py-1.5 hover:bg-zinc-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar ruta
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Viaje</h4>
                        <div className="space-y-2 text-sm">
                          <div className="pt-2">
                            <p className="text-zinc-500">Kilometraje</p>
                            <p className="text-white font-medium">{viaje.km_inicio.toLocaleString('es-CL')} km</p>
                            {viaje.km_termino && (
                              <>
                                <p className="text-white font-medium">{viaje.km_termino.toLocaleString('es-CL')} km</p>
                                <p className="text-emerald-400 text-sm">+{(viaje.km_termino - viaje.km_inicio).toLocaleString('es-CL')} km</p>
                              </>
                            )}
                          </div>
                          {viaje.observaciones && (
                            <p className="text-zinc-500">Obs: <span className="text-zinc-300">{viaje.observaciones}</span></p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          {viaje.foto_km_inicio && (
                            <a
                              href={viaje.foto_km_inicio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-zinc-400 border border-zinc-700 rounded-lg px-3 py-2 hover:bg-zinc-800 transition-colors"
                            >
                              Foto inicio
                            </a>
                          )}
                          {viaje.foto_km_termino && (
                            <a
                              href={viaje.foto_km_termino}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-zinc-400 border border-zinc-700 rounded-lg px-3 py-2 hover:bg-zinc-800 transition-colors"
                            >
                              Foto término
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Gastos</h4>
                        {viaje.gastos.length === 0 ? (
                          <p className="text-sm text-zinc-600">Sin gastos</p>
                        ) : (
                          <div className="space-y-2">
                            {viaje.gastos.map((gasto) => (
                              <div key={gasto.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: '#1A1A1A' }}>
                                <div>
                                  <p className="text-sm font-medium text-white capitalize">{gasto.tipo}</p>
                                  {gasto.descripcion && (
                                    <p className="text-xs text-zinc-500">{gasto.descripcion}</p>
                                  )}
                                  {gasto.foto_url && (
                                    <a
                                      href={gasto.foto_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      Ver comprobante
                                    </a>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-white">{formatCLP(gasto.monto)}</p>
                              </div>
                            ))}
                            <div className="flex justify-between items-center pt-2">
                              <p className="text-sm font-medium text-zinc-500">Total</p>
                              <p className="text-base font-semibold text-white">{formatCLP(viaje.gastos.reduce((sum, g) => sum + g.monto, 0))}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {viaje.estado === 'en_curso' && (
                      <div className="mt-6 pt-5 border-t" style={{ borderColor: '#2A2A2A' }}>
                        <Link
                          href={`/chofer/registro?fecha=${viaje.fecha}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-white px-5 py-2.5 rounded-lg transition-colors"
                          style={{ background: '#10B981' }}
                        >
                          Continuar viaje
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setEditando(null)}>
          <div
            className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-5">Editar ruta</h2>

            {editError && (
              <div className="mb-4 p-4 rounded-xl border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
                <p className="text-sm text-red-400">{editError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Km inicio</label>
                <input
                  type="number"
                  value={editKmInicio}
                  onChange={(e) => setEditKmInicio(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Km término</label>
                <input
                  type="number"
                  value={editKmTermino}
                  onChange={(e) => setEditKmTermino(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Observaciones</label>
              <textarea
                value={editObs}
                onChange={(e) => setEditObs(e.target.value)}
                rows={2}
                className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Foto km inicio</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setEditFotoInicio(f)
                    setEditFotoInicioPrev(f ? URL.createObjectURL(f) : null)
                  }}
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
                />
                {editFotoInicioPrev ? (
                  <img src={editFotoInicioPrev} alt="Preview" className="mt-2 rounded-lg max-h-24 object-cover" />
                ) : editando.foto_km_inicio ? (
                  <a
                    href={editando.foto_km_inicio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
                  >
                    Foto actual
                  </a>
                ) : (
                  <p className="text-xs text-zinc-600 mt-2">Sin foto</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Foto km término</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setEditFotoTermino(f)
                    setEditFotoTerminoPrev(f ? URL.createObjectURL(f) : null)
                  }}
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
                />
                {editFotoTerminoPrev ? (
                  <img src={editFotoTerminoPrev} alt="Preview" className="mt-2 rounded-lg max-h-24 object-cover" />
                ) : editando.foto_km_termino ? (
                  <a
                    href={editando.foto_km_termino}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
                  >
                    Foto actual
                  </a>
                ) : (
                  <p className="text-xs text-zinc-600 mt-2">Sin foto</p>
                )}
              </div>
            </div>

            <div className="rounded-xl p-4 border mb-4" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white">Gastos</p>
                <button
                  type="button"
                  onClick={addGastoEditable}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  + Agregar gasto
                </button>
              </div>

              {gastosEdit.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-3">Sin gastos</p>
              )}

              {gastosEdit.map((gasto, index) => (
                <div key={index} className="rounded-lg p-4 mb-3" style={{ background: '#1A1A1A' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-zinc-500">Gasto {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => updateGasto(index, { eliminar: !gasto.eliminar })}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      {gasto.eliminar ? 'Restaurar' : 'Eliminar'}
                    </button>
                  </div>

                  {gasto.eliminar ? (
                    <p className="text-xs text-red-400">Se eliminará al guardar</p>
                  ) : (
                    <div className="space-y-3">
                      <select
                        value={gasto.tipo}
                        onChange={(e) => updateGasto(index, { tipo: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2.5 text-sm text-white transition-colors focus:outline-none"
                        style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
                      >
                        {TIPO_GASTO.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={gasto.monto}
                        onChange={(e) => updateGasto(index, { monto: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:outline-none"
                        style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
                        placeholder="Monto CLP"
                      />
                      <input
                        type="text"
                        value={gasto.descripcion}
                        onChange={(e) => updateGasto(index, { descripcion: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:outline-none"
                        style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
                        placeholder="Descripción"
                      />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null
                          updateGasto(index, { foto: f, fotoPreview: f ? URL.createObjectURL(f) : null })
                        }}
                        className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
                      />
                      {gasto.fotoPreview ? (
                        <img src={gasto.fotoPreview} alt="Preview" className="mt-2 rounded-lg max-h-24 object-cover" />
                      ) : gasto.fotoUrl ? (
                        <a
                          href={gasto.fotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
                        >
                          Comprobante actual
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="flex-1 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarEdicion}
                disabled={saving}
                className="flex-1 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ background: '#10B981' }}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}