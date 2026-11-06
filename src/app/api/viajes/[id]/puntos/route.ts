import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getViajeAcceso } from '@/lib/viaje-access'
import { normalizeText } from '@/lib/utils'
import type { TipoPunto } from '@/types/database'

const TIPOS_PUNTO: TipoPunto[] = ['retiro', 'entrega']

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin'])
    const supabase = createAdminClient()
    const { id } = await params

    const acceso = await getViajeAcceso(session, id)

    if ('error' in acceso) {
      return NextResponse.json({ error: acceso.error }, { status: acceso.status })
    }

    const incluirAnulados =
      session.rol !== 'chofer' &&
      new URL(request.url).searchParams.get('incluir_anulados') === 'true'

    let query = supabase
      .from('viaje_puntos')
      .select('*')
      .eq('viaje_id', id)
      .order('orden', { ascending: true })

    if (!incluirAnulados) {
      query = query.eq('anulado', false)
    }

    const { data: puntos, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ puntos: puntos || [] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin'])
    const supabase = createAdminClient()
    const { id } = await params

    const acceso = await getViajeAcceso(session, id)

    if ('error' in acceso) {
      return NextResponse.json({ error: acceso.error }, { status: acceso.status })
    }

    if (acceso.flujo !== 'puntos') {
      return NextResponse.json(
        { error: 'Este tipo de servicio no usa puntos' },
        { status: 400 }
      )
    }

    if (acceso.viaje.estado !== 'en_curso') {
      return NextResponse.json(
        { error: 'La ruta ya fue cerrada' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      id: puntoId,
      orden: ordenBody,
      tipo,
      nombre_punto,
      km_llegada,
      foto_guia_url,
      captured_at,
    } = body

    const nombre = String(nombre_punto || '').trim()
    const foto = String(foto_guia_url || '').trim()
    const km = Number(km_llegada)

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre del punto es obligatorio' }, { status: 400 })
    }

    if (!foto) {
      return NextResponse.json({ error: 'La foto de la guía es obligatoria' }, { status: 400 })
    }

    if (!TIPOS_PUNTO.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de punto inválido' }, { status: 400 })
    }

    if (!Number.isInteger(km) || km < 0) {
      return NextResponse.json({ error: 'Odómetro de llegada inválido' }, { status: 400 })
    }

    if (km < acceso.viaje.km_inicio) {
      return NextResponse.json(
        { error: `El odómetro no puede ser menor al inicio de la ruta (${acceso.viaje.km_inicio} km)` },
        { status: 400 }
      )
    }

    const { data: ultimoPunto } = await supabase
      .from('viaje_puntos')
      .select('orden, km_llegada')
      .eq('viaje_id', id)
      .eq('anulado', false)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (ultimoPunto && km < ultimoPunto.km_llegada) {
      return NextResponse.json(
        { error: `El odómetro no puede ser menor al punto anterior (${ultimoPunto.km_llegada} km)` },
        { status: 400 }
      )
    }

    const orden = Number.isInteger(ordenBody)
      ? ordenBody
      : (ultimoPunto?.orden ?? 0) + 1

    if (!Number.isInteger(orden) || orden < 1) {
      return NextResponse.json({ error: 'Orden de punto inválido' }, { status: 400 })
    }

    const { data: punto, error } = await supabase
      .from('viaje_puntos')
      .insert({
        id: puntoId || crypto.randomUUID(),
        empresa_id: acceso.viaje.empresa_id,
        viaje_id: id,
        cliente_id: acceso.viaje.cliente_id,
        orden,
        tipo,
        nombre_punto: nombre,
        nombre_punto_normalizado: normalizeText(nombre),
        km_llegada: km,
        foto_guia_url: foto,
        captured_at: captured_at || new Date().toISOString(),
        created_by: session.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un punto con ese orden en la ruta' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(punto, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
