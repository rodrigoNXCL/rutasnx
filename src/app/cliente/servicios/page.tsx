'use client'

import { useState, useEffect } from 'react'

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
  camiones: { patente: string; marca: string | null } | null
  choferes: { usuarios: { nombre: string } | null } | null
  gastos: Gasto[]
}

interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  origen: string | null
  destino: string | null
  activo: boolean
  created_at: string
  viajes: Viaje[]
}

const TIPO_GASTO_LABEL: Record<string, string> = {
  combustible: 'Combustible',
  peaje: 'Peaje',
  comida: 'Comida',
  mecanico: 'Mecánico',
  otro: 'Otro',
}

export default function ClienteServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [servicioAbierto, setServicioAbierto] = useState<string | null>(null)
  const [viajesAbiertos, setViajesAbiertos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchServicios()
  }, [])

  async function fetchServicios() {
    try {
      const res = await fetch('/api/cliente/servicios')
      if (res.ok) {
        const data = await res.json()
        setServicios(data)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al cargar servicios')
      }
    } catch (error) {
      console.error('Error fetching:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function toggleServicio(id: string) {
    setServicioAbierto(servicioAbierto === id ? null : id)
  }

  function toggleViaje(id: string) {
    setViajesAbiertos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function formatFecha(fecha: string): string {
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', {
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

  function nombreChofer(viaje: Viaje): string {
    return viaje.choferes?.usuarios?.nombre || '—'
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-sm text-zinc-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">Mis Servicios</h1>

        {error && (
          <div className="mb-5 p-4 rounded-xl border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {servicios.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin servicios asociados</p>
            <p className="text-xs text-zinc-600 mt-1">Contacta a tu proveedor de transporte</p>
          </div>
        ) : (
          <div className="space-y-4">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="rounded-xl border overflow-hidden" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <button
                  onClick={() => toggleServicio(servicio.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-medium text-white">{servicio.nombre}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Activo</span>
                    </div>
                    {servicio.origen && servicio.destino && (
                      <p className="text-sm text-zinc-500 mt-0.5">{servicio.origen} → {servicio.destino}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{(servicio.viajes || []).length} rutas</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`text-zinc-500 transition-transform ${servicioAbierto === servicio.id ? 'rotate-180' : ''}`}
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {servicioAbierto === servicio.id && (
                  <div className="border-t border-zinc-800">
                    {servicio.viajes.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-8">Sin rutas registradas</p>
                    ) : (
                      <div>
                        <div className="hidden md:grid grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr_1fr] gap-4 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
                          <span>Fecha</span>
                          <span>Camion</span>
                          <span>Chofer</span>
                          <span>Km inicio / termino</span>
                          <span>Total km</span>
                          <span>Total gastos</span>
                        </div>

                        {servicio.viajes.map((viaje) => {
                          const km = totalKm(viaje)
                          const gastos = totalGastos(viaje)
                          const abierto = !!viajesAbiertos[viaje.id]
                          return (
                            <div key={viaje.id} className="border-b border-zinc-800 last:border-b-0">
                              <button
                                onClick={() => toggleViaje(viaje.id)}
                                className="w-full px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
                              >
                                <div className="md:hidden flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-white">{formatFecha(viaje.fecha)}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    viaje.estado === 'en_curso' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                                  }`}>
                                    {viaje.estado === 'en_curso' ? 'En curso' : 'Cerrado'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr_1fr] gap-2 md:gap-4 items-center">
                                  <div>
                                    <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Fecha</span>
                                    <span className="hidden md:block text-sm font-medium text-white">{formatFecha(viaje.fecha)}</span>
                                    <span className="md:hidden text-sm text-zinc-300">{formatFecha(viaje.fecha)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Cami</span>
                                    <span className="text-sm text-zinc-400">{viaje.camiones?.patente || '—'}</span>
                                  </div>
                                  <div>
                                    <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Chofer</span>
                                    <span className="text-sm text-zinc-400">{nombreChofer(viaje)}</span>
                                  </div>
                                  <div>
                                    <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Km</span>
                                    <span className="text-sm text-zinc-400">
                                      {viaje.km_inicio.toLocaleString('es-CL')}
                                      <span className="text-zinc-600 mx-1">→</span>
                                      {viaje.km_termino != null ? viaje.km_termino.toLocaleString('es-CL') : '—'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Km día</span>
                                    <span className={`text-sm font-medium ${km != null ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {km != null ? `+${km.toLocaleString('es-CL')}` : 'En curso'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Gastos</span>
                                    <span className="text-sm text-zinc-400">{gastos > 0 ? formatCLP(gastos) : '—'}</span>
                                  </div>
                                </div>
                              </button>

                              {abierto && (
                                <div className="px-5 py-4 border-t border-zinc-800 bg-white/[0.02] space-y-4">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    {viaje.foto_km_inicio && (
                                      <div>
                                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Foto km inicio</p>
                                        <img
                                          src={viaje.foto_km_inicio}
                                          alt="Km inicio"
                                          className="rounded-lg border border-zinc-800 max-h-48 object-cover"
                                        />
                                      </div>
                                    )}
                                    {viaje.foto_km_termino && (
                                      <div>
                                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Foto km término</p>
                                        <img
                                          src={viaje.foto_km_termino}
                                          alt="Km término"
                                          className="rounded-lg border border-zinc-800 max-h-48 object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {(viaje.observaciones || viaje.ruta) && (
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
                                              {gasto.descripcion && (
                                                <p className="text-xs text-zinc-500 truncate">{gasto.descripcion}</p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                              <span className="text-sm font-medium text-white">{formatCLP(gasto.monto)}</span>
                                              {gasto.foto_url && (
                                                <a href={gasto.foto_url} target="_blank" rel="noopener noreferrer">
                                                  <img
                                                    src={gasto.foto_url}
                                                    alt="Comprobante"
                                                    className="w-10 h-10 rounded-md object-cover border border-zinc-800"
                                                  />
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
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}