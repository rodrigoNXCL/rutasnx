'use client'

import InformePuntos from '@/components/InformePuntos'

export default function ClienteInformePuntos() {
  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span
            className="px-3 py-1.5 rounded-lg text-sm text-white border border-emerald-500/40"
            style={{ background: '#10B981' }}
          >
            Puntos y guías
          </span>
        </div>

        <InformePuntos
          endpoint="/api/cliente/informes/puntos"
          modo="cliente"
          titulo="Informe de Puntos y Guías"
          mostrarEncabezado
        />
      </div>
    </div>
  )
}
