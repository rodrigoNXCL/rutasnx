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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Santiago',
    })
  }

  if (loading) {
    return <div className="text-slate-600">Cargando...</div>
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-slate-900">Historial de Viajes</h1>

      {viajes.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow text-center">
          <p className="text-slate-500">No tienes viajes registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {viajes.map((viaje) => (
            <div key={viaje.id} className="rounded-lg bg-white shadow overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedViaje(expandedViaje === viaje.id ? null : viaje.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {formatDate(viaje.fecha)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      viaje.estado === 'en_curso'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {viaje.estado === 'en_curso' ? 'En curso' : 'Terminado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      {viaje.km_inicio.toLocaleString('es-CL')} → {viaje.km_termino ? viaje.km_termino.toLocaleString('es-CL') : '...'} km
                    </span>
                    <span className="text-emerald-600 font-medium">
                      {viaje.km_termino ? `+${(viaje.km_termino - viaje.km_inicio).toLocaleString('es-CL')} km` : ''}
                    </span>
                    <span className="text-slate-400">
                      {expandedViaje === viaje.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>🚛 {viaje.camiones?.patente || 'Sin camión'}</span>
                  {viaje.servicios && <span>📍 {viaje.servicios.nombre}</span>}
                  {viaje.gastos.length > 0 && (
                    <span className="text-emerald-600 font-medium">
                      💰 {viaje.gastos.length} gasto(s) - Total: {formatCLP(viaje.gastos.reduce((sum, g) => sum + g.monto, 0))}
                    </span>
                  )}
                </div>
              </div>

              {expandedViaje === viaje.id && (
                <div className="border-t border-slate-100 p-4 bg-slate-50">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Detalles del Viaje</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-slate-500">Camión:</span> {viaje.camiones?.patente} {viaje.camiones?.marca && `(${viaje.camiones.marca})`}</p>
                        {viaje.servicios && (
                          <>
                            <p><span className="text-slate-500">Servicio:</span> {viaje.servicios.nombre}</p>
                            {viaje.servicios.origen && viaje.servicios.destino && (
                              <p><span className="text-slate-500">Trayecto:</span> {viaje.servicios.origen} → {viaje.servicios.destino}</p>
                            )}
                          </>
                        )}
                        <p><span className="text-slate-500">Km Inicio:</span> {viaje.km_inicio.toLocaleString('es-CL')} km</p>
                        {viaje.km_termino && (
                          <p><span className="text-slate-500">Km Término:</span> {viaje.km_termino.toLocaleString('es-CL')} km</p>
                        )}
                        {viaje.observaciones && (
                          <p><span className="text-slate-500">Observaciones:</span> {viaje.observaciones}</p>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        {viaje.foto_km_inicio && (
                          <a
                            href={viaje.foto_km_inicio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-white border border-emerald-300 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-50"
                          >
                            📷 Foto Km Inicio
                          </a>
                        )}
                        {viaje.foto_km_termino && (
                          <a
                            href={viaje.foto_km_termino}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-white border border-emerald-300 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-50"
                          >
                            📷 Foto Km Término
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Gastos ({viaje.gastos.length})</h4>
                      {viaje.gastos.length === 0 ? (
                        <p className="text-sm text-slate-400">Sin gastos registrados</p>
                      ) : (
                        <div className="space-y-2">
                          {viaje.gastos.map((gasto) => (
                            <div key={gasto.id} className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="capitalize font-medium text-slate-800">{gasto.tipo}</span>
                                  {gasto.descripcion && (
                                    <span className="text-slate-500 text-sm ml-2">- {gasto.descripcion}</span>
                                  )}
                                </div>
                                <span className="font-bold text-emerald-600">{formatCLP(gasto.monto)}</span>
                              </div>
                              {gasto.foto_url && (
                                <div className="mt-2">
                                  <a
                                    href={gasto.foto_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-emerald-600 hover:underline"
                                  >
                                    📷 Ver comprobante
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="border-t border-slate-200 pt-2 mt-2">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>Total Gastos:</span>
                              <span className="text-emerald-600">{formatCLP(viaje.gastos.reduce((sum, g) => sum + g.monto, 0))}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {viaje.estado === 'en_curso' && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <Link
                        href={`/chofer/registro?fecha=${viaje.fecha}`}
                        className="inline-block bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium"
                      >
                        Continuar Viaje →
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
  )
}
