import { NextResponse } from 'next/server'
import { requireAdminOrSubadmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCamionesSubadmin } from '@/lib/subadmin'

const VIAJE_SELECT = `
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
  servicios (nombre),
  choferes (usuarios (nombre)),
  gastos (id, tipo, monto, descripcion, foto_url)
`

export async function GET() {
  try {
    const session = await requireAdminOrSubadmin()
    const supabase = createAdminClient()
    const empresa_id = session.empresa_id

    const camiones = await getCamionesSubadmin(supabase, session)

    if (camiones !== null && camiones.length === 0) {
      return NextResponse.json({
        stats: { camiones: 0, choferes: 0, clientes: 0, servicios: 0, viajesEnCurso: 0 },
        viajesEnCurso: [],
        viajesTerminados: [],
      })
    }

    let camionesQuery = supabase
      .from('camiones')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id)

    let viajesEnCursoQuery = supabase
      .from('viajes')
      .select(VIAJE_SELECT)
      .eq('empresa_id', empresa_id)
      .eq('estado', 'en_curso')
      .order('fecha', { ascending: false })
      .limit(20)

    let viajesTerminadosQuery = supabase
      .from('viajes')
      .select(VIAJE_SELECT)
      .eq('empresa_id', empresa_id)
      .eq('estado', 'terminado')
      .order('fecha', { ascending: false })
      .limit(20)

    let viajesEnCursoCountQuery = supabase
      .from('viajes')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id)
      .eq('estado', 'en_curso')

    let choferesCount = 0
    let clientesCount = 0
    let serviciosCount = 0
    let camionesCount = 0

    if (camiones !== null) {
      camionesQuery = camionesQuery.in('id', camiones)
      viajesEnCursoQuery = viajesEnCursoQuery.in('camion_id', camiones)
      viajesTerminadosQuery = viajesTerminadosQuery.in('camion_id', camiones)
      viajesEnCursoCountQuery = viajesEnCursoCountQuery.in('camion_id', camiones)

      const { data: viajesScope } = await supabase
        .from('viajes')
        .select('chofer_id, cliente_id, servicio_id')
        .eq('empresa_id', empresa_id)
        .in('camion_id', camiones)

      const choferesSet = new Set<string>()
      const clientesSet = new Set<string>()
      const serviciosSet = new Set<string>()

      for (const viaje of viajesScope || []) {
        if (viaje.chofer_id) choferesSet.add(viaje.chofer_id)
        if (viaje.cliente_id) clientesSet.add(viaje.cliente_id)
        if (viaje.servicio_id) serviciosSet.add(viaje.servicio_id)
      }

      choferesCount = choferesSet.size
      clientesCount = clientesSet.size
      serviciosCount = serviciosSet.size
    } else {
      const [
        { count: camionesTotal },
        { count: choferesTotal },
        { count: clientesTotal },
        { count: serviciosTotal },
      ] = await Promise.all([
        supabase.from('camiones').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa_id),
        supabase.from('choferes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa_id),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa_id),
        supabase.from('servicios').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa_id),
      ])

      camionesCount = camionesTotal || 0
      choferesCount = choferesTotal || 0
      clientesCount = clientesTotal || 0
      serviciosCount = serviciosTotal || 0
    }

    const [
      { count: camionesScopeCount },
      { count: viajesEnCursoCount },
      { data: viajesEnCurso },
      { data: viajesTerminados },
    ] = await Promise.all([
      camionesQuery,
      viajesEnCursoCountQuery,
      viajesEnCursoQuery,
      viajesTerminadosQuery,
    ])

    if (camiones !== null) camionesCount = camionesScopeCount || camiones.length

    return NextResponse.json({
      stats: {
        camiones: camionesCount,
        choferes: choferesCount,
        clientes: clientesCount,
        servicios: serviciosCount,
        viajesEnCurso: viajesEnCursoCount || 0,
      },
      viajesEnCurso: viajesEnCurso || [],
      viajesTerminados: viajesTerminados || [],
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
