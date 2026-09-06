import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireRole(['admin', 'superadmin'])
    const supabase = createAdminClient()

    const empresa_id = session.empresa_id

    const [
      { count: camionesCount },
      { count: choferesCount },
      { count: clientesCount },
      { count: serviciosCount },
      { count: viajesEnCursoCount },
      { data: viajesEnCurso },
      { data: viajesTerminados },
    ] = await Promise.all([
      supabase.from('camiones').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa_id),
      supabase.from('choferes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa_id),
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa_id),
      supabase.from('servicios').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa_id),
      supabase.from('viajes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa_id).eq('estado', 'en_curso'),
      supabase
        .from('viajes')
        .select(`
          id,
          fecha,
          km_inicio,
          km_termino,
          estado,
          created_at,
          camiones (patente),
          servicios (nombre),
          choferes (usuarios (nombre))
        `)
        .eq('empresa_id', empresa_id)
        .eq('estado', 'en_curso')
        .order('fecha', { ascending: false })
        .limit(20),
      supabase
        .from('viajes')
        .select(`
          id,
          fecha,
          km_inicio,
          km_termino,
          estado,
          created_at,
          camiones (patente),
          servicios (nombre),
          choferes (usuarios (nombre))
        `)
        .eq('empresa_id', empresa_id)
        .eq('estado', 'terminado')
        .order('fecha', { ascending: false })
        .limit(20),
    ])

    return NextResponse.json({
      stats: {
        camiones: camionesCount || 0,
        choferes: choferesCount || 0,
        clientes: clientesCount || 0,
        servicios: serviciosCount || 0,
        viajesEnCurso: viajesEnCursoCount || 0,
      },
      viajesEnCurso: viajesEnCurso || [],
      viajesTerminados: viajesTerminados || [],
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
