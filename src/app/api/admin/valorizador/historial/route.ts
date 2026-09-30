import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const { data: historial, error } = await supabase
      .from('valor_km_historial')
      .select('*')
      .eq('empresa_id', session.empresa_id)
      .order('changed_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(historial || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
