'use client'

import { useCallback, useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable, { type CellHookData } from 'jspdf-autotable'
import {
  RESPUESTA_VACIA,
  buildInformeCsv,
  formatNumber,
  nombreArchivoInforme,
  shiftDate,
  toChileanDate,
  todayChile,
  type FilaInforme,
  type InformeRespuesta,
} from '@/lib/informe-puntos'

interface InformePuntosProps {
  endpoint: string
  modo: 'cliente' | 'admin'
  titulo?: string
  mostrarEncabezado?: boolean
}

export default function InformePuntos({
  endpoint,
  modo,
  titulo = 'Informe de Puntos y Guías',
  mostrarEncabezado = false,
}: InformePuntosProps) {
  const today = todayChile()
  const esAdmin = modo === 'admin'

  const [desde, setDesde] = useState(today)
  const [hasta, setHasta] = useState(today)
  const [camionId, setCamionId] = useState('')
  const [choferId, setChoferId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [servicioId, setServicioId] = useState('')
  const [datos, setDatos] = useState<InformeRespuesta>(RESPUESTA_VACIA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [descargando, setDescargando] = useState<'csv' | 'pdf' | null>(null)

  const fetchInforme = useCallback(
    async (params: {
      desde: string
      hasta: string
      camionId: string
      choferId: string
      clienteId: string
      servicioId: string
    }) => {
      if (!params.desde || !params.hasta) return
      setLoading(true)
      setError('')
      try {
        const query = new URLSearchParams({ desde: params.desde, hasta: params.hasta })
        if (params.camionId) query.set('camion_id', params.camionId)
        if (params.choferId) query.set('chofer_id', params.choferId)
        if (params.clienteId) query.set('cliente_id', params.clienteId)
        if (params.servicioId) query.set('servicio_id', params.servicioId)

        const res = await fetch(`${endpoint}?${query}`)
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          setError(data.error || 'Error al generar el informe')
          setDatos(RESPUESTA_VACIA)
          return
        }

        setDatos(data)
      } catch {
        setError('Error de conexión')
        setDatos(RESPUESTA_VACIA)
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInforme({ desde: today, hasta: today, camionId: '', choferId: '', clienteId: '', servicioId: '' })
  }, [fetchInforme, today])

  function aplicarRango(nuevoDesde: string, nuevoHasta: string) {
    setDesde(nuevoDesde)
    setHasta(nuevoHasta)
    fetchInforme({ desde: nuevoDesde, hasta: nuevoHasta, camionId, choferId, clienteId, servicioId })
  }

  function buscar() {
    fetchInforme({ desde, hasta, camionId, choferId, clienteId, servicioId })
  }

  function filtrarOpciones<T extends { id: string }>(opciones: T[] | undefined, id: string): string {
    if (!id) return 'Todos'
    const opcion = (opciones || []).find((item) => item.id === id)
    if (!opcion) return 'Todos'
    if ('patente' in opcion) return String(opcion.patente)
    if ('nombre' in opcion) return String(opcion.nombre)
    return 'Todos'
  }

  function filasInforme(): FilaInforme[] {
    return datos.rutas.flatMap((ruta) => {
      const base = {
        fecha: ruta.fecha,
        camion: ruta.camion,
        cliente: ruta.cliente,
        chofer: ruta.chofer,
        servicio: ruta.servicio,
        km_inicio: ruta.km_inicio,
        km_final: ruta.km_termino != null ? formatNumber(ruta.km_termino) : '—',
        total_km: ruta.total_km,
      }

      if (ruta.puntos.length === 0) {
        return [{
          ...base,
          punto: '—',
          tipo: '—',
          km_punto: '',
          guia_url: null,
        }]
      }

      return ruta.puntos.map((punto) => ({
        ...base,
        punto: `${punto.orden}. ${punto.nombre}`,
        tipo: punto.tipo === 'retiro' ? 'Retiro' : 'Entrega',
        km_punto: formatNumber(punto.km),
        guia_url: punto.guia_url,
      }))
    })
  }

  function handleDescargarCSV() {
    if (datos.rutas.length === 0) return
    setDescargando('csv')

    const filas = filasInforme()
    const contenido = buildInformeCsv({
      filas,
      desde,
      hasta,
      camionLabel: filtrarOpciones(datos.opciones.camiones, camionId),
      choferLabel: filtrarOpciones(datos.opciones.choferes, choferId),
      clienteLabel: filtrarOpciones(datos.opciones.clientes, clienteId),
      servicioLabel: filtrarOpciones(datos.opciones.servicios, servicioId),
      resumen: datos.resumen,
      incluirCliente: esAdmin,
    })

    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivoInforme(desde, hasta, 'csv')
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDescargando(null), 500)
  }

  function handleDescargarPDF() {
    if (datos.rutas.length === 0) return
    setDescargando('pdf')

    const filas = filasInforme()
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    const camionLabel = filtrarOpciones(datos.opciones.camiones, camionId)
    const choferLabel = filtrarOpciones(datos.opciones.choferes, choferId)
    const clienteLabel = filtrarOpciones(datos.opciones.clientes, clienteId)
    const servicioLabel = filtrarOpciones(datos.opciones.servicios, servicioId)

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(titulo, 12, 16)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const filtros = [
      `Periodo: ${toChileanDate(desde)} al ${toChileanDate(hasta)}`,
      esAdmin ? `Cliente: ${clienteLabel}` : null,
      esAdmin ? `Servicio: ${servicioLabel}` : null,
      `Camión: ${camionLabel}`,
      `Chofer: ${choferLabel}`,
    ].filter(Boolean)
    doc.text(filtros.join('  |  '), 12, 23)

    autoTable(doc, {
      startY: 27,
      head: [['Rutas', 'Puntos', 'Total km']],
      body: [[
        String(datos.resumen.rutas),
        String(datos.resumen.puntos),
        `${formatNumber(datos.resumen.total_km)} km`,
      ]],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      margin: { left: 12, right: 12 },
    })

    let cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

    const head = [
      'Patente',
      ...(esAdmin ? ['Cliente'] : []),
      'Chofer',
      'Fecha',
      'Km Inicio',
      'Punto',
      'Tipo',
      'Km Punto',
      'Km Final',
      'Total Km',
      'Guía',
    ]

    const body = filas.map((fila) => [
      fila.camion,
      ...(esAdmin ? [fila.cliente] : []),
      fila.chofer,
      toChileanDate(fila.fecha),
      formatNumber(fila.km_inicio),
      fila.punto,
      fila.tipo,
      fila.km_punto,
      fila.km_final,
      formatNumber(fila.total_km),
      fila.guia_url ? 'Abrir' : '—',
    ])

    const guiaCol = head.length - 1
    const columnStyles: Record<number, { cellWidth: number }> = esAdmin
      ? {
          0: { cellWidth: 18 },
          1: { cellWidth: 30 },
          2: { cellWidth: 26 },
          3: { cellWidth: 17 },
          4: { cellWidth: 16 },
          5: { cellWidth: 54 },
          6: { cellWidth: 15 },
          7: { cellWidth: 16 },
          8: { cellWidth: 16 },
          9: { cellWidth: 16 },
          10: { cellWidth: 14 },
        }
      : {
          0: { cellWidth: 18 },
          1: { cellWidth: 28 },
          2: { cellWidth: 18 },
          3: { cellWidth: 16 },
          4: { cellWidth: 58 },
          5: { cellWidth: 15 },
          6: { cellWidth: 16 },
          7: { cellWidth: 16 },
          8: { cellWidth: 16 },
          9: { cellWidth: 14 },
        }

    autoTable(doc, {
      startY: cursor,
      head: [head],
      body,
      styles: { fontSize: 6.5, cellPadding: 1.4, overflow: 'linebreak' },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles,
      margin: { left: 12, right: 12 },
      didDrawCell: (data: CellHookData) => {
        if (data.section !== 'body' || data.column.index !== guiaCol) return
        const fila = filas[data.row.index]
        if (!fila?.guia_url) return
        doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
          url: fila.guia_url,
        })
      },
    })

    cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7

    const guias = datos.rutas.flatMap((ruta) =>
      ruta.puntos
        .filter((punto) => punto.guia_url)
        .map((punto) => ({
          fecha: ruta.fecha,
          camion: ruta.camion,
          cliente: ruta.cliente,
          chofer: ruta.chofer,
          punto: `${punto.orden}. ${punto.nombre}`,
          url: punto.guia_url as string,
        }))
    )

    if (guias.length > 0) {
      if (cursor >= pageH - 25) {
        doc.addPage()
        cursor = 14
      }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Enlaces de guías y documentos', 12, cursor)
      cursor += 4

      const cabeceraGuias = [
        'Patente',
        'Fecha',
        'Chofer',
        ...(esAdmin ? ['Cliente'] : []),
        'Punto',
        'Enlace de descarga',
      ]
      const enlaceCol = cabeceraGuias.length - 1
      const estilosGuias: Record<number, { cellWidth: number }> = esAdmin
        ? {
            0: { cellWidth: 18 },
            1: { cellWidth: 18 },
            2: { cellWidth: 26 },
            3: { cellWidth: 30 },
            4: { cellWidth: 55 },
            5: { cellWidth: 112 },
          }
        : {
            0: { cellWidth: 18 },
            1: { cellWidth: 18 },
            2: { cellWidth: 28 },
            3: { cellWidth: 60 },
            4: { cellWidth: 122 },
          }

      autoTable(doc, {
        startY: cursor,
        head: [cabeceraGuias],
        body: guias.map((g) => [
          g.camion,
          toChileanDate(g.fecha),
          g.chofer,
          ...(esAdmin ? [g.cliente] : []),
          g.punto,
          g.url,
        ]),
        styles: { fontSize: 6.5, cellPadding: 1.4, overflow: 'linebreak' },
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontSize: 7 },
        columnStyles: estilosGuias,
        margin: { left: 12, right: 12 },
        didDrawCell: (data: CellHookData) => {
          if (data.section !== 'body' || data.column.index !== enlaceCol) return
          const guia = guias[data.row.index]
          if (!guia?.url) return
          doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
            url: guia.url,
          })
        },
      })
    }

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `rutasNX - ${new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}`,
      pageW - 12,
      pageH - 8,
      { align: 'right' }
    )

    doc.save(nombreArchivoInforme(desde, hasta, 'pdf'))
    setTimeout(() => setDescargando(null), 500)
  }

  const gridClases = esAdmin
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end'

  return (
    <div>
      {mostrarEncabezado ? (
        <>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">{titulo}</h1>
          <p className="text-sm text-zinc-500 mb-6">
            Rutas cerradas por punto, ordenadas por patente y fecha: kilometraje, puntos y guías descargables.
          </p>
        </>
      ) : (
        <p className="text-sm text-zinc-500 mb-6">
          Rutas cerradas por punto de la empresa, ordenadas por patente y fecha.
        </p>
      )}

      <div
        className="mb-8 p-4 rounded-xl border flex items-start gap-3"
        style={{ background: '#1C1A0D', borderColor: '#5D5220' }}
      >
        <svg className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        <p className="text-sm text-amber-300">
          Las rutas en tránsito no se muestran en este listado. Aparecerán cuando el chofer cierre la ruta.
        </p>
      </div>

      <div className="rounded-xl border p-5 mb-8" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
        <div className={gridClases}>
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Desde</label>
            <input
              type="date"
              value={desde}
              max={hasta}
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
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
            />
          </div>
          {esAdmin && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Cliente</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: clienteId ? '#fff' : '#71717a' }}
                >
                  <option value="">Todos los clientes</option>
                  {(datos.opciones.clientes || []).map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Servicio</label>
                <select
                  value={servicioId}
                  onChange={(e) => setServicioId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: servicioId ? '#fff' : '#71717a' }}
                >
                  <option value="">Todos los servicios</option>
                  {(datos.opciones.servicios || []).map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>{servicio.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Camión</label>
            <select
              value={camionId}
              onChange={(e) => setCamionId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: camionId ? '#fff' : '#71717a' }}
            >
              <option value="">Todos los camiones</option>
              {datos.opciones.camiones.map((camion) => (
                <option key={camion.id} value={camion.id}>
                  {camion.patente}{camion.marca ? ` - ${camion.marca}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Chofer</label>
            <select
              value={choferId}
              onChange={(e) => setChoferId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: choferId ? '#fff' : '#71717a' }}
            >
              <option value="">Todos los choferes</option>
              {datos.opciones.choferes.map((chofer) => (
                <option key={chofer.id} value={chofer.id}>{chofer.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={buscar}
            disabled={loading || !desde || !hasta}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#10B981' }}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            onClick={() => aplicarRango(today, today)}
            className="px-3 py-2 rounded-lg text-xs text-zinc-300 border border-zinc-800 hover:bg-zinc-800/50 transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => aplicarRango(shiftDate(today, -1), shiftDate(today, -1))}
            className="px-3 py-2 rounded-lg text-xs text-zinc-300 border border-zinc-800 hover:bg-zinc-800/50 transition-colors"
          >
            Ayer
          </button>
          <button
            onClick={() => aplicarRango(shiftDate(today, -6), today)}
            className="px-3 py-2 rounded-lg text-xs text-zinc-300 border border-zinc-800 hover:bg-zinc-800/50 transition-colors"
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => aplicarRango(`${today.slice(0, 8)}01`, today)}
            className="px-3 py-2 rounded-lg text-xs text-zinc-300 border border-zinc-800 hover:bg-zinc-800/50 transition-colors"
          >
            Este mes
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {datos.rutas.length > 0 && (
        <>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <p className="text-sm text-zinc-400">
                <span className="text-white font-medium">{datos.resumen.rutas}</span> ruta{datos.resumen.rutas !== 1 ? 's' : ''} ·{' '}
                <span className="text-white font-medium">{datos.resumen.puntos}</span> punto{datos.resumen.puntos !== 1 ? 's' : ''} ·{' '}
                <span className="text-white font-medium">{formatNumber(datos.resumen.total_km)}</span> km
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

          <div className="space-y-3">
            {datos.rutas.map((ruta) => (
              <div
                key={ruta.id}
                className="rounded-xl border overflow-hidden"
                style={{ background: '#141414', borderColor: '#2A2A2A' }}
              >
                <div className="px-5 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-sm font-semibold text-white">{ruta.camion}</span>
                    <span className="text-sm text-zinc-400">{toChileanDate(ruta.fecha)}</span>
                    <span className="text-sm text-zinc-500">{ruta.chofer}</span>
                    {esAdmin && ruta.cliente !== '—' && (
                      <span className="text-xs text-zinc-500">{ruta.cliente}</span>
                    )}
                    {ruta.servicio !== '—' && (
                      <span className="text-xs text-zinc-600">{ruta.servicio}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>Km inicio: <span className="text-zinc-300">{formatNumber(ruta.km_inicio)}</span></span>
                    <span>Km final: <span className="text-zinc-300">{ruta.km_termino != null ? formatNumber(ruta.km_termino) : '—'}</span></span>
                    <span>Total: <span className="text-emerald-400 font-medium">+{formatNumber(ruta.total_km)} km</span></span>
                  </div>
                </div>

                {ruta.puntos.length === 0 ? (
                  <p className="px-5 py-3 text-xs text-zinc-600">Sin puntos registrados</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wide text-zinc-500 border-b border-zinc-800">
                          <th className="text-left px-5 py-2 font-medium">Punto</th>
                          <th className="text-left px-3 py-2 font-medium">Tipo</th>
                          <th className="text-right px-3 py-2 font-medium">Km punto</th>
                          <th className="text-right px-3 py-2 font-medium">Guía</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ruta.puntos.map((punto) => (
                          <tr key={punto.id} className="border-b border-zinc-800/60 last:border-b-0">
                            <td className="px-5 py-2 text-zinc-300">{punto.orden}. {punto.nombre}</td>
                            <td className="px-3 py-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                punto.tipo === 'retiro'
                                  ? 'bg-sky-500/20 text-sky-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {punto.tipo}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-zinc-300">{formatNumber(punto.km)}</td>
                            <td className="px-3 py-2 text-right">
                              {punto.guia_url ? (
                                <a
                                  href={punto.guia_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-400 hover:underline"
                                >
                                  Ver guía
                                </a>
                              ) : (
                                <span className="text-xs text-zinc-600">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && datos.rutas.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500">
            No hay rutas por puntos cerradas en el periodo seleccionado.
          </p>
        </div>
      )}
    </div>
  )
}
