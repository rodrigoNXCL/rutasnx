import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import EmpresasClient from './EmpresasClient'

export default async function AdminEmpresasPage() {
  const session = await getSession()

  if (!session || session.rol !== 'superadmin') {
    redirect('/admin/dashboard')
  }

  return <EmpresasClient />
}
