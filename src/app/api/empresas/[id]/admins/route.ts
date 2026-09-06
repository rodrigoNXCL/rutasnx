import { NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth'

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperadmin()
    const supabase = createAdminClient()
    const { id: empresa_id } = await params

    const { nombre, email, password, activo } = await request.json()

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const { data: user, error } = await supabase
      .from('usuarios')
      .insert({
        nombre,
        email,
        password_hash: hashedPassword,
        rol: 'admin',
        empresa_id,
        activo: activo !== false,
      })
      .select('id, nombre, email, rol, activo, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
