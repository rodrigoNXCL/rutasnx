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

    if (cliente.usuario_id === usuarioId) {
      return NextResponse.json(
        { error: 'No puedes quitar el usuario principal del cliente' },
        { status: 400 }
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
