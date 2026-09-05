import { getSession } from '@/lib/auth'

export default async function ClienteInformes() {
  const session = await getSession()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Informes</h1>
      <p className="text-muted-foreground mb-4">
        Hola, {session?.nombre}
      </p>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-500">
          Descarga de informes en PDF y CSV próximamente...
        </p>
      </div>
    </div>
  )
}
