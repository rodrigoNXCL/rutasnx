import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, SesionUsuario } from '@/types/database'

export async function getClienteIdsForUsuario(
  supabase: SupabaseClient<Database>,
  session: SesionUsuario
): Promise<string[]> {
  const { data } = await supabase
    .from('cliente_usuarios')
    .select('cliente_id')
    .eq('usuario_id', session.id)

  return (data || []).map((r) => r.cliente_id)
}
