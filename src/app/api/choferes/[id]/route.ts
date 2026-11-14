import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-error'
import { hashPassword, requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params

    const body = await request.json()
    const { nombre, rut, licencia, telefono, activo, activar_acceso, password } = body

    const { data: chofer } = await supabase
      .from('choferes')
      .select('id, usuario_id, rut')
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .maybeSingle()

    if (!chofer) {
      return NextResponse.json({ error: 'Chófer no encontrado' }, { status: 404 })
    }

    const passwordLimpia = String(password || '')
    let usuarioId = chofer.usuario_id

    if (activar_acceso === true) {
      if (!usuarioId) {
        const email = String(rut || chofer.rut || '').trim()
        if (!email) {
          return NextResponse.json(
            { error: 'El RUT es obligatorio para crear el acceso' },
            { status: 400 }
          )
        }
        if (passwordLimpia.length < 6) {
          return NextResponse.json(
            { error: 'La contraseña debe tener al menos 6 caracteres' },
            { status: 400 }
          )
        }

        const { data: existente } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (existente) {
          return NextResponse.json(
            { error: 'El RUT ya está registrado como usuario' },
            { status: 400 }
          )
        }

        const passwordHash = await hashPassword(passwordLimpia)
        const { data: creado, error } = await supabase
          .from('usuarios')
          .insert({
            empresa_id: session.empresa_id,
            email,
            password_hash: passwordHash,
            nombre,
            rol: 'chofer',
            activo: true,
          })
          .select('id')
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        usuarioId = creado.id
      } else {
        const cambios: { activo?: boolean; password_hash?: string } = { activo: true }
        if (passwordLimpia) {
          if (passwordLimpia.length < 6) {
            return NextResponse.json(
              { error: 'La contraseña debe tener al menos 6 caracteres' },
              { status: 400 }
            )
          }
          cambios.password_hash = await hashPassword(passwordLimpia)
        }

        const { error } = await supabase
          .from('usuarios')
          .update(cambios)
          .eq('id', usuarioId)
          .eq('empresa_id', session.empresa_id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }
    } else if (activar_acceso === false && usuarioId) {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: false })
        .eq('id', usuarioId)
        .eq('empresa_id', session.empresa_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    const { data, error } = await supabase
      .from('choferes')
      .update({ nombre, rut, licencia, telefono, activo, usuario_id: usuarioId })
      .eq('id', id)
      .eq('empresa_id', session.empresa_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    const { id } = await params

    const { error } = await supabase
      .from('choferes')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
