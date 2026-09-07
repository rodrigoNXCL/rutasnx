'use client'

import { useState, useEffect, useCallback } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface GastoDetalle {
  tipo: string
  monto: number
  descripcion: string | null
  foto_url: string | null
}

interface RutaInformeAdmin {
  id: string
  fecha: string
  chofer: string
  chofer_rut: string
  camion: string
  camion_marca: string
  servicio: string
  cliente: string
  km_inicio: number
  km_termino: number | null
  total_km: number
  ruta: string | null
  observaciones: string | null
  foto_km_inicio: string | null
  foto_km_termino: string | null
  gastos: GastoDetalle[]
  total_gastos: number
}

interface OptionItem {
  id: string
  nombre?: string
  patente?: string
}

const TIPO_GASTO_LABEL: Record<string, string> = {
  combustible: 'Combustible',
  peaje: 'Peaje',
  comida: 'Comida',
  mecanico: 'Mecánico',
  otro: 'Otro',
}

function todayChile(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
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

export default function AdminReportes() {
  const [hasta, setHasta] = useState(todayChile())
  const [desde, setDesde] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
  })
  const [servicios, setServicios] = useState<OptionItem[]>([])
  const [choferes, setChoferes] = useState<OptionItem[]>([])
  const [camiones, setCamiones] = useState<OptionItem[]>([])
  const [servicioId, setServicioId] = useState('')
  const [choferId, setChoferId] = useState('')
  const [camionId, setCamionId] = useState('')
  const [rutas, setRutas] = useState<RutaInformeAdmin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [descargando, setDescargando] = useState<'csv' | 'pdf' | null>(null)
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function fetchFiltros() {
      const [s, c, ca] = await Promise.all([
        fetch('/api/servicios').then((r) => r.json().catch(() => [])),
        fetch('/api/choferes').then((r) => r.json().catch(() => [])),
        fetch('/api/camiones').then((r) => r.json().catch(() => [])),
      ])
      setServicios(Array.isArray(s) ? s : [])
      setChoferes(Array.isArray(c) ? c : [])
      setCamiones(Array.isArray(ca) ? ca : [])
    }
    fetchFiltros()
  }, [])

  const fetchRutas = useCallback(async () => {
    if (!desde || !hasta) return
    setLoading(true)
    setError('')
    setRutas([])
    try {
      const params = new URLSearchParams({ desde, hasta })
      if (servicioId) params.set('servicio_id', servicioId)
      if (choferId) params.set('chofer_id', choferId)
      if (camionId) params.set('camion_id', camionId)
      const res = await fetch(`/api/admin/informes?${params}`)
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
  }, [desde, hasta, servicioId, choferId, camionId])

  function toggleExpandida(id: string) {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function gastosCSV(r: RutaInformeAdmin): string {
    if (r.gastos.length === 0) return ''
    return r.gastos
      .map((g) => {
        const detalle = `${TIPO_GASTO_LABEL[g.tipo] || g.tipo}: ${g.monto}`
        const conDesc = g.descripcion ? ` (${g.descripcion})` : ''
        const conFoto = g.foto_url ? ` [${g.foto_url}]` : ''
        return detalle + conDesc + conFoto
      })
      .join(' | ')
  }

  function handleDescargarCSV() {
    if (rutas.length === 0) return
    setDescargando('csv')
    const sep = ';'
    const encabezados = [
      'Fecha',
      'Cliente',
      'Servicio',
      'Chófer',
      'RUT Chófer',
      'Camión',
      'Km Inicio',
      'Km Término',
      'Total Km',
      'Total Gastos',
      'Detalle Gastos',
      'Foto Km Inicio URL',
      'Foto Km Término URL',
      'Ruta',
      'Observaciones',
    ]
    const rows = rutas.map((r) => [
      r.fecha,
      r.cliente,
      r.servicio,
      r.chofer,
      r.chofer_rut,
      r.camion,
      String(r.km_inicio),
      r.km_termino != null ? String(r.km_termino) : '',
      String(r.total_km),
      String(r.total_gastos),
      gastosCSV(r),
      r.foto_km_inicio || '',
      r.foto_km_termino || '',
      r.ruta || '',
      r.observaciones || '',
    ])
    const csv = [
      `Informe de Rutas,${desde},${hasta}`,
      '',
      encabezados.join(sep),
      ...rows.map((row) => row.join(sep)),
      '',
      `Total rutas,${rutas.length}`,
      `Total gastos,${rutas.reduce((s, r) => s + r.total_gastos, 0)}`,
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
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
    doc.text('Informe de Rutas', 14, 16)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Periodo: ${toChileanDate(desde)} al ${toChileanDate(hasta)}  |  Rutas completadas: ${rutas.length}`,
      14,
      24
    )

    autoTable(doc, {
      startY: 30,
      head: [
        ['Fecha', 'Cliente', 'Servicio', 'Chófer', 'Camión', 'Km Inicio', 'Km Término', 'Total Km', 'Total Gastos'],
      ],
      body: rutas.map((r) => [
        r.fecha,
        r.cliente,
        r.servicio,
        r.chofer,
        r.camion,
        String(r.km_inicio),
        r.km_termino != null ? String(r.km_termino) : '—',
        `+${r.total_km.toLocaleString('es-CL')}`,
        formatCLP(r.total_gastos),
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    })

    let cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

    if (cursor >= pageH - 20) {
      doc.addPage()
      cursor = 14
    }
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalle de gastos y evidencias', 10, cursor)
    cursor += 5

    rutas.forEach((r) => {
      const gastoCells = r.gastos.map((g) => {
        let txt = `${TIPO_GASTO_LABEL[g.tipo] || g.tipo}: ${formatCLP(g.monto)}`
        if (g.descripcion) txt += ` (${g.descripcion})`
        return txt
      })
      const resumen = `${r.fecha} - ${r.chofer} / ${r.camion} - ${r.servicio}`
      const evidencia = [
        `Foto km inicio: ${r.foto_km_inicio || 'sin foto'}`,
        `Foto km término: ${r.foto_km_termino || 'sin foto'}`,
      ]
      const lineas = [resumen, ...(gastoCells.length ? gastoCells : ['Sin gastos']), ...evidencia]
      if (r.observaciones) lineas.push(`Observaciones: ${r.observaciones}`)
      autoTable(doc, {
        startY: cursor,
        head: [[resumen]],
        body: lineas.map((l) => [l]),
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
        margin: { left: 10, right: 10 },
      })
      cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
      if (cursor >= pageH - 20) {
        doc.addPage()
        cursor = 14
      }
    })

    const total = rutas.reduce((s, r) => s + r.total_gastos, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total gastos: ${formatCLP(total)}`, 10, pageH - 12)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `rutasNX - ${new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}`,
      pageW - 10,
      pageH - 12,
      { align: 'right' }
    )

    doc.save(`informe-rutas-${desde}-${hasta}.pdf`)
    setTimeout(() => setDescargando(null), 500)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">Reportes</h1>

      <div className="rounded-xl border p-5 mb-8" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
        <p className="text-sm text-zinc-400 mb-4">Selecciona el periodo para generar el reporte de rutas terminadas</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
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
            <select
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: servicioId ? '#fff' : '#71717a' }}
            >
              <option value="">Todos</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Chófer</label>
            <select
              value={choferId}
              onChange={(e) => setChoferId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: choferId ? '#fff' : '#71717a' }}
            >
              <option value="">Todos</option>
              {choferes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Camión</label>
            <select
              value={camionId}
              onChange={(e) => setCamionId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: camionId ? '#fff' : '#71717a' }}
            >
              <option value="">Todos</option>
              {camiones.map((ca) => (
                <option key={ca.id} value={ca.id}>{ca.patente}</option>
              ))}
            </select>
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
                <span className="text-white font-medium">{rutas.length}</span> ruta{rutas.length !== 1 ? 's' : ''}{' '}
                completada{rutas.length !== 1 ? 's' : ''} del <span className="text-white">{toChileanDate(desde)}</span> al{' '}
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
            <div className="hidden md:grid grid-cols-[0.9fr_1fr_1.1fr_1.3fr_0.8fr_0.7fr_1fr] gap-3 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
              <span>Fecha</span>
              <span>Cliente</span>
              <span>Servicio</span>
              <span>Chófer / Camión</span>
              <span>Km</span>
              <span>Gastos</span>
              <span></span>
            </div>

            {rutas.map((r) => {
              const abierta = !!expandidos[r.id]
              return (
                <div key={r.id} className="border-b border-zinc-800 last:border-b-0">
                  <button
                    onClick={() => toggleExpandida(r.id)}
                    className="w-full grid grid-cols-2 md:grid-cols-[0.9fr_1fr_1.1fr_1.3fr_0.8fr_0.7fr_1fr] gap-2 md:gap-3 px-5 py-3.5 text-left items-center hover:bg-white/[0.02]"
                  >
                    <div>
                      <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Fecha</span>
                      <span className="text-sm text-white">{toChileanDate(r.fecha)}</span>
                    </div>
                    <div>
                      <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Cliente</span>
                      <span className="text-sm text-zinc-400">{r.cliente}</span>
                    </div>
                    <div>
                      <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Servicio</span>
                      <span className="text-sm text-zinc-400">{r.servicio}</span>
                    </div>
                    <div>
                      <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Chófer</span>
                      <span className="text-sm text-zinc-400">{r.chofer}</span>
                      <span className="text-xs text-zinc-600 block">{r.camion}</span>
                    </div>
                    <div>
                      <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Km</span>
                      <span className="text-sm font-medium text-emerald-400">+{r.total_km.toLocaleString('es-CL')}</span>
                    </div>
                    <div>
                      <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Gastos</span>
                      <span className="text-sm text-zinc-400">
                        {r.total_gastos > 0 ? formatCLP(r.total_gastos) : '—'}
                        <span className="text-zinc-600 block text-xs">{r.gastos.length} gasto{r.gastos.length !== 1 ? 's' : ''}</span>
                      </span>
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
                      <div className="grid sm:grid-cols-2 gap-3 text-sm text-zinc-400">
                        <div>
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Kilometraje</p>
                          <p>
                            {r.km_inicio.toLocaleString('es-CL')} →{' '}
                            {r.km_termino != null ? r.km_termino.toLocaleString('es-CL') : '—'} km
                          </p>
                          {(r.ruta || r.observaciones) && (
                            <p className="text-xs text-zinc-500 mt-1">
                              {r.ruta ? `Ruta: ${r.ruta} ` : ''}
                              {r.observaciones ? `| Obs: ${r.observaciones}` : ''}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Evidencia fotográfica</p>
                          <div className="space-y-1 text-xs">
                            {r.foto_km_inicio ? (
                              <a href={r.foto_km_inicio} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline break-all">
                                Foto km inicio
                              </a>
                            ) : (
                              <span className="text-zinc-600">Foto km inicio: sin foto</span>
                            )}
                            {r.foto_km_termino ? (
                              <a href={r.foto_km_termino} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline block break-all">
                                Foto km término
                              </a>
                            ) : (
                              <span className="text-zinc-600 block">Foto km término: sin foto</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                          Gastos ({r.gastos.length}) - Total {formatCLP(r.total_gastos)}
                        </p>
                        {r.gastos.length === 0 ? (
                          <p className="text-xs text-zinc-600">Sin gastos registrados</p>
                        ) : (
                          <div className="grid gap-2">
                            {r.gastos.map((g, i) => (
                              <div key={i} className="rounded-lg p-3" style={{ background: '#1A1A1A' }}>
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm text-white">{TIPO_GASTO_LABEL[g.tipo] || g.tipo}</p>
                                    {g.descripcion && <p className="text-xs text-zinc-500">{g.descripcion}</p>}
                                  </div>
                                  <span className="text-sm font-medium text-white">{formatCLP(g.monto)}</span>
                                </div>
                                {g.foto_url && (
                                  <a
                                    href={g.foto_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-xs text-emerald-400 hover:underline break-all"
                                  >
                                    Comprobante: {g.foto_url}
                                  </a>
                                )}
                                {!g.foto_url && <p className="mt-2 text-xs text-zinc-600">Comprobante: sin foto</p>}
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
                Gastos: {formatCLP(rutas.reduce((s, r) => s + r.total_gastos, 0))}
              </span>
            </div>
          </div>
        </>
      )}

      {!loading && rutas.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500">
            Selecciona un periodo y haz clic en &quot;Buscar&quot; para generar el reporte
          </p>
        </div>
      )}
    </div>
  )
}
