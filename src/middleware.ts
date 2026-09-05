import { NextResponse, type NextRequest } from 'next/server'
import { decryptSession } from '@/lib/auth'
import type { Rol } from '@/types/database'

const SESSION_COOKIE_NAME = 'rutasnx_session'

type RouteConfig = {
  roles: Rol[]
  destination?: string
}

const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  '/superadmin': { roles: ['superadmin'] },
  '/admin': { roles: ['admin', 'superadmin'] },
  '/chofer': { roles: ['chofer'] },
  '/cliente': { roles: ['cliente'] },
  '/auth/login': { roles: [] },
  '/': { roles: [] },
}

function getRouteConfig(pathname: string): RouteConfig | null {
  for (const route of Object.keys(ROUTE_CONFIGS)) {
    if (pathname.startsWith(route)) {
      return ROUTE_CONFIGS[route]
    }
  }
  return null
}

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  let session = null

  if (sessionCookie?.value) {
    session = await decryptSession(sessionCookie.value)
  }

  const routeConfig = getRouteConfig(pathname)

  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL(getDashboardForRole(session.rol), request.url))
    }
    return NextResponse.next()
  }

  if (pathname === '/auth/login') {
    if (session) {
      return NextResponse.redirect(new URL(getDashboardForRole(session.rol), request.url))
    }
    return NextResponse.next()
  }

  if (!routeConfig) {
    if (session) {
      return NextResponse.redirect(new URL(getDashboardForRole(session.rol), request.url))
    }
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (!routeConfig.roles.includes(session.rol)) {
    return NextResponse.redirect(new URL(getDashboardForRole(session.rol), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
