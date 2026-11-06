import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeText } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin'])
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const clienteId = searchParams.get('cliente_id')
    const q = (searchParams.get('q') || '').trim()
    const limitParam = Number(searchParams.get('limit') || 10)
    const limit = Math.min(Math.max(limitParam, 1), 25)

    if (!clienteId) {
      return NextResponse.json({ error: 'cliente_id es requerido' }, { status: 400 })
    }

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', clienteId)
      .eq('empresa_id', session.empresa_id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    if (session.rol === 'chofer') {
      const { data: chofer } = await supabase
        .from('choferes')
        .select('id')
        .eq('usuario_id', session.id)
        .single()

      if (!chofer) {
        return NextResponse.json({ error: 'Chófer no encontrado' }, { status: 404 })
      }

      const { data: asignaciones } = await supabase
        .from('asignaciones')
        .select('servicio_id')
        .eq('chofer_id', chofer.id)
        .eq('activo', true)

      const servicioIds = (asignaciones || []).map(a => a.servicio_id)
      let permitido = false

      if (servicioIds.length > 0) {
        const { data: servicios } = await supabase
          .from('servicios')
          .select('id')
          .in('id', servicioIds)
          .eq('cliente_id', clienteId)
          .limit(1)

        permitido = Boolean(servicios?.length)
      }

      if (!permitido) {
        const { count } = await supabase
          .from('viajes')
          .select('id', { count: 'exact', head: true })
          .eq('chofer_id', chofer.id)
          .eq('cliente_id', clienteId)
          .eq('empresa_id', session.empresa_id)

        permitido = Boolean(count)
      }

      if (!permitido) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    let query = supabase
      .from('viaje_puntos')
      .select('nombre_punto, nombre_punto_normalizado, captured_at')
      .eq('empresa_id', session.empresa_id)
      .eq('cliente_id', clienteId)
      .eq('anulado', false)
      .order('captured_at', { ascending: false })
      .limit(100)

    if (q) {
      query = query.ilike('nombre_punto_normalizado', `%${normalizeText(q)}%`)
    }

    const { data: puntos, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const vistos = new Set<string>()
    const sugerencias: string[] = []

    for (const punto of puntos || []) {
      if (vistos.has(punto.nombre_punto_normalizado)) continue
      vistos.add(punto.nombre_punto_normalizado)
      sugerencias.push(punto.nombre_punto)
      if (sugerencias.length >= limit) break
    }

    return NextResponse.json({ sugerencias })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
