import { afterEach, describe, expect, it } from 'vitest'
import { formatRUT, normalizeText, validateRUT } from '@/lib/utils'
import { shortenStorageUrl } from '@/lib/short-url'

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

afterEach(() => {
  if (originalSupabaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
  }
})

describe('normalizeText', () => {
  it('quita tildes, mayúsculas y espacios extra', () => {
    expect(normalizeText('  CamiÓn   Ñuñoa ')).toBe('camion nunoa')
  })
})

describe('RUT', () => {
  it('valida y formatea un RUT correcto', () => {
    expect(validateRUT('123456785')).toBe(true)
    expect(validateRUT('12345678-5')).toBe(true)
    expect(validateRUT('12345678-4')).toBe(false)
    expect(formatRUT('123456785')).toBe('12.345.678-5')
  })
})

describe('shortenStorageUrl', () => {
  it('acorta URLs públicas del storage de Supabase', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co'
    expect(
      shortenStorageUrl(
        'https://abc.supabase.co/storage/v1/object/public/guias/ruta/guia.jpg?token=1',
        'https://rutas.nxchile.com'
      )
    ).toBe('https://rutas.nxchile.com/s/guias/ruta/guia.jpg?token=1')
  })

  it('deja intactas las URLs externas o inválidas', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co'
    expect(shortenStorageUrl('https://otro.com/foo.jpg', 'https://rutas.nxchile.com')).toBe(
      'https://otro.com/foo.jpg'
    )
    expect(shortenStorageUrl(null, 'https://rutas.nxchile.com')).toBeNull()
  })
})
