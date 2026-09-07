'use client'

import { useState, useEffect } from 'react'

interface Stats {
  camiones: number
  choferes: number
  clientes: number
  servicios: number
  viajesEnCurso: number
}

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
  ruta: string | null
  observaciones: string | null
  foto_km_inicio: string | null
  foto_km_termino: string | null
  estado: string
  created_at: string
  camiones: { patente: string; marca: string | null } | null
  servicios: { nombre: string } | null
  choferes: { usuarios: { nombre: string } | null } | null
  gastos: Gasto[]
}

const TIPO_GASTO_LABEL: Record<string, string> = {
  combustible: 'Combustible',
  peaje: 'Peaje',
  comida: 'Comida',
  mecanico: 'Mecánico',
  otro: 'Otro',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [viajesEnCurso, setViajesEnCurso] = useState<Viaje[]>([])
  const [viajesTerminados, setViajesTerminados] = useState<Viaje[]>([])
  const [activeTab, setActiveTab] = useState<'en_curso' | 'terminados'>('en_curso')
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setViajesEnCurso(data.viajesEnCurso)
        setViajesTerminados(data.viajesTerminados)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Santiago',
    })
  }

  function formatCLP(monto: number): string {
    return '$' + monto.toLocaleString('es-CL')
  }

  function totalKm(viaje: Viaje): number | null {
    if (viaje.km_termino == null) return null
    return viaje.km_termino - viaje.km_inicio
  }

  function totalGastos(viaje: Viaje): number {
    return (viaje.gastos || []).reduce((sum, g) => sum + g.monto, 0)
  }

  function toggleExpand(id: string) {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function RendirViaje({ viaje }: { viaje: Viaje }) {
    const km = totalKm(viaje)
    const gastos = totalGastos(viaje)
    const abierto = !!expandidos[viaje.id]
    const chofer = viaje.choferes?.usuarios?.nombre || '—'

    return (
      <div className="rounded-xl border overflow-hidden" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
        <button
          onClick={() => toggleExpand(viaje.id)}
          className="w-full px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
        >
          <div className="grid grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr_1.4fr_1fr_1fr] gap-2 md:gap-4 items-center">
            <div>
              <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Fecha</span>
              <p className="text-sm font-medium text-white">{formatDate(viaje.fecha)}</p>
            </div>
            <div>
              <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Camion</span>
              <p className="text-sm text-zinc-400">{viaje.camiones?.patente || '—'}</p>
            </div>
            <div>
              <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Chofer</span>
              <p className="text-sm text-zinc-400">{chofer}</p>
            </div>
            <div>
              <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Km ini→fin</span>
              <p className="text-sm text-zinc-400">
                {viaje.km_inicio.toLocaleString('es-CL')}
                <span className="text-zinc-600 mx-1">→</span>
                {viaje.km_termino != null ? viaje.km_termino.toLocaleString('es-CL') : '—'}
              </p>
            </div>
            <div>
              <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Km día</span>
              <p className={`text-sm font-medium ${km != null ? 'text-emerald-400' : 'text-amber-400'}`}>
                {km != null ? `+${km.toLocaleString('es-CL')}` : 'En curso'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Gastos</span>
                <p className="text-sm text-zinc-400">{gastos > 0 ? formatCLP(gastos) : '—'}</p>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className={`text-zinc-600 transition-transform shrink-0 ${abierto ? 'rotate-180' : ''}`}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {viaje.servicios && (
            <p className="text-xs text-zinc-500 mt-2">{viaje.servicios.nombre}</p>
          )}
        </button>

        {abierto && (
          <div className="px-5 py-4 border-t border-zinc-800 bg-white/[0.02] space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {viaje.foto_km_inicio && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Foto km inicio</p>
                  <img src={viaje.foto_km_inicio} alt="Km inicio" className="rounded-lg border border-zinc-800 max-h-48 object-cover" />
                </div>
              )}
              {viaje.foto_km_termino && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Foto km término</p>
                  <img src={viaje.foto_km_termino} alt="Km término" className="rounded-lg border border-zinc-800 max-h-48 object-cover" />
                </div>
              )}
            </div>

            {(viaje.ruta || viaje.observaciones) && (
              <div className="text-sm text-zinc-400 space-y-1">
                {viaje.ruta && <p>Ruta: <span className="text-white">{viaje.ruta}</span></p>}
                {viaje.observaciones && <p>Obs.: <span className="text-white">{viaje.observaciones}</span></p>}
              </div>
            )}

            {viaje.gastos.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
                  Gastos ({formatCLP(gastos)})
                </p>
                <div className="grid gap-2">
                  {viaje.gastos.map((gasto) => (
                    <div key={gasto.id} className="rounded-lg p-3 flex items-center justify-between gap-4" style={{ background: '#1A1A1A' }}>
                      <div className="min-w-0">
                        <p className="text-sm text-white">{TIPO_GASTO_LABEL[gasto.tipo] || gasto.tipo}</p>
                        {gasto.descripcion && <p className="text-xs text-zinc-500 truncate">{gasto.descripcion}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium text-white">{formatCLP(gasto.monto)}</span>
                        {gasto.foto_url && (
                          <a href={gasto.foto_url} target="_blank" rel="noopener noreferrer">
                            <img src={gasto.foto_url} alt="Comprobante" className="w-10 h-10 rounded-md object-cover border border-zinc-800" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="p-8 text-sm text-zinc-500">Cargando...</div>
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Camiones</p>
            <p className="text-3xl font-semibold text-white mt-2">{stats?.camiones || 0}</p>
          </div>
          <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Chóferes</p>
            <p className="text-3xl font-semibold text-white mt-2">{stats?.choferes || 0}</p>
          </div>
          <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Clientes</p>
            <p className="text-3xl font-semibold text-white mt-2">{stats?.clientes || 0}</p>
          </div>
          <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Servicios</p>
            <p className="text-3xl font-semibold text-white mt-2">{stats?.servicios || 0}</p>
          </div>
        </div>

        <div className="border-b border-zinc-800 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('en_curso')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'en_curso'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              En curso ({viajesEnCurso.length})
            </button>
            <button
              onClick={() => setActiveTab('terminados')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'terminados'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Cerrados ({viajesTerminados.length})
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'en_curso' ? (
            viajesEnCurso.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-zinc-500">No hay viajes en curso</p>
              </div>
            ) : (
              <div className="space-y-2">
                {viajesEnCurso.map((viaje) => (
                  <RendirViaje key={viaje.id} viaje={viaje} />
                ))}
              </div>
            )
          ) : (
            viajesTerminados.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-zinc-500">No hay viajes cerrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {viajesTerminados.map((viaje) => (
                  <RendirViaje key={viaje.id} viaje={viaje} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}