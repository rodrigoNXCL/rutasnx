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
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Dashboard — Super Admin</h1>
      <p className="text-slate-600 mb-6">Bienvenido, {session?.nombre}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Empresas</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">{stats.empresas}</p>
          <p className="text-sm text-slate-400">Activas</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Admins</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">{stats.admins}</p>
          <p className="text-sm text-slate-400">Registrados</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Usuarios</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">{stats.usuarios}</p>
          <p className="text-sm text-slate-400">En el sistema</p>
        </div>
      </div>
    </div>
  )
}
