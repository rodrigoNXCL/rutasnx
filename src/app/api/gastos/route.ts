import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getViajeAcceso } from '@/lib/viaje-access'

export async function POST(request: Request) {
  try {
    const session = await requireRole(['chofer', 'admin', 'superadmin', 'subadmin'])
    const supabase = createAdminClient()

    const body = await request.json()
    const { viaje_id, tipo, monto, descripcion, foto_url } = body

    if (!viaje_id || !tipo || monto === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const acceso = await getViajeAcceso(session, viaje_id)

    if ('error' in acceso) {
      return NextResponse.json({ error: acceso.error }, { status: acceso.status })
    }

    const { data: gasto, error: errorGasto } = await supabase
      .from('gastos')
      .insert({
        empresa_id: acceso.viaje.empresa_id,
        viaje_id,
        tipo,
        monto,
        descripcion: descripcion || null,
        foto_url: foto_url || null,
      })
      .select()
      .single()

    if (errorGasto) {
      return NextResponse.json({ error: errorGasto.message }, { status: 500 })
    }

    return NextResponse.json(gasto)
  } catch (error) {
    return errorResponse(error)
  }
}
