import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getViajeAcceso } from '@/lib/viaje-access'
import type { Database } from '@/types/database'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin'])
    const supabase = createAdminClient()
    const { id } = await params

    const acceso = await getViajeAcceso(session, id)

    if ('error' in acceso) {
      return NextResponse.json({ error: acceso.error }, { status: acceso.status })
    }

    const viajeActual = acceso.viaje
    const body = await request.json()
    const {
      km_inicio,
      km_termino,
      foto_km_inicio,
      foto_km_termino,
      observaciones,
      motivo,
    } = body

    const motivoLimpio = String(motivo || '').trim()

    if (acceso.flujo === 'puntos' && !motivoLimpio) {
      return NextResponse.json(
        { error: 'El motivo de la corrección es obligatorio' },
        { status: 400 }
      )
    }

    const updateData: Database['public']['Tables']['viajes']['Update'] = {}
    const nuevoKmInicio = km_inicio === undefined ? viajeActual.km_inicio : Number(km_inicio)
    const nuevoKmTermino = km_termino === undefined
      ? viajeActual.km_termino
      : Number(km_termino)

    if (!Number.isInteger(nuevoKmInicio) || nuevoKmInicio < 0) {
      return NextResponse.json({ error: 'Odómetro inicial inválido' }, { status: 400 })
    }

    if (nuevoKmTermino !== null && (!Number.isInteger(nuevoKmTermino) || nuevoKmTermino < 0)) {
      return NextResponse.json({ error: 'Odómetro de término inválido' }, { status: 400 })
    }

    if (nuevoKmTermino !== null && nuevoKmTermino < nuevoKmInicio) {
      return NextResponse.json({ error: 'Km término debe ser mayor o igual a km inicio' }, { status: 400 })
    }

    if (acceso.flujo === 'puntos') {
      const { data: primerPunto } = await supabase
        .from('viaje_puntos')
        .select('km_llegada')
        .eq('viaje_id', id)
        .eq('anulado', false)
        .order('orden', { ascending: true })
        .limit(1)
        .maybeSingle()

      const { data: ultimoPunto } = await supabase
        .from('viaje_puntos')
        .select('km_llegada')
        .eq('viaje_id', id)
        .eq('anulado', false)
        .order('orden', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (primerPunto && nuevoKmInicio > primerPunto.km_llegada) {
        return NextResponse.json(
          { error: `El odómetro inicial no puede superar el primer punto (${primerPunto.km_llegada} km)` },
          { status: 400 }
        )
      }

      if (ultimoPunto && nuevoKmTermino !== null && nuevoKmTermino < ultimoPunto.km_llegada) {
        return NextResponse.json(
          { error: `El odómetro de término no puede ser menor al último punto (${ultimoPunto.km_llegada} km)` },
          { status: 400 }
        )
      }
    }

    if (km_inicio !== undefined) {
      updateData.km_inicio = nuevoKmInicio
    }

    if (km_termino !== undefined) {
      updateData.km_termino = nuevoKmTermino
    }

    if (foto_km_inicio !== undefined) {
      updateData.foto_km_inicio = foto_km_inicio
    }

    if (foto_km_termino !== undefined) {
      updateData.foto_km_termino = foto_km_termino
    }

    if (observaciones !== undefined) {
      updateData.observaciones = observaciones
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(viajeActual)
    }

    const { data: viaje, error: errorViaje } = await supabase
      .from('viajes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (errorViaje) {
      return NextResponse.json({ error: errorViaje.message }, { status: 500 })
    }

    const { error: errorHistorial } = await supabase
      .from('viaje_historial')
      .insert({
        viaje_id: id,
        empresa_id: viajeActual.empresa_id,
        accion: 'modificado',
        km_inicio_anterior: viajeActual.km_inicio,
        km_inicio_nuevo: viaje.km_inicio,
        km_termino_anterior: viajeActual.km_termino,
        km_termino_nuevo: viaje.km_termino,
        foto_km_inicio_anterior: viajeActual.foto_km_inicio,
        foto_km_inicio_nuevo: viaje.foto_km_inicio,
        foto_km_termino_anterior: viajeActual.foto_km_termino,
        foto_km_termino_nuevo: viaje.foto_km_termino,
        observaciones_anterior: viajeActual.observaciones,
        observaciones_nuevo: viaje.observaciones,
        estado_anterior: viajeActual.estado,
        estado_nuevo: viaje.estado,
        motivo: motivoLimpio || null,
        changed_by: session.id,
      })

    if (errorHistorial) {
      console.error('Error historial viaje:', errorHistorial)
      return NextResponse.json(
        { error: 'Ruta actualizada, pero no se pudo registrar el historial' },
        { status: 500 }
      )
    }

    return NextResponse.json(viaje)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
