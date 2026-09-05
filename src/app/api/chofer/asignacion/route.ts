import { NextResponse } from 'next/server'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireChofer()
    const supabase = createAdminClient()

    const { data: chofer } = await supabase
      .from('choferes')
      .select('id')
      .eq('usuario_id', session.id)
      .single()

    if (!chofer) {
      return NextResponse.json({ error: 'Chófer no encontrado' }, { status: 404 })
    }

    const { data: asignaciones, error } = await supabase
      .from('asignaciones')
      .select(`
        id,
        observaciones,
        activo,
        camiones (id, patente, marca, modelo),
        servicios (id, nombre, origen, destino, precio_km, precio_base, clientes (nombre))
      `)
      .eq('chofer_id', chofer.id)
      .eq('activo', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(asignaciones || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
