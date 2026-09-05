import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: asignaciones, error } = await supabase
      .from('asignaciones')
      .select(`
        *,
        choferes (id, nombre, rut),
        camiones (id, patente),
        servicios (id, nombre)
      `)
      .eq('empresa_id', session.empresa_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(asignaciones)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { chofer_id, camion_id, servicio_id, observaciones } = await request.json()

    if (!chofer_id || !camion_id || !servicio_id) {
      return NextResponse.json({ error: 'chofer_id, camion_id y servicio_id son requeridos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('asignaciones')
      .insert({
        empresa_id: session.empresa_id,
        chofer_id,
        camion_id,
        servicio_id,
        observaciones: observaciones || null,
        activo: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Esta combinación ya existe' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
