import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { shortenStorageUrl } from '@/lib/short-url'

interface Opcion {
  id: string
  nombre: string
}

interface CamionOpcion {
  id: string
  patente: string
  marca: string | null
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || (session.rol !== 'admin' && session.rol !== 'superadmin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (!session.empresa_id) {
      return NextResponse.json(
        { error: 'El usuario no tiene una empresa asociada' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const clienteId = searchParams.get('cliente_id')
    const servicioId = searchParams.get('servicio_id')
    const camionId = searchParams.get('camion_id')
    const choferId = searchParams.get('chofer_id')

    if (!desde || !hasta) {
      return NextResponse.json(
        { error: 'Parámetros desde y hasta requeridos' },
        { status: 400 }
      )
    }

    const [dAno, dMes, dDia] = desde.split('-').map(Number)
    const [hAno, hMes, hDia] = hasta.split('-').map(Number)

    const utcDesde = new Date(Date.UTC(dAno, dMes - 1, dDia, 3, 0, 0))
      .toISOString()
      .split('T')[0]
    const utcHasta = new Date(Date.UTC(hAno, hMes - 1, hDia + 1, 3, 0, 0))
      .toISOString()
      .split('T')[0]

    const supabase = createAdminClient()

    let viajesQuery = supabase
      .from('viajes')
      .select(`
        id,
        fecha,
        km_inicio,
        km_termino,
        estado,
        camion_id,
        chofer_id,
        cliente_id,
        servicio_id,
        camiones (id, patente, marca),
        choferes (id, nombre, rut),
        clientes (id, nombre),
        servicios (id, nombre),
        tipos_servicio!inner (id, codigo, nombre, flujo),
        viaje_puntos (id, orden, tipo, nombre_punto, km_llegada, foto_guia_url, captured_at, anulado)
      `)
      .eq('empresa_id', session.empresa_id)
      .eq('estado', 'terminado')
      .eq('tipos_servicio.flujo', 'puntos')
      .eq('viaje_puntos.anulado', false)
      .gte('fecha', utcDesde)
      .lte('fecha', utcHasta)
      .order('fecha', { ascending: true })
      .order('orden', { referencedTable: 'viaje_puntos', ascending: true })

    if (clienteId) viajesQuery = viajesQuery.eq('cliente_id', clienteId)
    if (servicioId) viajesQuery = viajesQuery.eq('servicio_id', servicioId)
    if (camionId) viajesQuery = viajesQuery.eq('camion_id', camionId)
    if (choferId) viajesQuery = viajesQuery.eq('chofer_id', choferId)

    const [{ data: viajes, error }, { data: opcionesViajes }] = await Promise.all([
      viajesQuery,
      supabase
        .from('viajes')
        .select(`
          camion_id,
          chofer_id,
          cliente_id,
          servicio_id,
          camiones (id, patente, marca),
          choferes (id, nombre),
          clientes (id, nombre),
          servicios (id, nombre),
          tipos_servicio!inner (flujo)
        `)
        .eq('empresa_id', session.empresa_id)
        .eq('estado', 'terminado')
        .eq('tipos_servicio.flujo', 'puntos')
        .gte('fecha', utcDesde)
        .lte('fecha', utcHasta),
    ])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const baseUrl = new URL(request.url).origin

    const rutas = (viajes || [])
      .filter((viaje) => viaje.tipos_servicio?.flujo === 'puntos')
      .map((viaje) => ({
        id: viaje.id,
        fecha: viaje.fecha,
        camion_id: viaje.camion_id,
        camion: viaje.camiones?.patente || '—',
        camion_marca: viaje.camiones?.marca || '',
        chofer_id: viaje.chofer_id,
        chofer: viaje.choferes?.nombre || '—',
        chofer_rut: viaje.choferes?.rut || '',
        cliente_id: viaje.cliente_id,
        cliente: viaje.clientes?.nombre || '—',
        servicio: viaje.servicios?.nombre || '—',
        km_inicio: viaje.km_inicio,
        km_termino: viaje.km_termino,
        total_km: viaje.km_termino != null ? viaje.km_termino - viaje.km_inicio : 0,
        puntos: (viaje.viaje_puntos || [])
          .filter((punto) => !punto.anulado)
          .sort((a, b) => a.orden - b.orden)
          .map((punto) => ({
            id: punto.id,
            orden: punto.orden,
            tipo: punto.tipo,
            nombre: punto.nombre_punto,
            km: punto.km_llegada,
            guia_url: shortenStorageUrl(punto.foto_guia_url, baseUrl),
            captured_at: punto.captured_at,
          })),
      }))
      .sort((a, b) => {
        const porPatente = a.camion.localeCompare(b.camion)
        if (porPatente !== 0) return porPatente
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
        return a.chofer.localeCompare(b.chofer)
      })

    const camionesMap = new Map<string, CamionOpcion>()
    const choferesMap = new Map<string, Opcion>()
    const clientesMap = new Map<string, Opcion>()
    const serviciosMap = new Map<string, Opcion>()

    for (const viaje of opcionesViajes || []) {
      if (viaje.tipos_servicio?.flujo !== 'puntos') continue

      if (viaje.camion_id && viaje.camiones && !camionesMap.has(viaje.camion_id)) {
        camionesMap.set(viaje.camion_id, {
          id: viaje.camion_id,
          patente: viaje.camiones.patente,
          marca: viaje.camiones.marca || null,
        })
      }

      if (viaje.chofer_id && viaje.choferes && !choferesMap.has(viaje.chofer_id)) {
        choferesMap.set(viaje.chofer_id, {
          id: viaje.chofer_id,
          nombre: viaje.choferes.nombre,
        })
      }

      if (viaje.cliente_id && viaje.clientes && !clientesMap.has(viaje.cliente_id)) {
        clientesMap.set(viaje.cliente_id, {
          id: viaje.cliente_id,
          nombre: viaje.clientes.nombre,
        })
      }

      if (viaje.servicio_id && viaje.servicios && !serviciosMap.has(viaje.servicio_id)) {
        serviciosMap.set(viaje.servicio_id, {
          id: viaje.servicio_id,
          nombre: viaje.servicios.nombre,
        })
      }
    }

    const resumen = {
      rutas: rutas.length,
      puntos: rutas.reduce((sum, ruta) => sum + ruta.puntos.length, 0),
      total_km: rutas.reduce((sum, ruta) => sum + ruta.total_km, 0),
    }

    return NextResponse.json({
      rutas,
      opciones: {
        camiones: Array.from(camionesMap.values()).sort((a, b) =>
          a.patente.localeCompare(b.patente)
        ),
        choferes: Array.from(choferesMap.values()).sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        ),
        clientes: Array.from(clientesMap.values()).sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        ),
        servicios: Array.from(serviciosMap.values()).sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        ),
      },
      resumen,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
