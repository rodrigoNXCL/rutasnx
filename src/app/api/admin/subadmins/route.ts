import { NextResponse } from 'next/server'
import { hashPassword, requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const [{ data: subadmins, error: errSubadmins }, { data: camiones, error: errCamiones }] =
      await Promise.all([
        supabase
          .from('usuarios')
          .select('id, nombre, email, activo, created_at')
          .eq('empresa_id', session.empresa_id)
          .eq('rol', 'subadmin')
          .order('nombre'),
        supabase
          .from('camiones')
          .select('id, patente, marca, activo')
          .eq('empresa_id', session.empresa_id)
          .order('patente'),
      ])

    if (errSubadmins) {
      return NextResponse.json({ error: errSubadmins.message }, { status: 500 })
    }
    if (errCamiones) {
      return NextResponse.json({ error: errCamiones.message }, { status: 500 })
    }

    const { data: asignaciones, error: errAsignaciones } = await supabase
      .from('subadmin_camiones')
      .select('subadmin_id, camion_id')
      .eq('empresa_id', session.empresa_id)

    if (errAsignaciones) {
      return NextResponse.json({ error: errAsignaciones.message }, { status: 500 })
    }

    const porSubadmin = new Map<string, string[]>()
    for (const fila of asignaciones || []) {
      const lista = porSubadmin.get(fila.subadmin_id) || []
      lista.push(fila.camion_id)
      porSubadmin.set(fila.subadmin_id, lista)
    }

    return NextResponse.json({
      subadmins: (subadmins || []).map((subadmin) => ({
        ...subadmin,
        camion_ids: porSubadmin.get(subadmin.id) || [],
      })),
      camiones: camiones || [],
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()

    const body = await request.json()
    const nombre = String(body?.nombre || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const camionIds: string[] = Array.isArray(body?.camion_ids)
      ? body.camion_ids.map((id: unknown) => String(id)).filter(Boolean)
      : []

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    if (camionIds.length > 0) {
      const { data: camionesValidos } = await supabase
        .from('camiones')
        .select('id')
        .eq('empresa_id', session.empresa_id)
        .in('id', camionIds)

      if ((camionesValidos || []).length !== camionIds.length) {
        return NextResponse.json({ error: 'Camión inválido' }, { status: 400 })
      }
    }

    const passwordHash = await hashPassword(password)

    const { data: creado, error } = await supabase
      .from('usuarios')
      .insert({
        empresa_id: session.empresa_id,
        email,
        password_hash: passwordHash,
        nombre,
        rol: 'subadmin',
        activo: true,
      })
      .select('id, nombre, email, activo, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (camionIds.length > 0) {
      const { error: errAsignar } = await supabase.from('subadmin_camiones').insert(
        camionIds.map((camionId) => ({
          empresa_id: session.empresa_id,
          subadmin_id: creado.id,
          camion_id: camionId,
        }))
      )

      if (errAsignar) {
        return NextResponse.json({ error: errAsignar.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ...creado, camion_ids: camionIds }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
