'use client'

import { useEffect } from 'react'

// Informe de rutas y gastos (peaje) ya no se expone al cliente:
// el cliente solo ve "Puntos y guias" (informe de puntos y guias).
export default function ClienteInformes() {
  useEffect(() => {
    window.location.replace('/cliente/informes/puntos')
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-sm text-zinc-400">Redirigiendo a Informes - Puntos y guias...</p>
      </div>
    </div>
  )
}
