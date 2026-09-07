import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.rol !== 'cliente') {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('usuario_id', session.id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!cliente) {
      return Response.json([])
    }

    const { data: servicios, error } = await supabase
      .from('servicios')
      .select(`
        id,
        nombre,
        descripcion,
        origen,
        destino,
        activo,
        created_at,
        viajes (
          id,
          fecha,
          km_inicio,
          km_termino,
          ruta,
          observaciones,
          foto_km_inicio,
          foto_km_termino,
          estado,
          created_at,
          camiones (patente, marca),
          choferes (usuarios (nombre)),
          gastos (id, tipo, monto, descripcion, foto_url)
        )
      `)
      .eq('cliente_id', cliente.id)
      .eq('activo', true)
      .order('fecha', { referencedTable: 'viajes', ascending: false })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(servicios || [])
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}