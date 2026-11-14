import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireChofer()
    const supabase = createAdminClient()

    const { data: servicios, error } = await supabase
      .from('servicios')
      .select(`
        id,
        nombre,
        origen,
        destino,
        precio_km,
        precio_base,
        clientes (nombre)
      `)
      .eq('empresa_id', session.empresa_id)
      .eq('activo', true)
      .order('nombre')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(servicios)
  } catch (error) {
    return errorResponse(error)
  }
}
