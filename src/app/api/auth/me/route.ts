import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  return NextResponse.json({
    id: session.id,
    nombre: session.nombre,
    email: session.email,
    rol: session.rol,
    empresa_id: session.empresa_id,
  })
}
