'use client'

import { useState, useEffect } from 'react'

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
  km_termino: number
  ruta: string | null
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
                <span className="font-medium text-slate-900">
                  {formatDate(viaje.fecha)}
                </span>
                <span className="text-sm text-slate-500">
                  {viaje.camiones?.patente || 'Sin camión'}
                </span>
              </div>

              <div className="text-sm text-slate-600 mb-2">
                <span className="font-medium">{viaje.km_inicio.toLocaleString('es-CL')} km</span>
                {' → '}
                <span className="font-medium">{viaje.km_termino.toLocaleString('es-CL')} km</span>
                <span className="ml-2 text-emerald-600 font-medium">
                  +{(viaje.km_termino - viaje.km_inicio).toLocaleString('es-CL')} km
                </span>
              </div>

              {viaje.servicios && (
                <div className="text-sm text-slate-500 mb-2">
                  Servicio: {viaje.servicios.nombre}
                </div>
              )}

              {viaje.ruta && (
                <div className="text-sm text-slate-500 mb-2">
                  Ruta: {viaje.ruta}
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
