import { requireChofer } from '@/lib/auth'

export default async function ChoferLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireChofer()

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <header className="border-b border-zinc-800" style={{ background: '#0D0D0D' }}>
        <nav className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold tracking-tight text-white">rutasNX</span>
            <div className="flex gap-6 text-sm">
              <a href="/chofer/registro" className="text-zinc-400 hover:text-white transition-colors">Registrar</a>
              <a href="/chofer/historial" className="text-zinc-400 hover:text-white transition-colors">Historial</a>
              <form action="/api/auth/logout" method="POST" className="inline">
                <button type="submit" className="text-zinc-500 hover:text-red-400 transition-colors">Salir</button>
              </form>
            </div>
          </div>
        </nav>
      </header>
      <main className="max-w-lg mx-auto px-6 py-6">{children}</main>
    </div>
  )
}
