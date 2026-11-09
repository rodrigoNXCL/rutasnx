import type { ArchivoPunto } from '@/types/database'

export const MAX_ARCHIVOS_PUNTO = 5
export const MAX_ARCHIVO_PUNTO_BYTES = 5 * 1024 * 1024
export const TIPOS_ARCHIVO_PUNTO = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const

const TIPO_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

function urlSinParametros(url: string): string {
  return url.split('?')[0].split('#')[0]
}

export function tipoDesdeUrl(url: string): string {
  const extension = urlSinParametros(url).split('.').pop()?.toLowerCase() || ''
  return TIPO_POR_EXTENSION[extension] || 'application/octet-stream'
}

export function nombreDesdeUrl(url: string): string {
  const nombre = urlSinParametros(url).split('/').pop() || 'archivo'
  try {
    return decodeURIComponent(nombre)
  } catch {
    return nombre
  }
}

export function esImagen(tipo: string): boolean {
  return tipo.startsWith('image/')
}

export function esPdf(tipo: string, url?: string): boolean {
  if (tipo === 'application/pdf') return true
  return url ? tipoDesdeUrl(url) === 'application/pdf' : false
}

export function normalizarArchivos(value: unknown): ArchivoPunto[] {
  if (!Array.isArray(value)) return []

  const archivos: ArchivoPunto[] = []

  for (const item of value) {
    if (archivos.length >= MAX_ARCHIVOS_PUNTO) break

    if (typeof item === 'string') {
      const url = item.trim()
      if (!url) continue
      archivos.push({ url, nombre: nombreDesdeUrl(url), tipo: tipoDesdeUrl(url) })
      continue
    }

    if (!item || typeof item !== 'object') continue

    const registro = item as Record<string, unknown>
    const url = String(registro.url || '').trim()
    if (!url) continue

    const tipo = String(registro.tipo || tipoDesdeUrl(url)).trim()
    const nombre = String(registro.nombre || nombreDesdeUrl(url)).trim()

    archivos.push({
      url,
      nombre: nombre || nombreDesdeUrl(url),
      tipo,
    })
  }

  return archivos
}

export function archivosDesdePunto(punto: {
  archivos?: unknown
  foto_guia_url?: string | null
}): ArchivoPunto[] {
  const archivos = normalizarArchivos(punto.archivos)
  if (archivos.length > 0) return archivos

  const url = String(punto.foto_guia_url || '').trim()
  if (!url) return []

  const tipo = tipoDesdeUrl(url)

  return [{
    url,
    nombre: 'Guía',
    tipo: tipo === 'application/octet-stream' ? 'image/jpeg' : tipo,
  }]
}

export function imagenPrincipal(archivos: ArchivoPunto[]): string | null {
  const imagen = archivos.find((archivo) => esImagen(archivo.tipo))
  return imagen?.url || null
}

export function validarTipoArchivo(tipo: string): string | null {
  if (!(TIPOS_ARCHIVO_PUNTO as readonly string[]).includes(tipo)) {
    return 'Solo se permiten imágenes JPG, PNG, WEBP o PDF'
  }
  return null
}

export function validarArchivosPunto(archivos: ArchivoPunto[]): string | null {
  if (archivos.length === 0) {
    return 'Debes adjuntar al menos un archivo'
  }

  if (archivos.length > MAX_ARCHIVOS_PUNTO) {
    return `Puedes adjuntar máximo ${MAX_ARCHIVOS_PUNTO} archivos`
  }

  for (const archivo of archivos) {
    const errorTipo = validarTipoArchivo(archivo.tipo)
    if (errorTipo) return errorTipo
  }

  if (!archivos.some((archivo) => esImagen(archivo.tipo))) {
    return 'Debes incluir al menos una imagen de la guía'
  }

  return null
}

export function validarArchivoLocal(archivo: File): string | null {
  const errorTipo = validarTipoArchivo(archivo.type)
  if (errorTipo) return errorTipo

  if (archivo.size > MAX_ARCHIVO_PUNTO_BYTES) {
    return 'Cada archivo debe ser menor a 5 MB'
  }

  return null
}

export function archivoDesdeFile(archivo: File, url: string): ArchivoPunto {
  return {
    url,
    nombre: archivo.name || nombreDesdeUrl(url),
    tipo: archivo.type || tipoDesdeUrl(url),
  }
}

export function archivosCsv(archivos: ArchivoPunto[]): string {
  return archivos.map((archivo) => archivo.url).join(' | ')
}
