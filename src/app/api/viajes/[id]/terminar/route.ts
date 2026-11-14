import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireChofer()
    const supabase = createAdminClient()
    const { id } = await params

    const { data: chofer } = await supabase
      .from('choferes')
      .select('id, empresa_id')
      .eq('usuario_id', session.id)
      .single()

    if (!chofer) {
      return NextResponse.json({ error: 'Chófer no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { km_termino, foto_km_termino, observaciones, gastos } = body

    if (km_termino === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data: viajeActual } = await supabase
      .from('viajes')
      .select('km_inicio, km_termino, estado, observaciones, tipo_servicio_id')
      .eq('id', id)
      .eq('chofer_id', chofer.id)
      .single()

    if (!viajeActual) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }

    if (viajeActual.estado === 'terminado') {
      return NextResponse.json({ error: 'Este viaje ya fue terminado' }, { status: 400 })
    }

    const kmTermino = Number(km_termino)

    if (!Number.isInteger(kmTermino) || kmTermino < 0) {
      return NextResponse.json({ error: 'Odómetro de término inválido' }, { status: 400 })
    }

    if (kmTermino < viajeActual.km_inicio) {
      return NextResponse.json({ error: 'Km término debe ser mayor o igual a km inicio' }, { status: 400 })
    }

    let flujo: string | null = null

    if (viajeActual.tipo_servicio_id) {
      const { data: tipo } = await supabase
        .from('tipos_servicio')
        .select('flujo')
        .eq('id', viajeActual.tipo_servicio_id)
        .single()

      flujo = tipo?.flujo ?? null
    }

    const { data: ultimoPunto } = await supabase
      .from('viaje_puntos')
      .select('km_llegada')
      .eq('viaje_id', id)
      .eq('anulado', false)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (flujo === 'puntos' && !ultimoPunto) {
      return NextResponse.json(
        { error: 'Agrega al menos un punto antes de cerrar la ruta' },
        { status: 400 }
      )
    }

    if (ultimoPunto && kmTermino < ultimoPunto.km_llegada) {
      return NextResponse.json(
        { error: `El odómetro de término no puede ser menor al último punto (${ultimoPunto.km_llegada} km)` },
        { status: 400 }
      )
    }

    const cerradoAt = new Date().toISOString()

    const { data: viaje, error: errorViaje } = await supabase
      .from('viajes')
      .update({
        km_termino: kmTermino,
        foto_km_termino: foto_km_termino || null,
        observaciones: observaciones || null,
        estado: 'terminado',
        cerrado_at: cerradoAt,
        cerrado_by: session.id,
      })
      .eq('id', id)
      .eq('chofer_id', chofer.id)
      .select()
      .single()

    if (errorViaje) {
      return NextResponse.json({ error: errorViaje.message }, { status: 500 })
    }

    const { error: errorHistorial } = await supabase
      .from('viaje_historial')
      .insert({
        viaje_id: id,
        empresa_id: chofer.empresa_id,
        accion: 'cerrado',
        km_inicio_anterior: viajeActual.km_inicio,
        km_inicio_nuevo: viajeActual.km_inicio,
        km_termino_anterior: viajeActual.km_termino,
        km_termino_nuevo: kmTermino,
        observaciones_anterior: viajeActual.observaciones,
        observaciones_nuevo: observaciones || null,
        estado_anterior: viajeActual.estado,
        estado_nuevo: 'terminado',
        changed_by: session.id,
      })

    if (errorHistorial) {
      console.error('Error historial cierre:', errorHistorial)
      return NextResponse.json(
        { error: 'Ruta cerrada, pero no se pudo registrar el historial' },
        { status: 500 }
      )
    }

    if (gastos && gastos.length > 0) {
      const gastosInsert = gastos
        .filter((g: { monto: string | number }) => g.monto)
        .map((g: { tipo: string; monto: string | number; descripcion?: string; foto_url?: string }) => ({
          viaje_id: id,
          tipo: g.tipo,
          monto: parseInt(String(g.monto)),
          descripcion: g.descripcion || null,
          foto_url: g.foto_url || null,
          empresa_id: chofer.empresa_id,
        }))

      if (gastosInsert.length > 0) {
        const { error: errorGastos } = await supabase
          .from('gastos')
          .insert(gastosInsert)

        if (errorGastos) {
          console.error('Error inserting gastos:', errorGastos)
        }
      }
    }

    return NextResponse.json(viaje)
  } catch (error) {
    return errorResponse(error)
  }
}
