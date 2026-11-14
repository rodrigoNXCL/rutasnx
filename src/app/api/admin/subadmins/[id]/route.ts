import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { hashPassword, requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
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
    const cambios: { activo?: boolean; password_hash?: string } = {}

    if (typeof body?.activo === 'boolean') {
      cambios.activo = body.activo
    }

    const password = String(body?.password || '')
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }
      cambios.password_hash = await hashPassword(password)
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    }

    const { error } = await supabase
      .from('usuarios')
      .update(cambios)
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .eq('rol', 'subadmin')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
