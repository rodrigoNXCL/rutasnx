import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireSuperadmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; adminId: string }> }
) {
  try {
    await requireSuperadmin()
    const supabase = createAdminClient()
    const { adminId } = await params

    const body = await request.json()
    const { nombre, email, password, activo } = body

    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 8 caracteres' },
          { status: 400 }
        )
      }
      const passwordHash = await hashPassword(password)
      const { data, error } = await supabase
        .from('usuarios')
        .update({ nombre, email, password_hash: passwordHash, activo })
        .eq('id', adminId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ id: data.id, nombre: data.nombre, email: data.email, rol: data.rol, activo: data.activo })
    } else {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ nombre, email, activo })
        .eq('id', adminId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ id: data.id, nombre: data.nombre, email: data.email, rol: data.rol, activo: data.activo })
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; adminId: string }> }
) {
  try {
    await requireSuperadmin()
    const supabase = createAdminClient()
    const { adminId } = await params

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', adminId)
      .eq('rol', 'admin')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
