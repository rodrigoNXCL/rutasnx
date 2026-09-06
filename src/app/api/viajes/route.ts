import { NextResponse } from 'next/server'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireChofer()
    const supabase = createAdminClient()

    const { data: chofer } = await supabase
      .from('choferes')
      .select('id')
      .eq('usuario_id', session.id)
      .single()

    if (!chofer) {
      return NextResponse.json({ error: 'Chófer no encontrado' }, { status: 404 })
    }

    const { data: viajes, error } = await supabase
      .from('viajes')
      .select(`
        *,
        camiones (patente, marca),
        servicios (nombre),
        gastos (*)
      `)
      .eq('chofer_id', chofer.id)
      .order('fecha', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(viajes || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireChofer()
    const supabase = createAdminClient()

    const { data: chofer } = await supabase
      .from('choferes')
      .select('id')
      .eq('usuario_id', session.id)
      .single()

    if (!chofer) {
      return NextResponse.json({ error: 'Chófer no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { camion_id, servicio_id, fecha, km_inicio, km_termino, ruta, observaciones } = body

    if (!camion_id || !fecha || km_inicio === undefined || km_termino === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (km_termino < km_inicio) {
      return NextResponse.json({ error: 'Km término debe ser mayor o igual a km inicio' }, { status: 400 })
    }

    const { data: viaje, error: errorViaje } = await supabase
      .from('viajes')
      .insert({
        empresa_id: session.empresa_id,
        chofer_id: chofer.id,
        camion_id,
        servicio_id: servicio_id || null,
        fecha,
        km_inicio,
        km_termino,
        ruta: ruta || null,
        observaciones: observaciones || null,
      })
      .select()
      .single()

    if (errorViaje) {
      if (errorViaje.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un viaje para este camión en esta fecha' }, { status: 400 })
      }
      return NextResponse.json({ error: errorViaje.message }, { status: 500 })
    }

    return NextResponse.json(viaje)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
