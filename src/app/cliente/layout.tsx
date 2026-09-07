import { requireCliente } from '@/lib/auth'

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireCliente()

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <header className="border-b border-zinc-800" style={{ background: '#0D0D0D' }}>
        <nav className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold tracking-tight text-white">rutasNX</span>
            <div className="flex gap-8 text-sm">
              <a href="/cliente/servicios" className="text-zinc-400 hover:text-white transition-colors">Dashboard</a>
              <a href="/cliente/informes" className="text-zinc-400 hover:text-white transition-colors">Informes</a>
              <form action="/api/auth/logout" method="POST" className="inline">
                <button type="submit" className="text-zinc-500 hover:text-red-400 transition-colors">Cerrar</button>
              </form>
            </div>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
