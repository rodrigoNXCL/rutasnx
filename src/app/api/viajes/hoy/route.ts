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

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })

    const { data: viaje, error } = await supabase
      .from('viajes')
      .select(`
        *,
        camiones (id, patente, marca),
        servicios (id, nombre, origen, destino, clientes (nombre)),
        gastos (*)
      `)
      .eq('chofer_id', chofer.id)
      .eq('fecha', today)
      .eq('estado', 'en_curso')
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!viaje) {
      return NextResponse.json({ viaje: null })
    }

    return NextResponse.json({ viaje })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
