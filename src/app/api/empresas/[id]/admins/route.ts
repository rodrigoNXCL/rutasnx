import { NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperadmin()
    const supabase = createAdminClient()
    const { id: empresa_id } = await params

    const { data: admins, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo, ultimo_login, created_at')
      .eq('empresa_id', empresa_id)
      .eq('rol', 'admin')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(admins)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
