'use client'

import { useState, useEffect, useCallback } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface GastoPeaje {
  id: string
  monto: number
  descripcion: string | null
  foto_url: string | null
}

interface RutaInforme {
  servicio: string
  fecha: string
  chofer: string
  camion: string
  km_inicio: number
  km_termino: number | null
  total_km: number
  ruta: string | null
  observaciones: string | null
  foto_km_inicio: string | null
  foto_km_termino: string | null
  gastos_peaje: GastoPeaje[]
  total_peaje: number
}

interface ServicioInfo {
  id: string
  nombre: string
}

function todayChile(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}

function toChileanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12, 0, 0)
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
  })
}

function formatCLP(monto: number): string {
  return '$' + monto.toLocaleString('es-CL')
}

export default function ClienteInformes() {
  const [hasta, setHasta] = useState(todayChile())
  const [desde, setDesde] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
  })
  const [servicios, setServicios] = useState<ServicioInfo[]>([])
  const [servicioId, setServicioId] = useState('')
  const [rutas, setRutas] = useState<RutaInforme[]>([])
  const [loading, setLoading] = useState(false)
  const [cargandoServicios, setCargandoServicios] = useState(true)
  const [error, setError] = useState('')
  const [descargando, setDescargando] = useState<'csv' | 'pdf' | null>(null)
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function fetchServicios() {
      try {
        const res = await fetch('/api/cliente/servicios')
        if (res.ok) {
          const data = await res.json()
          setServicios(data.map((s: { id: string; nombre: string }) => ({ id: s.id, nombre: s.nombre })))
        }
      } catch {
        // silently fail - service filter is optional
      } finally {
        setCargandoServicios(false)
      }
    }
    fetchServicios()
  }, [])

  const fetchRutas = useCallback(async () => {
    if (!desde || !hasta) return
    setLoading(true)
    setError('')
    setRutas([])
    try {
      const params = new URLSearchParams({ desde, hasta })
      if (servicioId) params.set('servicio_id', servicioId)
      const res = await fetch(`/api/cliente/informes?${params}`)
      if (res.ok) {
        setRutas(await res.json())
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al generar informe')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [desde, hasta, servicioId])

  function peajeCSV(r: RutaInforme): string {
    if (r.gastos_peaje.length === 0) return ''
    return r.gastos_peaje
      .map((g) => {
        let txt = `Peaje: ${g.monto}`
        if (g.descripcion) txt += ` (${g.descripcion})`
        if (g.foto_url) txt += ` [${g.foto_url}]`
        return txt
      })
      .join(' | ')
  }

  function handleDescargarCSV() {
    if (rutas.length === 0) return
    setDescargando('csv')

    const separador = ';'
    const encabezados = [
      'Fecha',
      'Servicio',
      'Chofer',
      'Camión',
      'Km Inicio',
      'Km Término',
      'Total Km',
      'Gastos Peaje',
      'Comprobantes Peaje (URLs)',
      'Foto Km Inicio URL',
      'Foto Km Término URL',
      'Ruta',
      'Observaciones',
    ]

    const rows = rutas.map((r) => [
      r.fecha,
      r.servicio,
      r.chofer,
      r.camion,
      String(r.km_inicio),
      r.km_termino != null ? String(r.km_termino) : '',
      String(r.total_km),
      String(r.total_peaje),
      peajeCSV(r),
      r.foto_km_inicio || '',
      r.foto_km_termino || '',
      r.ruta || '',
      r.observaciones || '',
    ])

    const csvContent = [
      `Informe de Rutas,${desde},${hasta}`,
      '',
      encabezados.join(separador),
      ...rows.map((row) => row.join(separador)),
      '',
      `Total rutas,${rutas.length}`,
      `Total gastos peaje,${rutas.reduce((s, r) => s + r.total_peaje, 0)}`,
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `informe-rutas-${desde}-${hasta}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDescargando(null), 500)
  }

  function handleDescargarPDF() {
    if (rutas.length === 0) return
    setDescargando('pdf')

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Informe de Rutas', 14, 18)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Periodo: ${toChileanDate(desde)} al ${toChileanDate(hasta)}  |  Rutas completadas: ${rutas.length}`,
      14,
      26
    )

    autoTable(doc, {
      startY: 32,
      head: [['Fecha', 'Servicio', 'Chofer', 'Camion', 'Km Inicio', 'Km Termino', 'Total Km', 'Peaje']],
      body: rutas.map((r) => [
        r.fecha,
        r.servicio,
        r.chofer,
        r.camion,
        String(r.km_inicio),
        r.km_termino != null ? String(r.km_termino) : '—',
        `+${r.total_km.toLocaleString('es-CL')}`,
        formatCLP(r.total_peaje),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    })

    let cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
    if (cursor >= pageH - 20) {
      doc.addPage()
      cursor = 14
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalle de gastos de peaje y evidencias', 14, cursor)
    cursor += 5

    rutas.forEach((r) => {
      const resumen = `${r.fecha} - ${r.chofer} / ${r.camion} - ${r.servicio}`
      const peajeLines = r.gastos_peaje.map((g) => {
        let txt = `Peaje: ${formatCLP(g.monto)}`
        if (g.descripcion) txt += ` (${g.descripcion})`
        if (g.foto_url) txt += ` [${g.foto_url}]`
        return txt
      })
      const evidencia = [
        `Foto km inicio: ${r.foto_km_inicio || 'sin foto'}`,
        `Foto km término: ${r.foto_km_termino || 'sin foto'}`,
      ]
      const lineas = [resumen, ...(peajeLines.length ? peajeLines : ['Sin gastos de peaje']), ...evidencia]
      if (r.observaciones) lineas.push(`Observaciones: ${r.observaciones}`)

      autoTable(doc, {
        startY: cursor,
        head: [[resumen]],
        body: lineas.map((l) => [l]),
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
      })
      cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
      if (cursor >= pageH - 20) {
        doc.addPage()
        cursor = 14
      }
    })

    const total = rutas.reduce((s, r) => s + r.total_peaje, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total gastos peaje: ${formatCLP(total)}`, 14, pageH - 12)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `rutasNX - ${new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}`,
      pageW - 14,
      pageH - 12,
      { align: 'right' }
    )

    doc.save(`informe-rutas-${desde}-${hasta}.pdf`)
    setTimeout(() => setDescargando(null), 500)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">Informes</h1>

        <div className="rounded-xl border p-5 mb-8" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
          <p className="text-sm text-zinc-400 mb-4">Selecciona el periodo y servicio para generar el informe</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Servicio</label>
              {cargandoServicios ? (
                <div
                  className="w-full px-3 py-2 rounded-lg text-sm text-zinc-500"
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
                >
                  Cargando...
                </div>
              ) : (
                <select
                  value={servicioId}
                  onChange={(e) => setServicioId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: servicioId ? '#fff' : '#71717a' }}
                >
                  <option value="">Todos los servicios</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={fetchRutas}
              disabled={loading || !desde || !hasta}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: '#10B981' }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {rutas.length > 0 && (
          <>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                <p className="text-sm text-zinc-400">
                  <span className="text-white font-medium">{rutas.length}</span> ruta{rutas.length !== 1 ? 's' : ''} completada{rutas.length !== 1 ? 's' : ''} del{' '}
                  <span className="text-white">{toChileanDate(desde)}</span> al{' '}
                  <span className="text-white">{toChileanDate(hasta)}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDescargarCSV}
                  disabled={descargando === 'csv'}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: '#2A2A2A' }}
                >
                  {descargando === 'csv' ? 'Descargando...' : 'CSV'}
                </button>
                <button
                  onClick={handleDescargarPDF}
                  disabled={descargando === 'pdf'}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: '#10B981' }}
                >
                  {descargando === 'pdf' ? 'Descargando...' : 'PDF'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
              <div className="hidden md:grid grid-cols-[1fr_1.3fr_1fr_0.8fr_0.7fr_0.7fr_0.7fr_1fr_0.7fr] gap-4 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
                <span>Fecha</span>
                <span>Servicio</span>
                <span>Chofer</span>
                <span>Camión</span>
                <span>Km Inicio</span>
                <span>Km Término</span>
                <span>Total Km</span>
                <span>Peaje</span>
                <span></span>
              </div>

              {rutas.map((r, i) => {
                const abierta = !!expandidos[i]
                return (
                  <div key={i} className="border-b border-zinc-800 last:border-b-0">
                    <button
                      onClick={() => setExpandidos((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className="w-full grid grid-cols-2 md:grid-cols-[1fr_1.3fr_1fr_0.8fr_0.7fr_0.7fr_0.7fr_1fr_0.7fr] gap-2 md:gap-4 px-5 py-3.5 text-left items-center hover:bg-white/[0.02]"
                    >
                      <div>
                        <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Fecha</span>
                        <span className="text-sm text-white">{toChileanDate(r.fecha)}</span>
                      </div>
                      <div>
                        <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Servicio</span>
                        <span className="text-sm text-zinc-400">{r.servicio}</span>
                      </div>
                      <div>
                        <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Chofer</span>
                        <span className="text-sm text-zinc-400">{r.chofer}</span>
                      </div>
                      <div>
                        <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Camión</span>
                        <span className="text-sm text-zinc-400">{r.camion}</span>
                      </div>
                      <div>
                        <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Km Inicio</span>
                        <span className="text-sm text-zinc-400">{r.km_inicio.toLocaleString('es-CL')}</span>
                      </div>
                      <div>
                        <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Km Término</span>
                        <span className="text-sm text-zinc-400">{r.km_termino != null ? r.km_termino.toLocaleString('es-CL') : '—'}</span>
                      </div>
                      <div>
                        <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Total Km</span>
                        <span className="text-sm font-medium text-emerald-400">+{r.total_km.toLocaleString('es-CL')}</span>
                      </div>
                      <div>
                        <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Peaje</span>
                        <span className="text-sm text-zinc-400">{r.total_peaje > 0 ? formatCLP(r.total_peaje) : '—'}</span>
                      </div>
                      <div className="flex justify-end">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className={`text-zinc-500 transition-transform ${abierta ? 'rotate-180' : ''}`}
                        >
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>

                    {abierta && (
                      <div className="px-5 py-4 border-t border-zinc-800 bg-white/[0.02] space-y-4">
                        <div>
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Evidencia fotográfica</p>
                          <div className="space-y-1 text-xs">
                            {r.foto_km_inicio ? (
                              <a href={r.foto_km_inicio} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline break-all">
                                Foto km inicio: {r.foto_km_inicio}
                              </a>
                            ) : (
                              <span className="text-zinc-600">Foto km inicio: sin foto</span>
                            )}
                            {r.foto_km_termino ? (
                              <a href={r.foto_km_termino} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline block break-all">
                                Foto km término: {r.foto_km_termino}
                              </a>
                            ) : (
                              <span className="text-zinc-600 block">Foto km término: sin foto</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                            Gastos de peaje ({r.gastos_peaje.length}) - Total {formatCLP(r.total_peaje)}
                          </p>
                          {r.gastos_peaje.length === 0 ? (
                            <p className="text-xs text-zinc-600">Sin gastos de peaje</p>
                          ) : (
                            <div className="grid gap-2">
                              {r.gastos_peaje.map((g) => (
                                <div key={g.id} className="rounded-lg p-3" style={{ background: '#1A1A1A' }}>
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm text-white">Peaje</p>
                                      {g.descripcion && <p className="text-xs text-zinc-500">{g.descripcion}</p>}
                                    </div>
                                    <span className="text-sm font-medium text-white">{formatCLP(g.monto)}</span>
                                  </div>
                                  {g.foto_url ? (
                                    <a
                                      href={g.foto_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 inline-block text-xs text-emerald-400 hover:underline break-all"
                                    >
                                      Comprobante: {g.foto_url}
                                    </a>
                                  ) : (
                                    <p className="mt-2 text-xs text-zinc-600">Comprobante: sin foto</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="px-5 py-3 border-t border-zinc-700 flex items-center justify-between" style={{ background: '#1A1A1A' }}>
                <span className="text-sm font-medium text-zinc-400">
                  Total: {rutas.length} ruta{rutas.length !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-medium text-white">
                  Peaje: {formatCLP(rutas.reduce((s, r) => s + r.total_peaje, 0))}
                </span>
              </div>
            </div>
          </>
        )}

        {!loading && rutas.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">
              Selecciona un periodo y haz clic en &quot;Buscar&quot; para generar el informe
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
