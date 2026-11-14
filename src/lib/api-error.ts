import { NextResponse } from 'next/server'
import { AuthError } from '@/lib/auth'

export function errorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  console.error('Error:', error)
  return NextResponse.json({ error: 'Error interno' }, { status: 500 })
}
