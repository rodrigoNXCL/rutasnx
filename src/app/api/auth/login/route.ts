import { NextResponse } from 'next/server'
import { login } from '@/lib/auth'
import type { Rol } from '@/types/database'

function getDashboardForRole(rol: Rol): string {
  switch (rol) {
    case 'superadmin':
      return '/superadmin/dashboard'
    case 'admin':
      return '/admin/dashboard'
    case 'chofer':
      return '/chofer/registro'
    case 'cliente':
      return '/cliente/servicios'
  }
}

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json()

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const result = await login(identifier, password)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: result.user,
      dashboard: getDashboardForRole(result.user.rol),
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
