import { requireCliente } from '@/lib/auth'

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireCliente()

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-900 text-white shadow">
        <nav className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">rutasNX — Cliente</span>
            <div className="flex gap-6 text-sm">
              <a href="/cliente/servicios" className="text-white hover:text-slate-300">Servicios</a>
              <a href="/cliente/informes" className="text-white hover:text-slate-300">Informes</a>
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
