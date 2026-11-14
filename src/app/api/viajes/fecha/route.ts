import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const session = await requireChofer()
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }

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
        camiones (id, patente, marca),
        servicios (id, nombre, origen, destino, clientes (nombre)),
        tipos_servicio (id, codigo, nombre, flujo),
        viaje_puntos (*),
        gastos (*)
      `)
      .eq('chofer_id', chofer.id)
      .eq('fecha', fecha)
      .order('iniciado_at', { ascending: true })
      .order('orden', { referencedTable: 'viaje_puntos', ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const normalizados = (viajes || []).map(viaje => ({
      ...viaje,
      viaje_puntos: (viaje.viaje_puntos || []).filter(p => !p.anulado),
    }))

    return NextResponse.json({
      viaje: normalizados[0] || null,
      viajes: normalizados,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
