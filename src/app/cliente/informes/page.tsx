'use client'

import { useState } from 'react'

export default function ClienteInformes() {
  const [loading, setLoading] = useState(false)

  if (loading) {
    return <div className="p-8 text-sm text-zinc-500">Cargando...</div>
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">Informes</h1>
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500">Próximamente</p>
        </div>
      </div>
    </div>
  )
}