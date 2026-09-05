import { NextResponse } from 'next/server'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const session = await requireChofer()
    const supabase = createAdminClient()

    const body = await request.json()
    const { viaje_id, tipo, monto, descripcion, foto_url } = body

    if (!viaje_id || !tipo || monto === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data: viaje } = await supabase
      .from('viajes')
      .select('id, empresa_id')
      .eq('id', viaje_id)
      .single()

    if (!viaje) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }

    if (viaje.empresa_id !== session.empresa_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { data: gasto, error: errorGasto } = await supabase
      .from('gastos')
      .insert({
        empresa_id: session.empresa_id,
        viaje_id,
        tipo,
        monto,
        descripcion: descripcion || null,
        foto_url: foto_url || null,
      })
      .select()
      .single()

    if (errorGasto) {
      return NextResponse.json({ error: errorGasto.message }, { status: 500 })
    }

    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
