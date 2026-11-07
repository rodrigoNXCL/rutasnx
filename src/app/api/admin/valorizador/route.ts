import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { haySolapamiento, validarRango } from '@/lib/valorizador'

export async function GET() {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: valores, error } = await supabase
      .from('valor_km')
      .select('*')
      .eq('empresa_id', session.empresa_id)
      .order('fecha_desde', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(valores || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const body = await request.json()
    const valor = Number(body.valor)
    const fechaDesde = body.fecha_desde
    const fechaHasta = body.fecha_hasta

    const errorRango = validarRango(fechaDesde, fechaHasta)
    if (errorRango) {
      return NextResponse.json({ error: errorRango }, { status: 400 })
    }

    if (!Number.isFinite(valor) || valor < 0) {
      return NextResponse.json({ error: 'valor debe ser un número >= 0' }, { status: 400 })
    }

    if (await haySolapamiento(supabase, session.empresa_id, fechaDesde, fechaHasta)) {
      return NextResponse.json(
        { error: 'El rango de fechas se solapa con una valorización existente' },
        { status: 400 }
      )
    }

    const { data: valorKm, error } = await supabase
      .from('valor_km')
      .insert({
        empresa_id: session.empresa_id,
        valor,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        created_by: session.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('valor_km_historial').insert({
      valor_km_id: valorKm.id,
      empresa_id: session.empresa_id,
      accion: 'creado',
      valor_anterior: null,
      valor_nuevo: valor,
      fecha_desde_anterior: null,
      fecha_hasta_anterior: null,
      fecha_desde_nuevo: fechaDesde,
      fecha_hasta_nuevo: fechaHasta,
      changed_by: session.id,
    })

    return NextResponse.json(valorKm)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
