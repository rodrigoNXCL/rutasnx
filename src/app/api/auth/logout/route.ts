import { NextResponse } from 'next/server'
import { logout } from '@/lib/auth'

export async function POST() {
  await logout()
  return NextResponse.redirect(new URL('/auth/login', 'https://rutas.nxchile.com'))
}
