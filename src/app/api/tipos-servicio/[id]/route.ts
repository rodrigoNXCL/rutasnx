import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FlujoServicio } from '@/types/database'

const FLUJOS: FlujoServicio[] = ['simple', 'puntos']

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params
    const body = await request.json()

    const nombre = String(body.nombre || '').trim()
    const flujo = body.flujo as FlujoServicio
    const activo = body.activo

    if (!nombre || !FLUJOS.includes(flujo) || typeof activo !== 'boolean') {
      return NextResponse.json(
        { error: 'nombre, flujo y activo son requeridos' },
        { status: 400 }
      )
    }

    const { data: existente } = await supabase
      .from('tipos_servicio')
      .select('id')
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!existente) {
      return NextResponse.json({ error: 'Tipo de servicio no encontrado' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('tipos_servicio')
      .update({ nombre, flujo, activo })
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params

    const { data: tipo } = await supabase
      .from('tipos_servicio')
      .select('id, codigo')
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!tipo) {
      return NextResponse.json({ error: 'Tipo de servicio no encontrado' }, { status: 404 })
    }

    if (tipo.codigo === 'reparto') {
      return NextResponse.json(
        { error: 'El tipo Reparto es el predeterminado; puedes desactivarlo pero no eliminarlo' },
        { status: 400 }
      )
    }

    const { count, error: countError } = await supabase
      .from('servicios')
      .select('id', { count: 'exact', head: true })
      .eq('tipo_servicio_id', id)
      .eq('empresa_id', session.empresa_id)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: 'Este tipo está en uso. Desactívalo en lugar de eliminarlo.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('tipos_servicio')
      .delete()
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
