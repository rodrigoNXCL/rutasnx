import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClienteIdsForUsuario } from '@/lib/cliente'
import { shortenStorageUrl } from '@/lib/short-url'
import { archivosDesdePunto } from '@/lib/archivos-punto'

export async function GET(request: Request) {
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
          tipos_servicio (flujo),
          viaje_puntos (id, orden, tipo, nombre_punto, km_llegada, foto_guia_url, archivos, captured_at, anulado)
        )
      `)
      .in('cliente_id', clienteIds)
      .eq('activo', true)
      .order('fecha', { referencedTable: 'viajes', ascending: false })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const baseUrl = new URL(request.url).origin

    const datos = (servicios || []).map((servicio) => ({
      ...servicio,
      viajes: (servicio.viajes || []).map((viaje) => ({
        ...viaje,
        viaje_puntos: (viaje.viaje_puntos || [])
          .filter((punto) => !punto.anulado)
          .sort((a, b) => a.orden - b.orden)
          .map((punto) => ({
            ...punto,
            foto_guia_url: shortenStorageUrl(punto.foto_guia_url, baseUrl),
            archivos: archivosDesdePunto(punto).map((archivo) => ({
              ...archivo,
              url: shortenStorageUrl(archivo.url, baseUrl) || archivo.url,
            })),
          })),
      })),
    }))

    return Response.json(datos)
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}