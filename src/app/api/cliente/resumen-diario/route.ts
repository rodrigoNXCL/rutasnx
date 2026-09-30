import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClienteIdsForUsuario } from '@/lib/cliente'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.rol !== 'cliente') {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    if (!desde || !hasta) {
      return Response.json({ error: 'Parámetros desde y hasta requeridos' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const clienteIds = await getClienteIdsForUsuario(supabase, session)

    if (clienteIds.length === 0) {
      return Response.json([])
    }

    const { data: servicios, error: errServicios } = await supabase
      .from('servicios')
      .select('id')
      .in('cliente_id', clienteIds)

    if (errServicios) {
      return Response.json({ error: errServicios.message }, { status: 500 })
    }

    const servicioIds = (servicios || []).map((s) => s.id)
    if (servicioIds.length === 0) {
      return Response.json([])
    }

    const [dAno, dMes, dDia] = desde.split('-').map(Number)
    const [hAno, hMes, hDia] = hasta.split('-').map(Number)

    const utcDesde = new Date(Date.UTC(dAno, dMes - 1, dDia, 3, 0, 0))
      .toISOString()
      .split('T')[0]
    const utcHasta = new Date(Date.UTC(hAno, hMes - 1, hDia + 1, 3, 0, 0))
      .toISOString()
      .split('T')[0]

    const { data: viajes, error } = await supabase
      .from('viajes')
      .select(`
        id,
        fecha,
        km_inicio,
        km_termino,
        gastos (tipo, monto)
      `)
      .in('servicio_id', servicioIds)
      .eq('estado', 'terminado')
      .gte('fecha', utcDesde)
      .lte('fecha', utcHasta)
      .order('fecha', { ascending: true })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const porFecha = new Map<string, { km: number; peaje: number }>()

    for (const viaje of viajes || []) {
      const key = viaje.fecha
      if (!porFecha.has(key)) {
        porFecha.set(key, { km: 0, peaje: 0 })
      }
      const entry = porFecha.get(key)!
      entry.km += viaje.km_termino != null ? viaje.km_termino - viaje.km_inicio : 0

      for (const g of viaje.gastos || []) {
        if (g.tipo === 'peaje') entry.peaje += g.monto
      }
    }

    const dias = Array.from(porFecha.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, t]) => ({
        fecha,
        total_km: t.km,
        peaje: t.peaje,
      }))

    return Response.json(dias)
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
