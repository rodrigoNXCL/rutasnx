'use client'

import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ValorKm {
  id: string
  valor: number
  fecha_desde: string
  fecha_hasta: string
  created_by: string | null
  created_at: string
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

function formatFechaHora(dt: string): string {
  return new Date(dt).toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  })
}

export default function ValorizadorTab() {
  const [valores, setValores] = useState<ValorKm[]>([])
  const [loading, setLoading] = useState(true)
  const [descargando, setDescargando] = useState<'csv' | 'pdf' | null>(null)

  useEffect(() => {
    fetch('/api/admin/valorizador')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setValores(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleDescargarCSV() {
    if (valores.length === 0) return
    setDescargando('csv')
    const sep = ';'
    const encabezados = ['Desde', 'Hasta', 'Valor por km', 'Creada']
    const rows = valores.map((v) => [
      v.fecha_desde,
      v.fecha_hasta,
      String(v.valor),
      v.created_at,
    ])
    const csv = [
      'Valorizaciones de Kilometraje',
      '',
      encabezados.join(sep),
      ...rows.map((row) => row.join(sep)),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'valorizaciones-km.csv'
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDescargando(null), 500)
  }

  function handleDescargarPDF() {
    if (valores.length === 0) return
    setDescargando('pdf')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Valorizaciones de Kilometraje', 14, 16)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Registro: ${valores.length} valorización${valores.length !== 1 ? 'es' : ''}`, 14, 24)

    autoTable(doc, {
      startY: 30,
      head: [['Desde', 'Hasta', 'Valor por km', 'Creada']],
      body: valores.map((v) => [
        toChileanDate(v.fecha_desde),
        toChileanDate(v.fecha_hasta),
        formatCLP(v.valor),
        formatFechaHora(v.created_at),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
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

    doc.save('valorizaciones-km.pdf')
    setTimeout(() => setDescargando(null), 500)
  }

  if (loading) {
    return <div className="p-8 text-sm text-zinc-500">Cargando...</div>
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          <span className="text-white font-medium">{valores.length}</span> valorización{valores.length !== 1 ? 'es' : ''} registrada{valores.length !== 1 ? 's' : ''}
        </p>
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

      {valores.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500">Sin valorizaciones registradas</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
            <span>Desde</span>
            <span>Hasta</span>
            <span>Valor por km</span>
            <span>Creada</span>
          </div>
          {valores.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr] gap-2 md:gap-4 px-5 py-3.5 border-b border-zinc-800 last:border-b-0 items-center"
            >
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Desde</span>
                <span className="text-sm text-white">{toChileanDate(v.fecha_desde)}</span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Hasta</span>
                <span className="text-sm text-white">{toChileanDate(v.fecha_hasta)}</span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Valor</span>
                <span className="text-sm font-medium text-emerald-400">{formatCLP(v.valor)}</span>
              </div>
              <div>
                <span className="md:hidden text-[10px] uppercase text-zinc-600 mr-1">Creada</span>
                <span className="text-xs text-zinc-400">{formatFechaHora(v.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
