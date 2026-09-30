import { NextResponse } from 'next/server'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params

    const { email, nombre, password } = await request.json()

    if (!email || !nombre || !password) {
      return NextResponse.json({ error: 'email, nombre y password son requeridos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'password debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (existente) {
      return NextResponse.json({ error: 'El email ya está registrado como usuario' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .insert({
        empresa_id: session.empresa_id,
        email,
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

    const { error: errorLink } = await supabase
      .from('cliente_usuarios')
      .insert({ cliente_id: id, usuario_id: usuario.id })

    if (errorLink) {
      return NextResponse.json({ error: errorLink.message }, { status: 500 })
    }

    return NextResponse.json({ usuario, cliente_id: id })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
