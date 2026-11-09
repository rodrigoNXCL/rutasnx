import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getViajeAcceso } from '@/lib/viaje-access'
import { normalizeText } from '@/lib/utils'
import {
  MAX_ARCHIVOS_PUNTO,
  archivosDesdePunto,
  imagenPrincipal,
  validarArchivosPunto,
} from '@/lib/archivos-punto'
import type { TipoPunto } from '@/types/database'

const TIPOS_PUNTO: TipoPunto[] = ['retiro', 'entrega']

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; puntoId: string }> }
) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin'])
    const supabase = createAdminClient()
    const { id, puntoId } = await params

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

    const body = await request.json()
    const { tipo, nombre_punto, km_llegada, foto_guia_url, archivos: archivosBody, motivo } = body
    const motivoLimpio = String(motivo || '').trim()

    if (!motivoLimpio) {
      return NextResponse.json(
        { error: 'El motivo de la corrección es obligatorio' },
        { status: 400 }
      )
    }

    const { data: punto } = await supabase
      .from('viaje_puntos')
      .select('*')
      .eq('id', puntoId)
      .eq('viaje_id', id)
      .single()

    if (!punto) {
      return NextResponse.json({ error: 'Punto no encontrado' }, { status: 404 })
    }

    if (punto.anulado) {
      return NextResponse.json({ error: 'El punto está anulado' }, { status: 400 })
    }

    const nuevoTipo = tipo === undefined ? punto.tipo : tipo
    const nuevoNombre = nombre_punto === undefined
      ? punto.nombre_punto
      : String(nombre_punto).trim()

    if (Array.isArray(archivosBody) && archivosBody.length > MAX_ARCHIVOS_PUNTO) {
      return NextResponse.json(
        { error: `Puedes adjuntar máximo ${MAX_ARCHIVOS_PUNTO} archivos` },
        { status: 400 }
      )
    }

    const archivosAnteriores = archivosDesdePunto(punto)
    const archivosNuevos = archivosBody !== undefined
      ? archivosDesdePunto({ archivos: archivosBody, foto_guia_url })
      : foto_guia_url !== undefined
        ? archivosDesdePunto({ foto_guia_url })
        : archivosAnteriores
    const errorArchivos = validarArchivosPunto(archivosNuevos)
    const nuevaFoto = imagenPrincipal(archivosNuevos)
    const nuevoKm = km_llegada === undefined ? punto.km_llegada : Number(km_llegada)

    if (!TIPOS_PUNTO.includes(nuevoTipo)) {
      return NextResponse.json({ error: 'Tipo de punto inválido' }, { status: 400 })
    }

    if (!nuevoNombre) {
      return NextResponse.json({ error: 'El nombre del punto es obligatorio' }, { status: 400 })
    }

    if (errorArchivos) {
      return NextResponse.json({ error: errorArchivos }, { status: 400 })
    }

    if (!Number.isInteger(nuevoKm) || nuevoKm < 0) {
      return NextResponse.json({ error: 'Odómetro de llegada inválido' }, { status: 400 })
    }

    if (nuevoKm < acceso.viaje.km_inicio) {
      return NextResponse.json(
        { error: `El odómetro no puede ser menor al inicio de la ruta (${acceso.viaje.km_inicio} km)` },
        { status: 400 }
      )
    }

    const { data: anterior } = await supabase
      .from('viaje_puntos')
      .select('orden, km_llegada')
      .eq('viaje_id', id)
      .eq('anulado', false)
      .lt('orden', punto.orden)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: siguiente } = await supabase
      .from('viaje_puntos')
      .select('orden, km_llegada')
      .eq('viaje_id', id)
      .eq('anulado', false)
      .gt('orden', punto.orden)
      .order('orden', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (anterior && nuevoKm < anterior.km_llegada) {
      return NextResponse.json(
        { error: `El odómetro no puede ser menor al punto anterior (${anterior.km_llegada} km)` },
        { status: 400 }
      )
    }

    if (siguiente && nuevoKm > siguiente.km_llegada) {
      return NextResponse.json(
        { error: `El odómetro no puede ser mayor al punto siguiente (${siguiente.km_llegada} km)` },
        { status: 400 }
      )
    }

    if (acceso.viaje.km_termino !== null && nuevoKm > acceso.viaje.km_termino) {
      return NextResponse.json(
        { error: `El odómetro no puede ser mayor al cierre de la ruta (${acceso.viaje.km_termino} km)` },
        { status: 400 }
      )
    }

    const { data: actualizado, error: errorUpdate } = await supabase
      .from('viaje_puntos')
      .update({
        tipo: nuevoTipo,
        nombre_punto: nuevoNombre,
        nombre_punto_normalizado: normalizeText(nuevoNombre),
        km_llegada: nuevoKm,
        foto_guia_url: nuevaFoto || '',
        archivos: archivosNuevos,
        updated_at: new Date().toISOString(),
        updated_by: session.id,
      })
      .eq('id', puntoId)
      .eq('viaje_id', id)
      .select()
      .single()

    if (errorUpdate) {
      return NextResponse.json({ error: errorUpdate.message }, { status: 500 })
    }

    const { error: errorHistorial } = await supabase
      .from('viaje_punto_historial')
      .insert({
        punto_id: punto.id,
        viaje_id: id,
        empresa_id: acceso.viaje.empresa_id,
        accion: 'modificado',
        orden_anterior: punto.orden,
        orden_nuevo: actualizado.orden,
        tipo_anterior: punto.tipo,
        tipo_nuevo: actualizado.tipo,
        nombre_punto_anterior: punto.nombre_punto,
        nombre_punto_nuevo: actualizado.nombre_punto,
        nombre_punto_normalizado_anterior: punto.nombre_punto_normalizado,
        nombre_punto_normalizado_nuevo: actualizado.nombre_punto_normalizado,
        km_llegada_anterior: punto.km_llegada,
        km_llegada_nuevo: actualizado.km_llegada,
        foto_guia_url_anterior: punto.foto_guia_url,
        foto_guia_url_nuevo: actualizado.foto_guia_url,
        archivos_anterior: archivosAnteriores,
        archivos_nuevo: actualizado.archivos,
        motivo: motivoLimpio,
        changed_by: session.id,
      })

    if (errorHistorial) {
      console.error('Error historial punto:', errorHistorial)
      return NextResponse.json(
        { error: 'Punto actualizado, pero no se pudo registrar el historial' },
        { status: 500 }
      )
    }

    return NextResponse.json(actualizado)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; puntoId: string }> }
) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin'])
    const supabase = createAdminClient()
    const { id, puntoId } = await params

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

    let motivo = ''

    try {
      const body = await request.json()
      motivo = String(body?.motivo || '').trim()
    } catch {
      motivo = ''
    }

    if (!motivo) {
      return NextResponse.json(
        { error: 'El motivo de la anulación es obligatorio' },
        { status: 400 }
      )
    }

    const { data: punto } = await supabase
      .from('viaje_puntos')
      .select('*')
      .eq('id', puntoId)
      .eq('viaje_id', id)
      .single()

    if (!punto) {
      return NextResponse.json({ error: 'Punto no encontrado' }, { status: 404 })
    }

    if (punto.anulado) {
      return NextResponse.json({ error: 'El punto ya está anulado' }, { status: 400 })
    }

    const ahora = new Date().toISOString()

    const { error: errorUpdate } = await supabase
      .from('viaje_puntos')
      .update({
        anulado: true,
        anulado_at: ahora,
        anulado_by: session.id,
        updated_at: ahora,
        updated_by: session.id,
      })
      .eq('id', puntoId)
      .eq('viaje_id', id)

    if (errorUpdate) {
      return NextResponse.json({ error: errorUpdate.message }, { status: 500 })
    }

    const { error: errorHistorial } = await supabase
      .from('viaje_punto_historial')
      .insert({
        punto_id: punto.id,
        viaje_id: id,
        empresa_id: acceso.viaje.empresa_id,
        accion: 'anulado',
        orden_anterior: punto.orden,
        tipo_anterior: punto.tipo,
        nombre_punto_anterior: punto.nombre_punto,
        nombre_punto_normalizado_anterior: punto.nombre_punto_normalizado,
        km_llegada_anterior: punto.km_llegada,
        foto_guia_url_anterior: punto.foto_guia_url,
        archivos_anterior: archivosDesdePunto(punto),
        motivo,
        changed_by: session.id,
      })

    if (errorHistorial) {
      console.error('Error historial anulación:', errorHistorial)
      return NextResponse.json(
        { error: 'Punto anulado, pero no se pudo registrar el historial' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
