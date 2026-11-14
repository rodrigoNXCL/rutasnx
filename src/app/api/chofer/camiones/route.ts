import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireChofer()
    const supabase = createAdminClient()

    const { data: camiones, error } = await supabase
      .from('camiones')
      .select('id, patente, marca, modelo')
      .eq('empresa_id', session.empresa_id)
      .eq('activo', true)
      .order('patente')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(camiones)
  } catch (error) {
    return errorResponse(error)
  }
}
