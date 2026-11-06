import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: servicios, error } = await supabase
      .from('servicios')
      .select('*, clientes(nombre), tipos_servicio!servicios_tipo_servicio_id_fkey(id, codigo, nombre, flujo)')
      .eq('empresa_id', session.empresa_id)
      .order('nombre')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(servicios)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { cliente_id, tipo_servicio_id, nombre, descripcion, origen, destino, precio_km, precio_base } = await request.json()

    if (!cliente_id || !nombre) {
      return NextResponse.json({ error: 'cliente_id y nombre son requeridos' }, { status: 400 })
    }

    if (tipo_servicio_id) {
      const { data: tipo } = await supabase
        .from('tipos_servicio')
        .select('id, activo')
        .eq('id', tipo_servicio_id)
        .eq('empresa_id', session.empresa_id)
        .single()

      if (!tipo || !tipo.activo) {
        return NextResponse.json({ error: 'Tipo de servicio inválido o inactivo' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('servicios')
      .insert({
        empresa_id: session.empresa_id,
        cliente_id,
        tipo_servicio_id: tipo_servicio_id || null,
        nombre,
        descripcion,
        origen,
        destino,
        precio_km,
        precio_base,
        activo: true,
      })
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
