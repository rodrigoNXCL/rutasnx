import { NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    await requireSuperadmin()
    const supabase = createAdminClient()

    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nombre')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(empresas)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperadmin()
    const supabase = createAdminClient()

    const { nombre, rut, telefono, email } = await request.json()

    if (!nombre || !rut) {
      return NextResponse.json({ error: 'nombre y rut son requeridos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('empresas')
      .insert({ nombre, rut, telefono, email })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
