import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params

    const { cliente_id, tipo_servicio_id, nombre, descripcion, origen, destino, precio_km, precio_base, activo } = await request.json()

    if (tipo_servicio_id) {
      const { data: tipo } = await supabase
        .from('tipos_servicio')
        .select('id, activo')
        .eq('id', tipo_servicio_id)
        .eq('empresa_id', session.empresa_id)
        .single()

      if (!tipo) {
        return NextResponse.json({ error: 'Tipo de servicio inválido' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('servicios')
      .update({ cliente_id, tipo_servicio_id: tipo_servicio_id || null, nombre, descripcion, origen, destino, precio_km, precio_base, activo })
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params

    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
