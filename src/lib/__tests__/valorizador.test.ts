import { describe, expect, it } from 'vitest'
import { validarRango } from '@/lib/valorizador'

describe('validarRango', () => {
  it('acepta un rango válido', () => {
    expect(validarRango('2026-11-01', '2026-11-30')).toBeNull()
  })

  it('rechaza fechas faltantes o invertidas', () => {
    expect(validarRango('', '2026-11-30')).toBe(
      'fecha_desde y fecha_hasta son requeridos'
    )
    expect(validarRango('2026-11-30', '')).toBe(
      'fecha_desde y fecha_hasta son requeridos'
    )
    expect(validarRango('2026-12-01', '2026-11-30')).toBe(
      'fecha_hasta debe ser >= fecha_desde'
    )
  })
})
