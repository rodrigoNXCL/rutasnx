import { NextResponse } from 'next/server'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const {
      id: viajeId,
      camion_id,
      servicio_id,
      fecha,
      km_inicio,
      foto_km_inicio,
      iniciado_at,
    } = body

    if (!camion_id || !fecha || km_inicio === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const kmInicio = Number(km_inicio)

    if (!Number.isInteger(kmInicio) || kmInicio < 0) {
      return NextResponse.json({ error: 'Odómetro inicial inválido' }, { status: 400 })
    }

    const { data: camion } = await supabase
      .from('camiones')
      .select('id')
      .eq('id', camion_id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!camion) {
      return NextResponse.json({ error: 'Camión no encontrado' }, { status: 404 })
    }

    const { data: asignacionActiva } = await supabase
      .from('asignaciones')
      .select('id')
      .eq('chofer_id', chofer.id)
      .eq('camion_id', camion_id)
      .eq('activo', true)
      .maybeSingle()

    if (!asignacionActiva) {
      return NextResponse.json(
        { error: 'El camión no está asignado al chófer' },
        { status: 400 }
      )
    }

    let servicio: {
      id: string
      cliente_id: string
      tipo_servicio_id: string
    } | null = null

    if (servicio_id) {
      const { data } = await supabase
        .from('servicios')
        .select('id, cliente_id, tipo_servicio_id')
        .eq('id', servicio_id)
        .eq('empresa_id', session.empresa_id)
        .single()

      if (!data) {
        return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
      }

      servicio = data
    }

    const { data: viaje, error: errorViaje } = await supabase
      .from('viajes')
      .insert({
        id: viajeId || undefined,
        empresa_id: session.empresa_id,
        chofer_id: chofer.id,
        camion_id,
        servicio_id: servicio?.id || null,
        tipo_servicio_id: servicio?.tipo_servicio_id || null,
        cliente_id: servicio?.cliente_id || null,
        fecha,
        km_inicio: kmInicio,
        foto_km_inicio: foto_km_inicio || null,
        iniciado_at: iniciado_at || new Date().toISOString(),
        estado: 'en_curso',
      })
      .select()
      .single()

    if (errorViaje) {
      if (errorViaje.code === '23505') {
        return NextResponse.json(
          { error: 'Ya tienes una ruta abierta o el camión ya está en uso' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: errorViaje.message }, { status: 500 })
    }

    return NextResponse.json(viaje)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
