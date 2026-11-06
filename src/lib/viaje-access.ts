import { createAdminClient } from '@/lib/supabase/admin'
import type { FlujoServicio, SesionUsuario, Viaje } from '@/types/database'

export async function getViajeAcceso(session: SesionUsuario, viajeId: string) {
  const supabase = createAdminClient()

  const { data: viaje, error } = await supabase
    .from('viajes')
    .select('*')
    .eq('id', viajeId)
    .single()

  if (error || !viaje) {
    return { error: 'Viaje no encontrado', status: 404 } as const
  }

  if (session.rol === 'chofer') {
    const { data: chofer } = await supabase
      .from('choferes')
      .select('id')
      .eq('usuario_id', session.id)
      .single()

    if (!chofer || chofer.id !== viaje.chofer_id) {
      return { error: 'No autorizado', status: 403 } as const
    }
  } else if (viaje.empresa_id !== session.empresa_id) {
    return { error: 'No autorizado', status: 403 } as const
  }

  let flujo: FlujoServicio | null = null

  if (viaje.tipo_servicio_id) {
    const { data: tipo } = await supabase
      .from('tipos_servicio')
      .select('flujo')
      .eq('id', viaje.tipo_servicio_id)
      .single()

    flujo = tipo?.flujo ?? null
  }

  return { viaje: viaje as Viaje, flujo } as const
}
