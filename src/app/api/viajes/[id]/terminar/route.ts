import { NextResponse } from 'next/server'
import { requireChofer } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireChofer()
    const supabase = createAdminClient()
    const { id } = await params

    const { data: chofer } = await supabase
      .from('choferes')
      .select('id, empresa_id')
      .eq('usuario_id', session.id)
      .single()

    if (!chofer) {
      return NextResponse.json({ error: 'Chófer no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { km_termino, foto_km_termino, observaciones, gastos } = body

    if (km_termino === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data: viajeActual } = await supabase
      .from('viajes')
      .select('km_inicio, estado')
      .eq('id', id)
      .eq('chofer_id', chofer.id)
      .single()

    if (!viajeActual) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }

    if (viajeActual.estado === 'terminado') {
      return NextResponse.json({ error: 'Este viaje ya fue terminado' }, { status: 400 })
    }

    if (km_termino < viajeActual.km_inicio) {
      return NextResponse.json({ error: 'Km término debe ser mayor o igual a km inicio' }, { status: 400 })
    }

    const { data: viaje, error: errorViaje } = await supabase
      .from('viajes')
      .update({
        km_termino,
        foto_km_termino: foto_km_termino || null,
        observaciones: observaciones || null,
        estado: 'terminado',
      })
      .eq('id', id)
      .eq('chofer_id', chofer.id)
      .select()
      .single()

    if (errorViaje) {
      return NextResponse.json({ error: errorViaje.message }, { status: 500 })
    }

    if (gastos && gastos.length > 0) {
      const gastosInsert = gastos
        .filter((g: { monto: string | number }) => g.monto)
        .map((g: { tipo: string; monto: string | number; descripcion?: string; foto_url?: string }) => ({
          viaje_id: id,
          tipo: g.tipo,
          monto: parseInt(String(g.monto)),
          descripcion: g.descripcion || null,
          foto_url: g.foto_url || null,
          empresa_id: chofer.empresa_id,
        }))

      if (gastosInsert.length > 0) {
        const { error: errorGastos } = await supabase
          .from('gastos')
          .insert(gastosInsert)

        if (errorGastos) {
          console.error('Error inserting gastos:', errorGastos)
        }
      }
    }

    return NextResponse.json(viaje)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
