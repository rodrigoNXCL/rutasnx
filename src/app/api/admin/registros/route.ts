import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireAdminOrSubadmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getCamionesSubadmin,
  getChoferesSubadmin,
  getServiciosSubadmin,
} from '@/lib/subadmin'

export async function GET(request: Request) {
  try {
    const session = await requireAdminOrSubadmin()
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const choferId = searchParams.get('chofer_id')
    const fecha = searchParams.get('fecha')

    const esSubadmin = session.rol === 'subadmin'
    const camionesSubadmin = esSubadmin
      ? await getCamionesSubadmin(supabase, session)
      : null

    if (esSubadmin && (!camionesSubadmin || camionesSubadmin.length === 0)) {
      return NextResponse.json({
        choferes: [],
        camiones: [],
        servicios: [],
        viajes: [],
      })
    }

    const choferesSubadmin = esSubadmin
      ? await getChoferesSubadmin(supabase, session)
      : null
    const serviciosSubadmin = esSubadmin
      ? await getServiciosSubadmin(supabase, session)
      : null

    let choferesQuery = supabase
      .from('choferes')
      .select('id, nombre')
      .eq('empresa_id', session.empresa_id)
      .order('nombre')

    if (choferesSubadmin) {
      choferesQuery = choferesQuery.in('id', choferesSubadmin)
    }

    let camionesQuery = supabase
      .from('camiones')
      .select('id, patente, marca, modelo')
      .eq('empresa_id', session.empresa_id)
      .order('patente')

    if (camionesSubadmin) {
      camionesQuery = camionesQuery.in('id', camionesSubadmin)
    }

    let serviciosQuery = supabase
      .from('servicios')
      .select(`
        id,
        nombre,
        cliente_id,
        tipo_servicio_id,
        clientes (id, nombre),
        tipos_servicio (id, codigo, nombre, flujo)
      `)
      .eq('empresa_id', session.empresa_id)
      .order('nombre')

    if (serviciosSubadmin) {
      serviciosQuery = serviciosQuery.in('id', serviciosSubadmin)
    }

    const [choferesRes, camionesRes, serviciosRes] = await Promise.all([
      choferesQuery,
      camionesQuery,
      serviciosQuery,
    ])

    if (choferesRes.error || camionesRes.error || serviciosRes.error) {
      return NextResponse.json(
        {
          error:
            choferesRes.error?.message ||
            camionesRes.error?.message ||
            serviciosRes.error?.message ||
            'Error cargando catálogos',
        },
        { status: 500 }
      )
    }

    if (!choferId) {
      return NextResponse.json({
        choferes: choferesRes.data || [],
        camiones: camionesRes.data || [],
        servicios: serviciosRes.data || [],
        viajes: [],
      })
    }

    const choferAutorizado = (choferesRes.data || []).some(
      (chofer) => chofer.id === choferId
    )

    if (!choferAutorizado) {
      return NextResponse.json({ error: 'Chófer no autorizado' }, { status: 403 })
    }

    let viajesQuery = supabase
      .from('viajes')
      .select(`
        id,
        fecha,
        km_inicio,
        km_termino,
        estado,
        iniciado_at,
        cerrado_at,
        cliente_id,
        tipo_servicio_id,
        observaciones,
        foto_km_inicio,
        foto_km_termino,
        camiones (id, patente, marca),
        servicios (id, nombre, clientes (nombre)),
        tipos_servicio (id, codigo, nombre, flujo),
        gastos (id, tipo, monto, descripcion, foto_url),
        viaje_puntos (id, anulado)
      `)
      .eq('empresa_id', session.empresa_id)
      .eq('chofer_id', choferId)

    if (fecha) {
      viajesQuery = viajesQuery.eq('fecha', fecha)
    }

    if (camionesSubadmin) {
      viajesQuery = viajesQuery.in('camion_id', camionesSubadmin)
    }

    const { data: viajes, error: errorViajes } = await viajesQuery.order(
      'iniciado_at',
      { ascending: false }
    )

    if (errorViajes) {
      return NextResponse.json({ error: errorViajes.message }, { status: 500 })
    }

    const normalizados = (viajes || []).map((viaje) => ({
      ...viaje,
      gastos: viaje.gastos || [],
      puntos_count: (viaje.viaje_puntos || []).filter((punto) => !punto.anulado)
        .length,
      viaje_puntos: undefined,
    }))

    return NextResponse.json({
      choferes: choferesRes.data || [],
      camiones: camionesRes.data || [],
      servicios: serviciosRes.data || [],
      viajes: normalizados,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
