'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { Rol } from '@/types/database'

interface NavItem {
  href: string
  label: string
}

interface MenuProps {
  label: string
  items: NavItem[]
  abierto: boolean
  onToggle: () => void
  onCerrar: () => void
  alineacion?: 'left' | 'right'
}

function Menu({ label, items, abierto, onToggle, onCerrar, alineacion = 'left' }: MenuProps) {
  const pathname = usePathname()
  const activo = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 transition-colors ${
          activo || abierto ? 'text-white' : 'text-zinc-400 hover:text-white'
        }`}
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <div
          className={`absolute top-full z-50 mt-3 min-w-[200px] rounded-xl border p-1.5 shadow-2xl ${
            alineacion === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ background: '#141414', borderColor: '#2A2A2A' }}
        >
          {items.map((item) => {
            const itemActivo =
              pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onCerrar}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  itemActivo
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminNav({ rol }: { rol: Rol }) {
  const pathname = usePathname()
  const [menu, setMenu] = useState<{ key: 'operacion' | 'administracion'; path: string } | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const esSubadmin = rol === 'subadmin'

  // El menú se considera cerrado cuando cambia la ruta (sin efecto de estado).
  const abierto = menu && menu.path === pathname ? menu.key : null

  function alternar(key: 'operacion' | 'administracion') {
    setMenu(abierto === key ? null : { key, path: pathname })
  }

  const operacion: NavItem[] = [
    { href: '/admin/rutas', label: 'Rutas' },
    { href: '/admin/reportes', label: 'Reportes' },
    ...(esSubadmin ? [] : [{ href: '/admin/valorizador', label: 'Valorizador' }]),
  ]

  const administracion: NavItem[] = esSubadmin
    ? []
    : [
        { href: '/admin/asignaciones', label: 'Jornadas' },
        { href: '/admin/camiones', label: 'Camiones' },
        ...(rol === 'superadmin'
          ? [{ href: '/admin/empresas', label: 'Empresas' }]
          : []),
        { href: '/admin/choferes', label: 'Chóferes' },
        { href: '/admin/clientes', label: 'Clientes' },
        { href: '/admin/servicios', label: 'Servicios' },
        { href: '/admin/tipos-servicio', label: 'Tipos de servicio' },
        { href: '/admin/usuarios', label: 'Usuarios' },
      ]

  useEffect(() => {
    function alHacerClick(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setMenu(null)
      }
    }

    function alPresionarTecla(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenu(null)
      }
    }

    document.addEventListener('mousedown', alHacerClick)
    document.addEventListener('keydown', alPresionarTecla)

    return () => {
      document.removeEventListener('mousedown', alHacerClick)
      document.removeEventListener('keydown', alPresionarTecla)
    }
  }, [])

  const enDashboard = pathname === '/admin' || pathname === '/admin/dashboard'

  return (
    <div ref={navRef} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <a
        href="/admin/dashboard"
        className={`transition-colors ${
          enDashboard ? 'text-white' : 'text-zinc-400 hover:text-white'
        }`}
      >
        Dashboard
      </a>

      <Menu
        label="Operación"
        items={operacion}
        abierto={abierto === 'operacion'}
        onToggle={() => alternar('operacion')}
        onCerrar={() => setMenu(null)}
      />

      {!esSubadmin && (
        <Menu
          label="Administración"
          items={administracion}
          abierto={abierto === 'administracion'}
          onToggle={() => alternar('administracion')}
          onCerrar={() => setMenu(null)}
          alineacion="right"
        />
      )}

      <form action="/api/auth/logout" method="POST" className="inline">
        <button
          type="submit"
          className="text-zinc-500 transition-colors hover:text-red-400"
        >
          Cerrar
        </button>
      </form>
    </div>
  )
}
