import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireAdmin, requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FlujoServicio } from '@/types/database'

const FLUJOS: FlujoServicio[] = ['simple', 'puntos']

function normalizarCodigo(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export async function GET() {
  try {
    const session = await requireRole(['admin', 'superadmin', 'subadmin'])
    const supabase = createAdminClient()

    const [tiposRes, serviciosRes] = await Promise.all([
      supabase
        .from('tipos_servicio')
        .select('*')
        .eq('empresa_id', session.empresa_id)
        .order('nombre'),
      supabase
        .from('servicios')
        .select('tipo_servicio_id')
        .eq('empresa_id', session.empresa_id),
    ])

    if (tiposRes.error) {
      return NextResponse.json({ error: tiposRes.error.message }, { status: 500 })
    }

    if (serviciosRes.error) {
      return NextResponse.json({ error: serviciosRes.error.message }, { status: 500 })
    }

    const counts = new Map<string, number>()
    for (const servicio of serviciosRes.data || []) {
      if (servicio.tipo_servicio_id) {
        counts.set(
          servicio.tipo_servicio_id,
          (counts.get(servicio.tipo_servicio_id) || 0) + 1
        )
      }
    }

    return NextResponse.json(
      (tiposRes.data || []).map((tipo) => ({
        ...tipo,
        servicios_count: counts.get(tipo.id) || 0,
      }))
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
    const body = await request.json()

    const codigo = normalizarCodigo(body.codigo)
    const nombre = String(body.nombre || '').trim()
    const flujo = body.flujo as FlujoServicio

    if (!codigo || !nombre || !FLUJOS.includes(flujo)) {
      return NextResponse.json(
        { error: 'codigo, nombre y flujo son requeridos' },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9_-]+$/.test(codigo)) {
      return NextResponse.json(
        { error: 'El código solo permite letras minúsculas, números, guiones y guiones bajos' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('tipos_servicio')
      .insert({
        empresa_id: session.empresa_id,
        codigo,
        nombre,
        flujo,
        activo: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un tipo de servicio con ese código' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ...data, servicios_count: 0 })
  } catch (error) {
    return errorResponse(error)
  }
}
