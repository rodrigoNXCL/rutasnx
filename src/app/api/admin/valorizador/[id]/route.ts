import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { haySolapamiento, validarRango } from '@/lib/valorizador'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params

    const { data: actual } = await supabase
      .from('valor_km')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!actual) {
      return NextResponse.json({ error: 'Valorización no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const valor = body.valor !== undefined ? Number(body.valor) : actual.valor
    const fechaDesde = body.fecha_desde ?? actual.fecha_desde
    const fechaHasta = body.fecha_hasta ?? actual.fecha_hasta

    const errorRango = validarRango(fechaDesde, fechaHasta)
    if (errorRango) {
      return NextResponse.json({ error: errorRango }, { status: 400 })
    }

    if (!Number.isFinite(valor) || valor < 0) {
      return NextResponse.json({ error: 'valor debe ser un número >= 0' }, { status: 400 })
    }

    if (await haySolapamiento(supabase, session.empresa_id, fechaDesde, fechaHasta, id)) {
      return NextResponse.json(
        { error: 'El rango de fechas se solapa con otra valorización existente' },
        { status: 400 }
      )
    }

    const { data: actualizado, error } = await supabase
      .from('valor_km')
      .update({ valor, fecha_desde: fechaDesde, fecha_hasta: fechaHasta })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('valor_km_historial').insert({
      valor_km_id: id,
      empresa_id: session.empresa_id,
      accion: 'modificado',
      valor_anterior: actual.valor,
      valor_nuevo: valor,
      fecha_desde_anterior: actual.fecha_desde,
      fecha_hasta_anterior: actual.fecha_hasta,
      fecha_desde_nuevo: fechaDesde,
      fecha_hasta_nuevo: fechaHasta,
      changed_by: session.id,
    })

    return NextResponse.json(actualizado)
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

    const { data: actual } = await supabase
      .from('valor_km')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!actual) {
      return NextResponse.json({ error: 'Valorización no encontrada' }, { status: 404 })
    }

    const { error } = await supabase
      .from('valor_km')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('valor_km_historial').insert({
      valor_km_id: id,
      empresa_id: session.empresa_id,
      accion: 'eliminado',
      valor_anterior: actual.valor,
      valor_nuevo: actual.valor,
      fecha_desde_anterior: actual.fecha_desde,
      fecha_hasta_anterior: actual.fecha_hasta,
      fecha_desde_nuevo: actual.fecha_desde,
      fecha_hasta_nuevo: actual.fecha_hasta,
      changed_by: session.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
