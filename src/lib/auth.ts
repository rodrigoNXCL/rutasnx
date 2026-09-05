import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import type { SesionUsuario, Rol } from '@/types/database'
import type { CookieOptions } from '@supabase/ssr'

const SESSION_COOKIE_NAME = 'rutasnx_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function getCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export async function createSession(user: SesionUsuario): Promise<string> {
  const sessionData = JSON.stringify(user)
  const encoder = new TextEncoder()
  const data = encoder.encode(sessionData)
  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(32),
    'AES-GCM',
    false,
    ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decryptSession(token: string): Promise<SesionUsuario | null> {
  try {
    const combined = Uint8Array.from(atob(token), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(32),
      'AES-GCM',
      false,
      ['decrypt']
    )
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )
    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(decrypted))
  } catch {
    return null
  }
}

export async function login(email: string, password: string): Promise<{ success: true; user: SesionUsuario } | { success: false; error: string }> {
  const supabase = createAdminClient()

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('activo', true)
    .single()

  if (error || !usuario) {
    return { success: false, error: 'Credenciales inválidas' }
  }

  const validPassword = await verifyPassword(password, usuario.password_hash)
  if (!validPassword) {
    return { success: false, error: 'Credenciales inválidas' }
  }

  await supabase
    .from('usuarios')
    .update({ ultimo_login: new Date().toISOString() })
    .eq('id', usuario.id)

  const sessionUser: SesionUsuario = {
    id: usuario.id,
    empresa_id: usuario.empresa_id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
  }

  const sessionToken = await createSession(sessionUser)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, getCookieOptions())

  return { success: true, user: sessionUser }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSession(): Promise<SesionUsuario | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  return decryptSession(sessionCookie.value)
}

export async function requireAuth(): Promise<SesionUsuario> {
  const session = await getSession()
  if (!session) {
    throw new Error('No autenticado')
  }
  return session
}

export async function requireRole(roles: Rol[]): Promise<SesionUsuario> {
  const session = await requireAuth()
  if (!roles.includes(session.rol)) {
    throw new Error('No autorizado')
  }
  return session
}

export async function requireSuperadmin(): Promise<SesionUsuario> {
  return requireRole(['superadmin'])
}

export async function requireAdmin(): Promise<SesionUsuario> {
  return requireRole(['admin', 'superadmin'])
}

export async function requireChofer(): Promise<SesionUsuario> {
  return requireRole(['chofer'])
}

export async function requireCliente(): Promise<SesionUsuario> {
  return requireRole(['cliente'])
}
