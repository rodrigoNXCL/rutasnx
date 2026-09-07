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

export default function ChoferHistorial() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedViaje, setExpandedViaje] = useState<string | null>(null)

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Viaje</h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-zinc-400">{formatDate(viaje.fecha)}</p>
                          {viaje.servicios && (
                            <p className="text-zinc-400">{viaje.servicios.nombre}</p>
                          )}
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
    </div>
  )
}
