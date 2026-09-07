import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { shortenStorageUrl } from '@/lib/short-url'

export async function GET(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const servicioId = searchParams.get('servicio_id')
    const choferId = searchParams.get('chofer_id')
    const camionId = searchParams.get('camion_id')

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

    let query = supabase
      .from('viajes')
      .select(`
        id,
        fecha,
        km_inicio,
        km_termino,
        ruta,
        observaciones,
        estado,
        foto_km_inicio,
        foto_km_termino,
        created_at,
        camiones (id, patente, marca),
        servicios (id, nombre, origen, destino, clientes (nombre)),
        choferes (id, nombre, rut),
        gastos (id, tipo, monto, descripcion, foto_url)
      `)
      .eq('empresa_id', session.empresa_id)
      .eq('estado', 'terminado')
      .gte('fecha', utcDesde)
      .lte('fecha', utcHasta)
      .order('fecha', { ascending: false })

    if (servicioId) query = query.eq('servicio_id', servicioId)
    if (choferId) query = query.eq('chofer_id', choferId)
    if (camionId) query = query.eq('camion_id', camionId)

    const { data: viajes, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const baseUrl = new URL(request.url).origin

    const rutas = (viajes || []).map((viaje) => ({
      id: viaje.id,
      fecha: viaje.fecha,
      chofer: viaje.choferes?.nombre || '—',
      chofer_rut: viaje.choferes?.rut || '',
      camion: viaje.camiones?.patente || '—',
      camion_marca: viaje.camiones?.marca || '',
      servicio: viaje.servicios?.nombre || '—',
      servicio_origen: viaje.servicios?.origen || '',
      servicio_destino: viaje.servicios?.destino || '',
      cliente: viaje.servicios?.clientes?.nombre || '—',
      km_inicio: viaje.km_inicio,
      km_termino: viaje.km_termino,
      total_km: viaje.km_termino != null ? viaje.km_termino - viaje.km_inicio : 0,
      ruta: viaje.ruta,
      observaciones: viaje.observaciones,
      foto_km_inicio: shortenStorageUrl(viaje.foto_km_inicio, baseUrl),
      foto_km_termino: shortenStorageUrl(viaje.foto_km_termino, baseUrl),
      gastos: (viaje.gastos || []).map((g) => ({
        tipo: g.tipo,
        monto: g.monto,
        descripcion: g.descripcion,
        foto_url: shortenStorageUrl(g.foto_url, baseUrl),
      })),
      total_gastos: (viaje.gastos || []).reduce((sum, g) => sum + g.monto, 0),
    }))

    return NextResponse.json(rutas)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
