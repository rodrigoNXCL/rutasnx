import { getSession } from '@/lib/auth'

export default async function ClienteServicios() {
  const session = await getSession()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mis Servicios</h1>
      <p className="text-muted-foreground mb-4">
        Bienvenido, {session?.nombre}
      </p>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-500">
          Los servicios que tienes contratados aparecerán aquí...
        </p>
      </div>
    </div>
  )
}
