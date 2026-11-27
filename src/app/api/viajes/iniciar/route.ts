import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getCamionesSubadmin,
  getChoferesSubadmin,
  getServiciosSubadmin,
} from '@/lib/subadmin'

export async function POST(request: Request) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin', 'subadmin'])
    const supabase = createAdminClient()

    const body = await request.json()
    const {
      id: viajeId,
      chofer_id,
      camion_id,
      servicio_id,
      fecha,
      km_inicio,
      foto_km_inicio,
      iniciado_at,
    } = body

    if (!camion_id || !fecha || km_inicio === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const kmInicio = Number(km_inicio)

    if (!Number.isInteger(kmInicio) || kmInicio < 0) {
      return NextResponse.json({ error: 'Odómetro inicial inválido' }, { status: 400 })
    }

    let choferId: string

    if (session.rol === 'chofer') {
      const { data: chofer } = await supabase
        .from('choferes')
        .select('id')
        .eq('usuario_id', session.id)
        .single()

      if (!chofer) {
        return NextResponse.json({ error: 'Chófer no encontrado' }, { status: 404 })
      }

      choferId = chofer.id
    } else {
      if (!chofer_id) {
        return NextResponse.json({ error: 'Selecciona un chófer' }, { status: 400 })
      }

      const { data: chofer } = await supabase
        .from('choferes')
        .select('id')
        .eq('id', chofer_id)
        .eq('empresa_id', session.empresa_id)
        .single()

      if (!chofer) {
        return NextResponse.json({ error: 'Chófer no encontrado' }, { status: 404 })
      }

      choferId = chofer.id
    }

    const { data: camion } = await supabase
      .from('camiones')
      .select('id')
      .eq('id', camion_id)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!camion) {
      return NextResponse.json({ error: 'Camión no encontrado' }, { status: 404 })
    }

    if (session.rol === 'subadmin') {
      const camiones = await getCamionesSubadmin(supabase, session)

      if (!camiones || !camiones.includes(camion_id)) {
        return NextResponse.json({ error: 'Camión no autorizado' }, { status: 403 })
      }

      const choferes = await getChoferesSubadmin(supabase, session)

      if (!choferes || !choferes.includes(choferId)) {
        return NextResponse.json({ error: 'Chófer no autorizado' }, { status: 403 })
      }

      if (servicio_id) {
        const servicios = await getServiciosSubadmin(supabase, session)

        if (!servicios || !servicios.includes(servicio_id)) {
          return NextResponse.json({ error: 'Servicio no autorizado' }, { status: 403 })
        }
      }
    }

    if (session.rol === 'chofer') {
      let asignacionQuery = supabase
        .from('asignaciones')
        .select('id')
        .eq('chofer_id', choferId)
        .eq('camion_id', camion_id)
        .eq('activo', true)

      if (servicio_id) {
        asignacionQuery = asignacionQuery.eq('servicio_id', servicio_id)
      }

      const { data: asignacionActiva } = await asignacionQuery.maybeSingle()

      if (!asignacionActiva) {
        return NextResponse.json(
          { error: 'El camión/servicio no está asignado al chófer' },
          { status: 400 }
        )
      }
    }

    let servicio: {
      id: string
      cliente_id: string
      tipo_servicio_id: string
    } | null = null

    if (servicio_id) {
      const { data } = await supabase
        .from('servicios')
        .select('id, cliente_id, tipo_servicio_id')
        .eq('id', servicio_id)
        .eq('empresa_id', session.empresa_id)
        .single()

      if (!data) {
        return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
      }

      servicio = data
    }

    const { data: viaje, error: errorViaje } = await supabase
      .from('viajes')
      .insert({
        id: viajeId || undefined,
        empresa_id: session.empresa_id,
        chofer_id: choferId,
        camion_id,
        servicio_id: servicio?.id || null,
        tipo_servicio_id: servicio?.tipo_servicio_id || null,
        cliente_id: servicio?.cliente_id || null,
        fecha,
        km_inicio: kmInicio,
        foto_km_inicio: foto_km_inicio || null,
        iniciado_at: iniciado_at || new Date().toISOString(),
        estado: 'en_curso',
      })
      .select()
      .single()

    if (errorViaje) {
      if (errorViaje.code === '23505') {
        // Reintento de inicio (doble envío o respuesta perdida): si la ruta
        // abierta es la misma del chofer/camión/servicio, se devuelve en vez
        // de dejar al usuario bloqueado.
        let existenteQuery = supabase
          .from('viajes')
          .select('*')
          .eq('chofer_id', choferId)
          .eq('camion_id', camion_id)
          .eq('estado', 'en_curso')

        if (servicio_id) {
          existenteQuery = existenteQuery.eq('servicio_id', servicio_id)
        }

        const { data: existente } = await existenteQuery.maybeSingle()

        if (existente) {
          return NextResponse.json(existente)
        }

        return NextResponse.json(
          { error: 'El chófer ya tiene una ruta abierta o el camión está en uso' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: errorViaje.message }, { status: 500 })
    }

    return NextResponse.json(viaje)
  } catch (error) {
    return errorResponse(error)
  }
}
