import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', session.empresa_id)
      .order('nombre')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { nombre, rut, telefono, email, crear_usuario, password } = await request.json()

    if (!nombre) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
    }

    let usuario_id = null
    let userEmail = null

    if (crear_usuario) {
      if (!rut) {
        return NextResponse.json({ error: 'RUT es requerido para crear usuario' }, { status: 400 })
      }

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
          rol: 'cliente',
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

    const { data: cliente, error: errorCliente } = await supabase
      .from('clientes')
      .insert({
        empresa_id: session.empresa_id,
        usuario_id: usuario_id,
        nombre,
        rut,
        telefono,
        email,
        activo: true,
      })
      .select()
      .single()

    if (errorCliente) {
      return NextResponse.json({ error: errorCliente.message }, { status: 500 })
    }

    return NextResponse.json({
      ...cliente,
      usuarios: userEmail ? { email: userEmail } : null,
      usuario_creado: crear_usuario
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
