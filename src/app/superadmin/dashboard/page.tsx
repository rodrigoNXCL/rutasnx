import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function getStats() {
  const supabase = createAdminClient()

  const [{ count: empresas }, { count: admins }, { count: usuarios }] = await Promise.all([
    supabase.from('empresas').select('*', { count: 'exact', head: true }),
    supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'admin'),
    supabase.from('usuarios').select('*', { count: 'exact', head: true }),
  ])

  return { empresas: empresas || 0, admins: admins || 0, usuarios: usuarios || 0 }
}

export default async function SuperadminDashboard() {
  const session = await getSession()
  const stats = await getStats()

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">Dashboard</h1>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Empresas</p>
            <p className="text-3xl font-semibold text-white mt-2">{stats.empresas}</p>
          </div>
          <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Admins</p>
            <p className="text-3xl font-semibold text-white mt-2">{stats.admins}</p>
          </div>
          <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Usuarios</p>
            <p className="text-3xl font-semibold text-white mt-2">{stats.usuarios}</p>
          </div>
        </div>
      </div>
    </div>
  )
}