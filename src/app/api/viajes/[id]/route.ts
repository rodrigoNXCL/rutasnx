import { NextResponse } from 'next/server'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

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
    const { km_inicio, km_termino, foto_km_inicio, foto_km_termino, observaciones } = body

    const { data: viajeActual } = await supabase
      .from('viajes')
      .select('km_inicio, estado')
      .eq('id', id)
      .eq('chofer_id', chofer.id)
      .single()

    if (!viajeActual) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }

    const updateData: Database['public']['Tables']['viajes']['Update'] = {}

    if (km_inicio !== undefined) {
      if (km_termino !== undefined && km_termino < km_inicio) {
        return NextResponse.json({ error: 'Km término debe ser mayor o igual a km inicio' }, { status: 400 })
      }
      updateData.km_inicio = km_inicio
    }

    if (km_termino !== undefined) {
      if (km_inicio !== undefined && km_termino < km_inicio) {
        return NextResponse.json({ error: 'Km término debe ser mayor o igual a km inicio' }, { status: 400 })
      }
      if (viajeActual.km_inicio && km_termino < viajeActual.km_inicio) {
        return NextResponse.json({ error: 'Km término debe ser mayor o igual a km inicio' }, { status: 400 })
      }
      updateData.km_termino = km_termino
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

    const { data: viaje, error: errorViaje } = await supabase
      .from('viajes')
      .update(updateData)
      .eq('id', id)
      .eq('chofer_id', chofer.id)
      .select()
      .single()

    if (errorViaje) {
      return NextResponse.json({ error: errorViaje.message }, { status: 500 })
    }

    return NextResponse.json(viaje)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
