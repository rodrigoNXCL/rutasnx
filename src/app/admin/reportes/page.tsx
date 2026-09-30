'use client'

import { useState } from 'react'
import InformesTab from './informes-tab'
import ResumenDiarioTab from './resumen-tab'
import ValorizadorTab from './valorizador-tab'

type TabKey = 'informes' | 'resumen' | 'valorizador'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'informes', label: 'Informes' },
  { key: 'resumen', label: 'Resumen Diario' },
  { key: 'valorizador', label: 'Valorizador KM' },
]

export default function AdminReportes() {
  const [tab, setTab] = useState<TabKey>('informes')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white tracking-tight mb-6">Reportes</h1>

      <div className="flex gap-1 mb-6 border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            style={{
              color: tab === t.key ? '#fff' : '#71717a',
              borderColor: tab === t.key ? '#10B981' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'informes' && <InformesTab />}
      {tab === 'resumen' && <ResumenDiarioTab />}
      {tab === 'valorizador' && <ValorizadorTab />}
    </div>
  )
}
