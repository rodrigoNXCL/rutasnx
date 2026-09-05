import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password, nombre } = await request.json()

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: 'email, password y nombre son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'superadmin')

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Ya existe un superadmin. Usa el panel de admin para crear más usuarios.' },
        { status: 403 }
      )
    }

    const passwordHash = await hashPassword(password)

    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .limit(1)
      .single()

    if (!empresa) {
      return NextResponse.json(
        { error: 'No hay empresas creadas. Ejecuta el SQL de empresa primero.' },
        { status: 400 }
      )
    }

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .insert({
        empresa_id: empresa.id,
        email,
        password_hash: passwordHash,
        nombre,
        rol: 'superadmin',
        activo: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Superadmin creado',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    })
  } catch (error) {
    console.error('Bootstrap error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
