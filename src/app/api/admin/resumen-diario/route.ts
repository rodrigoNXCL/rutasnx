import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireAdminOrSubadmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCamionesSubadmin } from '@/lib/subadmin'

export async function GET(request: Request) {
  try {
    const session = await requireAdminOrSubadmin()
    const supabase = createAdminClient()

    const camionesSubadmin = await getCamionesSubadmin(supabase, session)

    if (camionesSubadmin !== null && camionesSubadmin.length === 0) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    if (!desde || !hasta) {
      return NextResponse.json(
        { error: 'Parámetros desde y hasta requeridos' },
        { status: 400 }
      )
    }

    const [dAno, dMes, dDia] = desde.split('-').map(Number)
    const [hAno, hMes, hDia] = hasta.split('-').map(Number)

    const utcDesde = new Date(Date.UTC(dAno, dMes - 1, dDia, 3, 0, 0))
      .toISOString()
      .split('T')[0]
    const utcHasta = new Date(Date.UTC(hAno, hMes - 1, hDia + 1, 3, 0, 0))
      .toISOString()
      .split('T')[0]

    let viajesQuery = supabase
      .from('viajes')
      .select(`
        id,
        fecha,
        km_inicio,
        km_termino,
        gastos (tipo, monto)
      `)
      .eq('empresa_id', session.empresa_id)
      .eq('estado', 'terminado')
      .gte('fecha', utcDesde)
      .lte('fecha', utcHasta)
      .order('fecha', { ascending: true })

    if (camionesSubadmin !== null) {
      viajesQuery = viajesQuery.in('camion_id', camionesSubadmin)
    }

    const { data: viajes, error } = await viajesQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: valoresKm } = await supabase
      .from('valor_km')
      .select('valor, fecha_desde, fecha_hasta')
      .eq('empresa_id', session.empresa_id)

    const porFecha = new Map<string, { km: number; peaje: number; petroleo: number; otros: number }>()

    for (const viaje of viajes || []) {
      const key = viaje.fecha
      if (!porFecha.has(key)) {
        porFecha.set(key, { km: 0, peaje: 0, petroleo: 0, otros: 0 })
      }
      const entry = porFecha.get(key)!
      entry.km += viaje.km_termino != null ? viaje.km_termino - viaje.km_inicio : 0

      for (const g of viaje.gastos || []) {
        if (g.tipo === 'peaje') entry.peaje += g.monto
        else if (g.tipo === 'combustible') entry.petroleo += g.monto
        else entry.otros += g.monto
      }
    }

    const dias = Array.from(porFecha.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, t]) => {
        const valorKm = (valoresKm || []).find(
          (v) => v.fecha_desde <= fecha && v.fecha_hasta >= fecha
        )
        const valor = valorKm?.valor ?? null
        return {
          fecha,
          total_km: t.km,
          valor_km: valor,
          valor_total: valor != null ? t.km * valor : null,
          peaje: t.peaje,
          petroleo: t.petroleo,
          otros: t.otros,
        }
      })

    return NextResponse.json(dias)
  } catch (error) {
    return errorResponse(error)
  }
}
