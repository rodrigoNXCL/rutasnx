import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClienteIdsForUsuario } from '@/lib/cliente'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.rol !== 'cliente') {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const clienteIds = await getClienteIdsForUsuario(supabase, session)

    if (clienteIds.length === 0) {
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
      .in('cliente_id', clienteIds)
      .eq('activo', true)
      .order('fecha', { referencedTable: 'viajes', ascending: false })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const datos = (servicios || []).map((servicio) => ({
      ...servicio,
      viajes: (servicio.viajes || []).map((viaje) => ({
        ...viaje,
        gastos: (viaje.gastos || []).filter((gasto) => gasto.tipo === 'peaje'),
      })),
    }))

    return Response.json(datos)
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}