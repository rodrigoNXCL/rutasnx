import { NextResponse } from 'next/server'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

async function getChoferOwner(): Promise<{ supabase: ReturnType<typeof createAdminClient>; chofer: { id: string } | null }> {
  const session = await requireChofer()
  const supabase = createAdminClient()

  const { data: chofer } = await supabase
    .from('choferes')
    .select('id')
    .eq('usuario_id', session.id)
    .single()

  return { supabase, chofer }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, chofer } = await getChoferOwner()

    if (!chofer) {
      return NextResponse.json({ error: 'Chofer no encontrado' }, { status: 404 })
    }

    const { id } = await params

    const { data: gasto } = await supabase
      .from('gastos')
      .select('viaje_id')
      .eq('id', id)
      .single()

    if (!gasto) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    const { data: viaje } = await supabase
      .from('viajes')
      .select('id')
      .eq('id', gasto.viaje_id)
      .eq('chofer_id', chofer.id)
      .single()

    if (!viaje) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const updateData: Database['public']['Tables']['gastos']['Update'] = {}

    if (body.tipo !== undefined) updateData.tipo = body.tipo
    if (body.monto !== undefined) updateData.monto = body.monto
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion
    if (body.foto_url !== undefined) updateData.foto_url = body.foto_url

    const { data, error } = await supabase
      .from('gastos')
      .update(updateData)
      .eq('id', id)
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, chofer } = await getChoferOwner()

    if (!chofer) {
      return NextResponse.json({ error: 'Chofer no encontrado' }, { status: 404 })
    }

    const { id } = await params

    const { data: gasto } = await supabase
      .from('gastos')
      .select('viaje_id')
      .eq('id', id)
      .single()

    if (!gasto) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    const { data: viaje } = await supabase
      .from('viajes')
      .select('id')
      .eq('id', gasto.viaje_id)
      .eq('chofer_id', chofer.id)
      .single()

    if (!viaje) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { error } = await supabase.from('gastos').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}