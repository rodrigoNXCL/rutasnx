import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getViajeAcceso } from '@/lib/viaje-access'
import type { Database } from '@/types/database'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin', 'subadmin'])
    const supabase = createAdminClient()
    const { id } = await params

    const { data: gasto } = await supabase
      .from('gastos')
      .select('viaje_id')
      .eq('id', id)
      .single()

    if (!gasto) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    const acceso = await getViajeAcceso(session, gasto.viaje_id)

    if ('error' in acceso) {
      return NextResponse.json({ error: acceso.error }, { status: acceso.status })
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
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin', 'subadmin'])
    const supabase = createAdminClient()
    const { id } = await params

    const { data: gasto } = await supabase
      .from('gastos')
      .select('viaje_id')
      .eq('id', id)
      .single()

    if (!gasto) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    const acceso = await getViajeAcceso(session, gasto.viaje_id)

    if ('error' in acceso) {
      return NextResponse.json({ error: acceso.error }, { status: acceso.status })
    }

    const { error } = await supabase.from('gastos').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
