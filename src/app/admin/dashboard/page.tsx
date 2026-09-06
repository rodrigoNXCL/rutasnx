'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  camiones: number
  choferes: number
  clientes: number
  servicios: number
  viajesEnCurso: number
}

interface Viaje {
  id: string
  fecha: string
  km_inicio: number
  km_termino: number | null
  estado: string
  created_at: string
  camiones: { patente: string } | null
  servicios: { nombre: string } | null
  choferes: { usuarios: { nombre: string } | null } | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [viajesEnCurso, setViajesEnCurso] = useState<Viaje[]>([])
  const [viajesTerminados, setViajesTerminados] = useState<Viaje[]>([])
  const [activeTab, setActiveTab] = useState<'en_curso' | 'terminados'>('en_curso')
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
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Dashboard — Admin</h1>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Camiones</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">{stats?.camiones || 0}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Chóferes</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">{stats?.choferes || 0}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Clientes</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">{stats?.clientes || 0}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Servicios</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">{stats?.servicios || 0}</p>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-slate-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('en_curso')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'en_curso'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              En Curso ({viajesEnCurso.length})
            </button>
            <button
              onClick={() => setActiveTab('terminados')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'terminados'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Cerrados ({viajesTerminados.length})
            </button>
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'en_curso' ? (
            viajesEnCurso.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay viajes en curso</p>
            ) : (
              <div className="space-y-3">
                {viajesEnCurso.map((viaje) => (
                  <div key={viaje.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">
                            {formatDate(viaje.fecha)}
                          </span>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                            En curso
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">{viaje.camiones?.patente || 'Sin camión'}</span>
                          {viaje.servicios && (
                            <span className="ml-2">• {viaje.servicios.nombre}</span>
                          )}
                          {viaje.choferes?.usuarios && (
                            <span className="ml-2">• {viaje.choferes.usuarios.nombre}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">
                          {viaje.km_inicio.toLocaleString('es-CL')} km
                        </p>
                        <p className="text-xs text-slate-500">Km inicio</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            viajesTerminados.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay viajes cerrados</p>
            ) : (
              <div className="space-y-3">
                {viajesTerminados.map((viaje) => (
                  <div key={viaje.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">
                            {formatDate(viaje.fecha)}
                          </span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                            Cerrado
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">{viaje.camiones?.patente || 'Sin camión'}</span>
                          {viaje.servicios && (
                            <span className="ml-2">• {viaje.servicios.nombre}</span>
                          )}
                          {viaje.choferes?.usuarios && (
                            <span className="ml-2">• {viaje.choferes.usuarios.nombre}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">
                          {viaje.km_inicio.toLocaleString('es-CL')} → {viaje.km_termino?.toLocaleString('es-CL')} km
                        </p>
                        <p className="text-xs text-emerald-600">
                          +{((viaje.km_termino || 0) - viaje.km_inicio).toLocaleString('es-CL')} km
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
