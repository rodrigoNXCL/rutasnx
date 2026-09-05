import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: choferes, error } = await supabase
      .from('choferes')
      .select('*, usuarios(email)')
      .eq('empresa_id', session.empresa_id)
      .order('nombre')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(choferes)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { nombre, rut, licencia, telefono, crear_usuario, password } = await request.json()

    if (!nombre) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
    }

    if (!rut) {
      return NextResponse.json({ error: 'RUT es requerido para crear usuario' }, { status: 400 })
    }

    let usuario_id = null
    let userEmail = null

    if (crear_usuario) {
      if (!password) {
        return NextResponse.json({ error: 'password es requerida para crear usuario' }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'password debe tener al menos 6 caracteres' }, { status: 400 })
      }

      const { data: existente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', rut)
        .single()

      if (existente) {
        return NextResponse.json({ error: 'El RUT ya está registrado como usuario' }, { status: 400 })
      }

      const passwordHash = await hashPassword(password)

      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .insert({
          empresa_id: session.empresa_id,
          email: rut,
          password_hash: passwordHash,
          nombre,
          rol: 'chofer',
          activo: true,
        })
        .select()
        .single()

      if (errorUsuario) {
        return NextResponse.json({ error: errorUsuario.message }, { status: 500 })
      }

      usuario_id = usuario.id
      userEmail = rut
    }

    const { data: chofer, error: errorChofer } = await supabase
      .from('choferes')
      .insert({
        empresa_id: session.empresa_id,
        usuario_id,
        nombre,
        rut,
        licencia,
        telefono,
        activo: true,
      })
      .select()
      .single()

    if (errorChofer) {
      return NextResponse.json({ error: errorChofer.message }, { status: 500 })
    }

    return NextResponse.json({
      ...chofer,
      usuarios: userEmail ? { email: userEmail } : null,
      usuario_creado: crear_usuario
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
