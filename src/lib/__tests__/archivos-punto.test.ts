import { describe, expect, it } from 'vitest'
import {
  MAX_ARCHIVOS_PUNTO,
  archivosCsv,
  archivosDesdePunto,
  imagenPrincipal,
  normalizarArchivos,
  tipoDesdeUrl,
  validarArchivosPunto,
} from '@/lib/archivos-punto'

describe('tipoDesdeUrl', () => {
  it('detecta imágenes y documentos', () => {
    expect(tipoDesdeUrl('https://x/guias/foto.jpg')).toBe('image/jpeg')
    expect(tipoDesdeUrl('https://x/guias/foto.png?token=1')).toBe('image/png')
    expect(tipoDesdeUrl('https://x/guias/foto.webp#v')).toBe('image/webp')
    expect(tipoDesdeUrl('https://x/guias/guia.pdf')).toBe('application/pdf')
    expect(tipoDesdeUrl('https://x/guias/archivo')).toBe('application/octet-stream')
  })
})

describe('normalizarArchivos', () => {
  it('normaliza strings y objetos', () => {
    expect(normalizarArchivos([
      'https://x/guias/foto.jpg',
      { url: 'https://x/guias/guia.pdf', nombre: 'Guía', tipo: 'application/pdf' },
    ])).toEqual([
      { url: 'https://x/guias/foto.jpg', nombre: 'foto.jpg', tipo: 'image/jpeg' },
      { url: 'https://x/guias/guia.pdf', nombre: 'Guía', tipo: 'application/pdf' },
    ])
  })

  it('ignora valores inválidos y limita la cantidad', () => {
    expect(normalizarArchivos(null)).toEqual([])
    expect(normalizarArchivos(['', null, { nombre: 'Sin URL' }])).toEqual([])

    const muchos = Array.from({ length: MAX_ARCHIVOS_PUNTO + 2 }, (_, index) =>
      `https://x/guias/foto-${index}.jpg`
    )
    expect(normalizarArchivos(muchos)).toHaveLength(MAX_ARCHIVOS_PUNTO)
  })
})

describe('archivosDesdePunto', () => {
  it('usa el fallback de foto_guia_url', () => {
    expect(archivosDesdePunto({ foto_guia_url: 'https://x/guias/guia.pdf' })).toEqual([
      { url: 'https://x/guias/guia.pdf', nombre: 'Guía', tipo: 'application/pdf' },
    ])
  })

  it('prioriza el arreglo de archivos', () => {
    const archivos = [{ url: 'https://x/guias/foto.png', nombre: 'Foto', tipo: 'image/png' }]
    expect(archivosDesdePunto({ archivos, foto_guia_url: 'https://x/otra.jpg' })).toEqual(archivos)
  })
})

describe('validarArchivosPunto', () => {
  it('exige al menos un archivo y una imagen', () => {
    expect(validarArchivosPunto([])).toMatch(/al menos un archivo/)
    expect(validarArchivosPunto([
      { url: 'https://x/guias/guia.pdf', nombre: 'Guía', tipo: 'application/pdf' },
    ])).toMatch(/al menos una imagen/)
  })

  it('acepta imagen más documento y rechaza tipos no permitidos', () => {
    expect(validarArchivosPunto([
      { url: 'https://x/guias/foto.jpg', nombre: 'Foto', tipo: 'image/jpeg' },
      { url: 'https://x/guias/guia.pdf', nombre: 'Guía', tipo: 'application/pdf' },
    ])).toBeNull()

    expect(validarArchivosPunto([
      { url: 'https://x/guias/foto.jpg', nombre: 'Foto', tipo: 'image/jpeg' },
      { url: 'https://x/guias/nota.txt', nombre: 'Nota', tipo: 'text/plain' },
    ])).toMatch(/Solo se permiten/)
  })
})

describe('imagenPrincipal y archivosCsv', () => {
  it('elige la primera imagen y une las URLs', () => {
    const archivos = [
      { url: 'https://x/guias/guia.pdf', nombre: 'Guía', tipo: 'application/pdf' },
      { url: 'https://x/guias/foto.jpg', nombre: 'Foto', tipo: 'image/jpeg' },
      { url: 'https://x/guias/foto-2.png', nombre: 'Foto 2', tipo: 'image/png' },
    ]

    expect(imagenPrincipal(archivos)).toBe('https://x/guias/foto.jpg')
    expect(archivosCsv(archivos)).toBe(
      'https://x/guias/guia.pdf | https://x/guias/foto.jpg | https://x/guias/foto-2.png'
    )
  })
})
