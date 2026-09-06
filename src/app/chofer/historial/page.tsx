'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Gasto {
  id: string
  tipo: string
  monto: number
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
  camiones: { patente: string } | null
  servicios: { nombre: string } | null
  gastos: Gasto[]
}

export default function ChoferHistorial() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(true)

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
    return new Date(dateStr).toLocaleDateString('es-CL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
            <div key={viaje.id} className="rounded-lg bg-white p-4 shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {viaje.camiones?.patente || 'Sin camión'}
                  </span>
                  <Link
                    href={`/chofer/registro?fecha=${viaje.fecha}`}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
                  >
                    {viaje.estado === 'en_curso' ? 'Continuar' : 'Ver/Editar'}
                  </Link>
                </div>
              </div>

              <div className="text-sm text-slate-600 mb-2">
                <span className="font-medium">{viaje.km_inicio.toLocaleString('es-CL')} km</span>
                {' → '}
                <span className="font-medium">
                  {viaje.km_termino ? `${viaje.km_termino.toLocaleString('es-CL')} km` : '...'}
                </span>
                {viaje.km_termino && (
                  <span className="ml-2 text-emerald-600 font-medium">
                    +{(viaje.km_termino - viaje.km_inicio).toLocaleString('es-CL')} km
                  </span>
                )}
              </div>

              {viaje.servicios && (
                <div className="text-sm text-slate-500 mb-2">
                  Servicio: {viaje.servicios.nombre}
                </div>
              )}

              {viaje.foto_km_inicio && (
                <div className="text-sm mb-2">
                  <a href={viaje.foto_km_inicio} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    📷 Foto km inicio
                  </a>
                </div>
              )}

              {viaje.foto_km_termino && (
                <div className="text-sm mb-2">
                  <a href={viaje.foto_km_termino} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    📷 Foto km término
                  </a>
                </div>
              )}

              {viaje.gastos && viaje.gastos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Gastos ({viaje.gastos.length}):
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {viaje.gastos.map((gasto) => (
                      <div key={gasto.id} className="text-sm bg-slate-50 rounded px-2 py-1">
                        <span className="capitalize text-slate-600">{gasto.tipo}</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {formatCLP(gasto.monto)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-emerald-600 mt-2">
                    Total: {formatCLP(viaje.gastos.reduce((sum, g) => sum + g.monto, 0))}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
