import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; usuarioId: string }> }
) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
    const { id, usuarioId } = await params

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, usuario_id')
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const { data: vinculo } = await supabase
      .from('cliente_usuarios')
      .select('id')
      .eq('cliente_id', id)
      .eq('usuario_id', usuarioId)
      .maybeSingle()

    if (!vinculo) {
      return NextResponse.json(
        { error: 'El usuario no tiene acceso a este cliente' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('cliente_usuarios')
      .delete()
      .eq('cliente_id', id)
      .eq('usuario_id', usuarioId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (cliente.usuario_id === usuarioId) {
      const { data: siguiente } = await supabase
        .from('cliente_usuarios')
        .select('usuario_id')
        .eq('cliente_id', id)
        .limit(1)
        .maybeSingle()

      const { error: errorPrincipal } = await supabase
        .from('clientes')
        .update({ usuario_id: siguiente?.usuario_id ?? null })
        .eq('id', id)

      if (errorPrincipal) {
        return NextResponse.json({ error: errorPrincipal.message }, { status: 500 })
      }
    }

    const { count } = await supabase
      .from('cliente_usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)

    if (!count) {
      await supabase
        .from('usuarios')
        .update({ activo: false })
        .eq('id', usuarioId)
        .eq('empresa_id', session.empresa_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
