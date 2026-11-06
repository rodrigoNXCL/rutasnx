import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
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

    let query = supabase
      .from('viajes')
      .select(`
        id,
        fecha,
        km_inicio,
        km_termino,
        estado,
        iniciado_at,
        cerrado_at,
        cliente_id,
        tipo_servicio_id,
        camiones (id, patente, marca),
        choferes (id, nombre),
        servicios (id, nombre),
        tipos_servicio (id, codigo, nombre, flujo),
        viaje_puntos (id, anulado, foto_guia_url)
      `)
      .eq('empresa_id', session.empresa_id)
      .gte('fecha', utcDesde)
      .lte('fecha', utcHasta)
      .order('fecha', { ascending: false })
      .order('iniciado_at', { ascending: false })

    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('cliente_id')
    const choferId = searchParams.get('chofer_id')
    const camionId = searchParams.get('camion_id')
    const tipoServicioId = searchParams.get('tipo_servicio_id')

    if (estado) query = query.eq('estado', estado)
    if (clienteId) query = query.eq('cliente_id', clienteId)
    if (choferId) query = query.eq('chofer_id', choferId)
    if (camionId) query = query.eq('camion_id', camionId)
    if (tipoServicioId) query = query.eq('tipo_servicio_id', tipoServicioId)

    const { data: viajes, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rutas = (viajes || []).map(viaje => {
      const puntos = (viaje.viaje_puntos || []).filter(p => !p.anulado)
      return {
        ...viaje,
        puntos_count: puntos.length,
        primera_guia: puntos[0]?.foto_guia_url || null,
        viaje_puntos: undefined,
      }
    })

    return NextResponse.json(rutas)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
