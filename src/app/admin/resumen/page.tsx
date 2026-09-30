'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DiaResumen {
  fecha: string
  total_km: number
  peaje: number
  petroleo: number
  otros: number
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

export default function AdminResumenDiario() {
  const [hasta, setHasta] = useState(todayChile())
  const [desde, setDesde] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
  })
  const [dias, setDias] = useState<DiaResumen[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [descargando, setDescargando] = useState<'csv' | 'pdf' | null>(null)

  async function fetchDias() {
    if (!desde || !hasta) return
    setLoading(true)
    setError('')
    setDias([])
    try {
      const params = new URLSearchParams({ desde, hasta })
      const res = await fetch(`/api/admin/resumen-diario?${params}`)
      if (res.ok) {
        setDias(await res.json())
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al generar resumen')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function handleDescargarCSV() {
    if (dias.length === 0) return
    setDescargando('csv')
    const sep = ';'
    const encabezados = ['Fecha', 'Kilómetros', 'Peajes', 'Petróleo', 'Otros Gastos']
    const rows = dias.map((d) => [
      d.fecha,
      String(d.total_km),
      String(d.peaje),
      String(d.petroleo),
      String(d.otros),
    ])
    const csv = [
      `Resumen Diario,${desde},${hasta}`,
      '',
      encabezados.join(sep),
      ...rows.map((row) => row.join(sep)),
      '',
      `Total km,${dias.reduce((s, d) => s + d.total_km, 0)}`,
      `Total peajes,${dias.reduce((s, d) => s + d.peaje, 0)}`,
      `Total petróleo,${dias.reduce((s, d) => s + d.petroleo, 0)}`,
      `Total otros,${dias.reduce((s, d) => s + d.otros, 0)}`,
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resumen-diario-${desde}-${hasta}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDescargando(null), 500)
  }

  function handleDescargarPDF() {
    if (dias.length === 0) return
    setDescargando('pdf')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen Diario', 14, 16)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Periodo: ${toChileanDate(desde)} al ${toChileanDate(hasta)}  |  Días con rutas: ${dias.length}`,
      14,
      24
    )

    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Kilómetros', 'Peajes', 'Petróleo', 'Otros Gastos']],
      body: dias.map((d) => [
        d.fecha,
        `${d.total_km.toLocaleString('es-CL')} km`,
        formatCLP(d.peaje),
        formatCLP(d.petroleo),
        formatCLP(d.otros),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    })

    const totalKm = dias.reduce((s, d) => s + d.total_km, 0)
    const totalPeaje = dias.reduce((s, d) => s + d.peaje, 0)
    const totalPetroleo = dias.reduce((s, d) => s + d.petroleo, 0)
    const totalOtros = dias.reduce((s, d) => s + d.otros, 0)

    const cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

    autoTable(doc, {
      startY: cursor,
      head: [['Totales', '']],
      body: [
        ['Días con rutas', String(dias.length)],
        ['Total km', `${totalKm.toLocaleString('es-CL')} km`],
        ['Total peajes', formatCLP(totalPeaje)],
        ['Total petróleo', formatCLP(totalPetroleo)],
        ['Total otros', formatCLP(totalOtros)],
      ],
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `rutasNX - ${new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}`,
      pageW - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    )

    doc.save(`resumen-diario-${desde}-${hasta}.pdf`)
    setTimeout(() => setDescargando(null), 500)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">Resumen Diario</h1>

      <div className="rounded-xl border p-5 mb-8" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
        <p className="text-sm text-zinc-400 mb-4">Selecciona el periodo para ver el resumen diario de rutas terminadas</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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
          <button
            onClick={fetchDias}
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

      {dias.length > 0 && (
        <>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <p className="text-sm text-zinc-400">
                <span className="text-white font-medium">{dias.length}</span> día{dias.length !== 1 ? 's' : ''} con rutas del{' '}
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
            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
              <span>Fecha</span>
              <span>Kilómetros</span>
              <span>Peajes</span>
              <span>Petróleo</span>
              <span>Otros Gastos</span>
            </div>

            {dias.map((d) => (
              <div
                key={d.fecha}
                className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4 px-5 py-3.5 border-b border-zinc-800 last:border-b-0 items-center"
              >
                <div>
                  <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Fecha</span>
                  <span className="text-sm text-white">{toChileanDate(d.fecha)}</span>
                </div>
                <div>
                  <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Km</span>
                  <span className="text-sm font-medium text-emerald-400">{d.total_km.toLocaleString('es-CL')} km</span>
                </div>
                <div>
                  <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Peajes</span>
                  <span className="text-sm text-zinc-400">{d.peaje > 0 ? formatCLP(d.peaje) : '—'}</span>
                </div>
                <div>
                  <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Petróleo</span>
                  <span className="text-sm text-zinc-400">{d.petroleo > 0 ? formatCLP(d.petroleo) : '—'}</span>
                </div>
                <div>
                  <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Otros</span>
                  <span className="text-sm text-zinc-400">{d.otros > 0 ? formatCLP(d.otros) : '—'}</span>
                </div>
              </div>
            ))}

            <div className="px-5 py-3 border-t border-zinc-700 flex flex-wrap items-center justify-between gap-2" style={{ background: '#1A1A1A' }}>
              <span className="text-sm font-medium text-zinc-400">
                Total: {dias.length} día{dias.length !== 1 ? 's' : ''}
              </span>
              <span className="text-sm font-medium text-white">
                Km: {dias.reduce((s, d) => s + d.total_km, 0).toLocaleString('es-CL')}
              </span>
              <span className="text-sm font-medium text-white">
                Peajes: {formatCLP(dias.reduce((s, d) => s + d.peaje, 0))}
              </span>
              <span className="text-sm font-medium text-white">
                Petróleo: {formatCLP(dias.reduce((s, d) => s + d.petroleo, 0))}
              </span>
              <span className="text-sm font-medium text-white">
                Otros: {formatCLP(dias.reduce((s, d) => s + d.otros, 0))}
              </span>
            </div>
          </div>
        </>
      )}

      {!loading && dias.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500">
            Selecciona un periodo y haz clic en &quot;Buscar&quot; para ver el resumen diario
          </p>
        </div>
      )}
    </div>
  )
}
