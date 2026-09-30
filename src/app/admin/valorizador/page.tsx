'use client'

import { useState, useEffect } from 'react'

interface ValorKm {
  id: string
  valor: number
  fecha_desde: string
  fecha_hasta: string
  created_by: string | null
  created_at: string
}

interface HistorialEntry {
  id: string
  valor_km_id: string
  accion: string
  valor_anterior: number | null
  valor_nuevo: number
  fecha_desde_anterior: string | null
  fecha_hasta_anterior: string | null
  fecha_desde_nuevo: string
  fecha_hasta_nuevo: string
  changed_by: string | null
  changed_at: string
}

function toChileanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
  })
}

function formatCLP(monto: number): string {
  return '$' + monto.toLocaleString('es-CL')
}

function formatFechaHora(dt: string): string {
  return new Date(dt).toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  })
}

export default function AdminValorizador() {
  const [valores, setValores] = useState<ValorKm[]>([])
  const [historial, setHistorial] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editValor, setEditValor] = useState<ValorKm | null>(null)
  const [form, setForm] = useState({ valor: '', fecha_desde: '', fecha_hasta: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDatos()
  }, [])

  async function fetchDatos() {
    try {
      const [resValores, resHistorial] = await Promise.all([
        fetch('/api/admin/valorizador'),
        fetch('/api/admin/valorizador/historial'),
      ])
      if (resValores.ok) setValores(await resValores.json())
      if (resHistorial.ok) setHistorial(await resHistorial.json())
    } catch (e) {
      console.error('Error:', e)
    } finally {
      setLoading(false)
    }
  }

  function openNuevo() {
    setEditValor(null)
    setForm({ valor: '', fecha_desde: '', fecha_hasta: '' })
    setError('')
    setShowModal(true)
  }

  function openEditar(v: ValorKm) {
    setEditValor(v)
    setForm({
      valor: String(v.valor),
      fecha_desde: v.fecha_desde,
      fecha_hasta: v.fecha_hasta,
    })
    setError('')
    setShowModal(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = editValor ? `/api/admin/valorizador/${editValor.id}` : '/api/admin/valorizador'
      const method = editValor ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: Number(form.valor),
          fecha_desde: form.fecha_desde,
          fecha_hasta: form.fecha_hasta,
        }),
      })
      if (res.ok) {
        setShowModal(false)
        fetchDatos()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al guardar')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta valorización?')) return
    try {
      const res = await fetch(`/api/admin/valorizador/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchDatos()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Error al eliminar')
      }
    } catch (e) {
      console.error('Error:', e)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-zinc-500">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Valorizador de Kilometraje</h1>
        <button
          onClick={openNuevo}
          className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
          style={{ background: '#10B981' }}
        >
          + Nueva Valorización
        </button>
      </div>

      <p className="text-sm text-zinc-400 mb-6">
        Asigna un valor por kilómetro para un rango de fechas. Este valor se usa para valorizar las rutas.
      </p>

      {error && (
        <div className="mb-5 p-4 rounded-xl border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {valores.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500">Sin valorizaciones registradas</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden mb-10" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_0.8fr] gap-4 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
            <span>Desde</span>
            <span>Hasta</span>
            <span>Valor por km</span>
            <span>Creada</span>
            <span></span>
          </div>
          {valores.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr_0.8fr] gap-2 md:gap-4 px-5 py-3.5 border-b border-zinc-800 last:border-b-0 items-center"
            >
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Desde</span>
                <span className="text-sm text-white">{toChileanDate(v.fecha_desde)}</span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Hasta</span>
                <span className="text-sm text-white">{toChileanDate(v.fecha_hasta)}</span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Valor</span>
                <span className="text-sm font-medium text-emerald-400">{formatCLP(v.valor)}</span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Creada</span>
                <span className="text-xs text-zinc-400">{formatFechaHora(v.created_at)}</span>
              </div>
              <div className="flex gap-3 md:justify-end">
                <button onClick={() => openEditar(v)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                  Editar
                </button>
                <button onClick={() => eliminar(v.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold text-white tracking-tight mb-4">Historial de cambios</h2>
      {historial.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-zinc-500">Sin cambios registrados</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
          <div className="hidden md:grid grid-cols-[0.7fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
            <span>Fecha</span>
            <span>Acción</span>
            <span>Valor anterior</span>
            <span>Valor nuevo</span>
            <span>Rango nuevo</span>
          </div>
          {historial.map((h) => (
            <div
              key={h.id}
              className="grid grid-cols-2 md:grid-cols-[0.7fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4 px-5 py-3 border-b border-zinc-800 last:border-b-0 items-center"
            >
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Fecha</span>
                <span className="text-xs text-zinc-400">{formatFechaHora(h.changed_at)}</span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Acción</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    h.accion === 'creado'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : h.accion === 'modificado'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {h.accion}
                </span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Anterior</span>
                <span className="text-sm text-zinc-400">
                  {h.valor_anterior != null ? formatCLP(h.valor_anterior) : '—'}
                </span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Nuevo</span>
                <span className="text-sm font-medium text-white">{formatCLP(h.valor_nuevo)}</span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Rango</span>
                <span className="text-xs text-zinc-400">
                  {toChileanDate(h.fecha_desde_nuevo)} → {toChileanDate(h.fecha_hasta_nuevo)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowModal(false)}>
          <div className="rounded-xl p-6 w-full max-w-md border" style={{ background: '#141414', borderColor: '#2A2A2A' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">
              {editValor ? 'Editar Valorización' : 'Nueva Valorización'}
            </h2>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Valor por km (CLP)</label>
                <input
                  type="number"
                  min="0"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="Ej: 270"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Desde</label>
                  <input
                    type="date"
                    value={form.fecha_desde}
                    onChange={(e) => setForm({ ...form, fecha_desde: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
                    style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Hasta</label>
                  <input
                    type="date"
                    value={form.fecha_hasta}
                    onChange={(e) => setForm({ ...form, fecha_hasta: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
                    style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                    required
                  />
                </div>
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
                  disabled={saving}
                  className="flex-1 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#10B981' }}
                >
                  {saving ? 'Guardando...' : editValor ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
