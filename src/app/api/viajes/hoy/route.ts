import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
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

    const { data: viaje, error } = await supabase
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
      .eq('estado', 'en_curso')
      .order('iniciado_at', { ascending: false })
      .order('orden', { referencedTable: 'viaje_puntos', ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!viaje) {
      return NextResponse.json({ viaje: null })
    }

    const puntos = (viaje.viaje_puntos || []).filter(p => !p.anulado)

    return NextResponse.json({ viaje: { ...viaje, viaje_puntos: puntos } })
  } catch (error) {
    return errorResponse(error)
  }
}
