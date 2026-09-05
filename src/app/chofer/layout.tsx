import { requireChofer } from '@/lib/auth'

export default async function ChoferLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireChofer()

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-900 text-white shadow">
        <nav className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">rutasNX</span>
            <div className="flex gap-4 text-sm">
              <a href="/chofer/registro" className="text-white hover:text-slate-300">Registrar</a>
              <a href="/chofer/historial" className="text-white hover:text-slate-300">Historial</a>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-white hover:text-red-300">Salir</button>
              </form>
            </div>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
    </div>
  )
}
