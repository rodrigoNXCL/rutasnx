import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Rol } from '@/types/database'

export async function GET(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const soloActivos = searchParams.get('activos') === 'true'
    const rol = searchParams.get('rol')

    let query = supabase
      .from('usuarios')
      .select('id, empresa_id, email, nombre, rol, telefono, activo, ultimo_login, created_at')
      .eq('empresa_id', session.empresa_id)
      .order('activo', { ascending: false })
      .order('nombre')

    if (soloActivos) {
      query = query.eq('activo', true)
    }
    if (rol && (['superadmin', 'admin', 'chofer', 'cliente'] as Rol[]).includes(rol as Rol)) {
      query = query.eq('rol', rol as Rol)
    }

    const { data: usuarios, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(usuarios || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
