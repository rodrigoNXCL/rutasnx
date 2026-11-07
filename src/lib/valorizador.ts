import { createAdminClient } from '@/lib/supabase/admin'

type SupabaseAdmin = ReturnType<typeof createAdminClient>

export function validarRango(fechaDesde: string, fechaHasta: string): string | null {
  if (!fechaDesde || !fechaHasta) return 'fecha_desde y fecha_hasta son requeridos'
  if (fechaHasta < fechaDesde) return 'fecha_hasta debe ser >= fecha_desde'
  return null
}

export async function haySolapamiento(
  supabase: SupabaseAdmin,
  empresaId: string,
  fechaDesde: string,
  fechaHasta: string,
  excluirId?: string
): Promise<boolean> {
  let query = supabase
    .from('valor_km')
    .select('id')
    .eq('empresa_id', empresaId)
    .lte('fecha_desde', fechaHasta)
    .gte('fecha_hasta', fechaDesde)
    .limit(1)

  if (excluirId) query = query.neq('id', excluirId)

  const { data } = await query
  return (data?.length ?? 0) > 0
}
