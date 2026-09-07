'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        setLoading(false)
        return
      }

      router.push(data.dashboard)
      router.refresh()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#0D0D0D' }}>
      <div className="w-full max-w-sm px-8">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">rutasNX</h1>
          <p className="mt-2 text-base text-zinc-400">Control operacional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              id="identifier"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-4 py-3.5 text-white placeholder-zinc-500 transition-colors focus:outline-none focus:ring-1"
              style={{ background: '#141414', borderColor: '#2A2A2A' }}
              placeholder="Usuario"
              required
            />
          </div>

          <div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-3.5 text-white placeholder-zinc-500 transition-colors focus:outline-none focus:ring-1"
              style={{ background: '#141414', borderColor: '#2A2A2A' }}
              placeholder="Contraseña"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-3.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#10B981' }}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-16 text-center text-xs text-zinc-600">
          NXChile
        </p>
      </div>
    </div>
  )
}
