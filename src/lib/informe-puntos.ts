import { archivosCsv } from '@/lib/archivos-punto'
import type { ArchivoPunto } from '@/types/database'

export interface PuntoInforme {
  id: string
  orden: number
  tipo: 'retiro' | 'entrega'
  nombre: string
  km: number
  guia_url: string | null
  archivos: ArchivoPunto[]
  captured_at: string
}

export interface RutaPuntos {
  id: string
  fecha: string
  camion_id: string | null
  camion: string
  camion_marca: string
  chofer_id: string | null
  chofer: string
  chofer_rut: string
  cliente_id: string | null
  cliente: string
  servicio: string
  km_inicio: number
  km_termino: number | null
  total_km: number
  puntos: PuntoInforme[]
}

export interface OpcionCamion {
  id: string
  patente: string
  marca: string | null
}

export interface OpcionSimple {
  id: string
  nombre: string
}

export interface InformeRespuesta {
  rutas: RutaPuntos[]
  opciones: {
    camiones: OpcionCamion[]
    choferes: OpcionSimple[]
    clientes?: OpcionSimple[]
    servicios?: OpcionSimple[]
  }
  resumen: {
    rutas: number
    puntos: number
    total_km: number
  }
}

export interface FilaInforme {
  fecha: string
  camion: string
  cliente: string
  chofer: string
  servicio: string
  km_inicio: number
  punto: string
  tipo: string
  km_punto: string
  km_final: string
  total_km: number
  guia_url: string | null
  guia_label?: string
  archivos: ArchivoPunto[]
}

export const RESPUESTA_VACIA: InformeRespuesta = {
  rutas: [],
  opciones: { camiones: [], choferes: [], clientes: [], servicios: [] },
  resumen: { rutas: 0, puntos: 0, total_km: 0 },
}

export function todayChile(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}

export function toChileanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Santiago',
  })
}

export function formatNumber(value: number): string {
  return value.toLocaleString('es-CL')
}

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

export function csvEscape(value: string): string {
  let text = String(value ?? '')

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`
  }

  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

interface BuildCsvParams {
  filas: FilaInforme[]
  desde: string
  hasta: string
  camionLabel: string
  choferLabel: string
  clienteLabel?: string
  servicioLabel?: string
  resumen: InformeRespuesta['resumen']
  incluirCliente: boolean
}

export function buildInformeCsv({
  filas,
  desde,
  hasta,
  camionLabel,
  choferLabel,
  clienteLabel,
  servicioLabel,
  resumen,
  incluirCliente,
}: BuildCsvParams): string {
  const encabezados = [
    'Patente',
    ...(incluirCliente ? ['Cliente'] : []),
    'Chofer',
    'Fecha',
    'Servicio',
    'Km Inicio',
    'Punto',
    'Tipo',
    'Km Punto',
    'Km Final',
    'Total Km Día',
    'Guía (URL)',
    'Archivos (URLs)',
  ]

  const meta = [
    ['Informe de Puntos y Guías'],
    ['Periodo', desde, hasta],
    ['Camión', camionLabel],
    ['Chofer', choferLabel],
    ...(incluirCliente ? [['Cliente', clienteLabel || 'Todos']] : []),
    ...(incluirCliente ? [['Servicio', servicioLabel || 'Todos']] : []),
  ]

  const rows = filas.map((fila) => [
    fila.camion,
    ...(incluirCliente ? [fila.cliente] : []),
    fila.chofer,
    fila.fecha,
    fila.servicio,
    String(fila.km_inicio),
    fila.punto,
    fila.tipo,
    fila.km_punto,
    fila.km_final,
    String(fila.total_km),
    fila.guia_url || '',
    archivosCsv(fila.archivos),
  ])

  return [
    ...meta.map((linea) => linea.map(csvEscape).join(';')),
    '',
    encabezados.map(csvEscape).join(';'),
    ...rows.map((row) => row.map(csvEscape).join(';')),
    '',
    `Total rutas;${resumen.rutas}`,
    `Total puntos;${resumen.puntos}`,
    `Total km;${resumen.total_km}`,
  ].join('\n')
}

export function nombreArchivoInforme(desde: string, hasta: string, extension: 'csv' | 'pdf'): string {
  return `informe-puntos-${desde}-${hasta}.${extension}`
}
