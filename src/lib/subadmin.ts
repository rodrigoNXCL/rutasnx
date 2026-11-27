import type { SupabaseClient } from '@supabase/supabase-js'
import type { SesionUsuario } from '@/types/database'

/**
 * Devuelve los IDs de camión asignados al subadmin.
 * - `null` si el usuario no es subadmin (sin filtro).
 * - `[]` si es subadmin pero no tiene camiones asignados.
 */
export async function getCamionesSubadmin(
  supabase: SupabaseClient,
  session: SesionUsuario
): Promise<string[] | null> {
  if (session.rol !== 'subadmin') return null

  const { data } = await supabase
    .from('subadmin_camiones')
    .select('camion_id')
    .eq('subadmin_id', session.id)
    .eq('empresa_id', session.empresa_id)

  return (data || []).map((row) => row.camion_id)
}

/**
 * Devuelve los IDs de chóferes que operan (o han operado) los camiones del
 * subadmin, según asignaciones y viajes históricos.
 * - `null` si el usuario no es subadmin.
 */
export async function getChoferesSubadmin(
  supabase: SupabaseClient,
  session: SesionUsuario
): Promise<string[] | null> {
  if (session.rol !== 'subadmin') return null

  const camiones = await getCamionesSubadmin(supabase, session)

  if (!camiones || camiones.length === 0) return []

  const [asignaciones, viajes] = await Promise.all([
    supabase
      .from('asignaciones')
      .select('chofer_id')
      .eq('empresa_id', session.empresa_id)
      .in('camion_id', camiones),
    supabase
      .from('viajes')
      .select('chofer_id')
      .eq('empresa_id', session.empresa_id)
      .in('camion_id', camiones),
  ])

  const ids = new Set<string>()

  for (const row of asignaciones.data || []) ids.add(row.chofer_id)
  for (const row of viajes.data || []) ids.add(row.chofer_id)

  return [...ids]
}

/**
 * Devuelve los IDs de servicios vinculados a los camiones del subadmin, según
 * asignaciones y viajes históricos.
 * - `null` si el usuario no es subadmin.
 */
export async function getServiciosSubadmin(
  supabase: SupabaseClient,
  session: SesionUsuario
): Promise<string[] | null> {
  if (session.rol !== 'subadmin') return null

  const camiones = await getCamionesSubadmin(supabase, session)

  if (!camiones || camiones.length === 0) return []

  const [asignaciones, viajes] = await Promise.all([
    supabase
      .from('asignaciones')
      .select('servicio_id')
      .eq('empresa_id', session.empresa_id)
      .in('camion_id', camiones),
    supabase
      .from('viajes')
      .select('servicio_id')
      .eq('empresa_id', session.empresa_id)
      .in('camion_id', camiones)
      .not('servicio_id', 'is', null),
  ])

  const ids = new Set<string>()

  for (const row of asignaciones.data || []) {
    if (row.servicio_id) ids.add(row.servicio_id)
  }
  for (const row of viajes.data || []) {
    if (row.servicio_id) ids.add(row.servicio_id)
  }

  return [...ids]
}
