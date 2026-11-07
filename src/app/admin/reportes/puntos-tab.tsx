'use client'

import InformePuntos from '@/components/InformePuntos'

export default function PuntosTab() {
  return (
    <InformePuntos
      endpoint="/api/admin/informes/puntos"
      modo="admin"
      titulo="Puntos y Guías"
    />
  )
}
