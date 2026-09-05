import { getSession } from '@/lib/auth'

export default async function AdminDashboard() {
  const session = await getSession()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Dashboard — Admin</h1>
      <p className="text-slate-600 mb-6">Bienvenido, {session?.nombre}</p>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Camiones</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Chóferes</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Clientes</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Servicios</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">0</p>
        </div>
      </div>
    </div>
  )
}
