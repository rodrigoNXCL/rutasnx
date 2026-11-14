import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
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

    const body = await request.json()
    const email = String(body?.email || '').trim()
    const nombre = String(body?.nombre || '').trim()
    const password = String(body?.password || '')

    if (!email) {
      return NextResponse.json({ error: 'email es requerido' }, { status: 400 })
    }

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, usuario_id')
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const { data: existente } = await supabase
      .from('usuarios')
      .select('id, empresa_id, rol, activo')
      .eq('email', email)
      .maybeSingle()

    if (existente) {
      if (existente.empresa_id !== session.empresa_id) {
        return NextResponse.json(
          { error: 'El email pertenece a otra empresa' },
          { status: 400 }
        )
      }

      if (existente.rol !== 'cliente') {
        return NextResponse.json(
          { error: 'El email corresponde a un usuario que no es de portal cliente' },
          { status: 400 }
        )
      }

      const { data: vinculo } = await supabase
        .from('cliente_usuarios')
        .select('id')
        .eq('cliente_id', id)
        .eq('usuario_id', existente.id)
        .maybeSingle()

      if (vinculo) {
        return NextResponse.json(
          { error: 'El usuario ya tiene acceso a este cliente' },
          { status: 400 }
        )
      }

      const { error: errorLink } = await supabase
        .from('cliente_usuarios')
        .insert({ cliente_id: id, usuario_id: existente.id })

      if (errorLink) {
        return NextResponse.json({ error: errorLink.message }, { status: 500 })
      }

      if (!existente.activo) {
        await supabase
          .from('usuarios')
          .update({ activo: true })
          .eq('id', existente.id)
      }

      if (!cliente.usuario_id) {
        await supabase
          .from('clientes')
          .update({ usuario_id: existente.id })
          .eq('id', id)
      }

      return NextResponse.json({
        usuario: { id: existente.id, email, nombre: nombre || null },
        cliente_id: id,
        vinculado: true,
      })
    }

    if (!nombre || !password) {
      return NextResponse.json(
        { error: 'nombre y password son requeridos para un usuario nuevo' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'password debe tener al menos 6 caracteres' },
        { status: 400 }
      )
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

    if (!cliente.usuario_id) {
      await supabase
        .from('clientes')
        .update({ usuario_id: usuario.id })
        .eq('id', id)
    }

    return NextResponse.json({ usuario, cliente_id: id })
  } catch (error) {
    return errorResponse(error)
  }
}
