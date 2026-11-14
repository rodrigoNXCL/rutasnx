import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params

    const { patente, marca, modelo, ano, activo } = await request.json()

    const { data, error } = await supabase
      .from('camiones')
      .update({ patente, marca, modelo, ano, activo })
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params

    const { error } = await supabase
      .from('camiones')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
