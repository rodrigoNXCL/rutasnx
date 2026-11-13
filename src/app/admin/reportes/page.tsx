import { getSession } from '@/lib/auth'
import ReportesClient from './reportes-client'

export default async function AdminReportes() {
  const session = await getSession()
  const esSubadmin = session?.rol === 'subadmin'

  return <ReportesClient esSubadmin={esSubadmin} />
}
