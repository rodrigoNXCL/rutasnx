import { requireAdmin } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-900 text-white shadow">
        <nav className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">rutasNX — Admin</span>
            <div className="flex gap-6 text-sm">
              <a href="/admin/dashboard" className="text-white hover:text-slate-300">Dashboard</a>
              <a href="/admin/asignaciones" className="text-white hover:text-slate-300">Jornadas</a>
              <a href="/admin/camiones" className="text-white hover:text-slate-300">Camiones</a>
              <a href="/admin/choferes" className="text-white hover:text-slate-300">Chóferes</a>
              <a href="/admin/clientes" className="text-white hover:text-slate-300">Clientes</a>
              <a href="/admin/servicios" className="text-white hover:text-slate-300">Servicios</a>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-white hover:text-red-300">Cerrar sesión</button>
              </form>
            </div>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
