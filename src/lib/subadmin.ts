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
