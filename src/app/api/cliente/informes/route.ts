import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.rol !== 'cliente') {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const servicioId = searchParams.get('servicio_id')

    if (!desde || !hasta) {
      return Response.json({ error: 'Parámetros desde y hasta requeridos' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('usuario_id', session.id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!cliente) {
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

    let query = supabase
      .from('servicios')
      .select(`
        id,
        nombre,
        viajes (
          id,
          fecha,
          km_inicio,
          km_termino,
          ruta,
          observaciones,
          estado,
          camiones (patente),
          choferes (usuarios (nombre)),
          gastos (id, tipo, monto, descripcion)
        )
      `)
      .eq('cliente_id', cliente.id)
      .eq('activo', true)
      .eq('viajes.estado', 'terminado')
      .gte('viajes.fecha', utcDesde)
      .lte('viajes.fecha', utcHasta)
      .order('fecha', { referencedTable: 'viajes', ascending: false })

    if (servicioId) {
      query = query.eq('id', servicioId)
    }

    const { data: servicios, error } = await query

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const rutas = (servicios || []).flatMap((servicio) =>
      (servicio.viajes || []).map((viaje) => ({
        servicio: servicio.nombre,
        fecha: viaje.fecha,
        chofer: viaje.choferes?.usuarios?.nombre || '—',
        camion: viaje.camiones?.patente || '—',
        km_inicio: viaje.km_inicio,
        km_termino: viaje.km_termino,
        total_km: viaje.km_termino != null ? viaje.km_termino - viaje.km_inicio : 0,
        ruta: viaje.ruta,
        observaciones: viaje.observaciones,
        gastos_peaje: (viaje.gastos || []).filter((g) => g.tipo === 'peaje'),
        total_peaje: (viaje.gastos || [])
          .filter((g) => g.tipo === 'peaje')
          .reduce((sum, g) => sum + g.monto, 0),
      }))
    )

    rutas.sort((a, b) => b.fecha.localeCompare(a.fecha))

    return Response.json(rutas)
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
