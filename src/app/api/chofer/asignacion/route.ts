import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
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
        servicios (
          id,
          nombre,
          origen,
          destino,
          precio_km,
          precio_base,
          cliente_id,
          tipo_servicio_id,
          clientes (id, nombre),
          tipos_servicio (id, codigo, nombre, flujo)
        )
      `)
      .eq('chofer_id', chofer.id)
      .eq('activo', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const vistas = new Set<string>()
    const unicas = (asignaciones || []).filter((asignacion) => {
      const clave = `${asignacion.camiones?.id || ''}-${asignacion.servicios?.id || ''}`
      if (vistas.has(clave)) return false
      vistas.add(clave)
      return true
    })

    return NextResponse.json(unicas)
  } catch (error) {
    return errorResponse(error)
  }
}
