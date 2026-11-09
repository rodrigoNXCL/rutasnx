import { describe, expect, it } from 'vitest'
import {
  buildInformeCsv,
  csvEscape,
  formatNumber,
  shiftDate,
  toChileanDate,
  todayChile,
  type FilaInforme,
} from '@/lib/informe-puntos'

const filaBase: FilaInforme = {
  fecha: '2026-11-06',
  camion: 'AB1234',
  cliente: 'Cliente; Demo',
  chofer: 'Juan Pérez',
  servicio: 'Fruta',
  km_inicio: 1000,
  punto: '1. Packing "Los Andes"',
  tipo: 'Retiro',
  km_punto: '1.050',
  km_final: '1.200',
  total_km: 200,
  guia_url: 'https://rutas.nxchile.com/s/guias/guia-1.jpg',
  archivos: [
    { url: 'https://rutas.nxchile.com/s/guias/guia-1.jpg', nombre: 'Guía', tipo: 'image/jpeg' },
    { url: 'https://rutas.nxchile.com/s/guias/guia-2.pdf', nombre: 'Documento', tipo: 'application/pdf' },
  ],
}

describe('csvEscape', () => {
  it('deja los valores simples sin cambios', () => {
    expect(csvEscape('Juan Pérez')).toBe('Juan Pérez')
  })

  it('escapa punto y coma, comillas y saltos de línea', () => {
    expect(csvEscape('a;b')).toBe('"a;b"')
    expect(csvEscape('a"b')).toBe('"a""b"')
    expect(csvEscape('a\nb')).toBe('"a\nb"')
  })

  it('neutraliza fórmulas de hoja de cálculo', () => {
    expect(csvEscape('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(csvEscape('@cmd')).toBe("'@cmd")
  })
})

describe('buildInformeCsv', () => {
  it('genera encabezados y filas para el cliente', () => {
    const csv = buildInformeCsv({
      filas: [filaBase],
      desde: '2026-11-01',
      hasta: '2026-11-06',
      camionLabel: 'AB1234',
      choferLabel: 'Juan Pérez',
      resumen: { rutas: 1, puntos: 1, total_km: 200 },
      incluirCliente: false,
    })

    expect(csv).toContain('Patente;Chofer;Fecha;Servicio')
    expect(csv).toContain('AB1234;Juan Pérez;2026-11-06;Fruta')
    expect(csv).toContain('"1. Packing ""Los Andes"""')
    expect(csv).toContain('Total rutas;1')
    expect(csv).not.toContain('Cliente;')
  })

  it('incluye cliente y servicio en modo admin', () => {
    const csv = buildInformeCsv({
      filas: [filaBase],
      desde: '2026-11-01',
      hasta: '2026-11-06',
      camionLabel: 'AB1234',
      choferLabel: 'Juan Pérez',
      clienteLabel: 'Cliente; Demo',
      servicioLabel: 'Fruta',
      resumen: { rutas: 1, puntos: 1, total_km: 200 },
      incluirCliente: true,
    })

    expect(csv).toContain('Patente;Cliente;Chofer;Fecha;Servicio')
    expect(csv).toContain('"Cliente; Demo"')
    expect(csv).toContain('Servicio;Fruta')
  })
})

describe('helpers de fecha', () => {
  it('desplaza días correctamente', () => {
    expect(shiftDate('2026-11-06', 1)).toBe('2026-11-07')
    expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31')
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('formatea fechas y números en formato chileno', () => {
    expect(toChileanDate('2026-11-06')).toBe('06-11-2026')
    expect(formatNumber(1234)).toBe('1.234')
    expect(todayChile()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
