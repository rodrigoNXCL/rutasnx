import { requireAdminOrSubadmin } from '@/lib/auth'
import AdminNav from './admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdminOrSubadmin()

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <header className="border-b border-zinc-800 sticky top-0 z-50" style={{ background: '#0D0D0D' }}>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <span className="text-lg font-semibold tracking-tight text-white">rutasNX</span>
            <AdminNav rol={session.rol} />
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
