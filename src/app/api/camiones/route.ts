import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: camiones, error } = await supabase
      .from('camiones')
      .select('*')
      .eq('empresa_id', session.empresa_id)
      .order('patente')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(camiones)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { patente, marca, modelo, ano } = await request.json()

    if (!patente) {
      return NextResponse.json({ error: 'patente es requerida' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('camiones')
      .insert({
        empresa_id: session.empresa_id,
        patente,
        marca,
        modelo,
        ano,
        activo: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return errorResponse(error)
  }
}
