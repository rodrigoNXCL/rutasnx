import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
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

    const { data: subadmin } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .eq('rol', 'subadmin')
      .maybeSingle()

    if (!subadmin) {
      return NextResponse.json({ error: 'Subadmin no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const camionIds: string[] = Array.isArray(body?.camion_ids)
      ? body.camion_ids.map((camionId: unknown) => String(camionId)).filter(Boolean)
      : []

    const unicos = Array.from(new Set(camionIds))

    if (unicos.length > 0) {
      const { data: camionesValidos } = await supabase
        .from('camiones')
        .select('id')
        .eq('empresa_id', session.empresa_id)
        .in('id', unicos)

      if ((camionesValidos || []).length !== unicos.length) {
        return NextResponse.json({ error: 'Camión inválido' }, { status: 400 })
      }
    }

    const { error: errDelete } = await supabase
      .from('subadmin_camiones')
      .delete()
      .eq('empresa_id', session.empresa_id)
      .eq('subadmin_id', id)

    if (errDelete) {
      return NextResponse.json({ error: errDelete.message }, { status: 500 })
    }

    if (unicos.length > 0) {
      const { error: errInsert } = await supabase.from('subadmin_camiones').insert(
        unicos.map((camionId) => ({
          empresa_id: session.empresa_id,
          subadmin_id: id,
          camion_id: camionId,
        }))
      )

      if (errInsert) {
        return NextResponse.json({ error: errInsert.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, camion_ids: unicos })
  } catch (error) {
    return errorResponse(error)
  }
}
