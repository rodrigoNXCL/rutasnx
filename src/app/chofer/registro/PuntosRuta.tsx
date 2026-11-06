'use client'

import { useEffect, useState } from 'react'

interface Punto {
  id: string
  orden: number
  tipo: 'retiro' | 'entrega'
  nombre_punto: string
  km_llegada: number
  foto_guia_url: string
  captured_at: string
}

interface PuntosRutaProps {
  viajeId: string
  clienteId: string | null
  kmInicio: number
  soloEdicion?: boolean
}

interface EdicionForm {
  tipo: 'retiro' | 'entrega'
  nombre_punto: string
  km_llegada: string
  foto_guia_url: string
}

export default function PuntosRuta({ viajeId, clienteId, kmInicio, soloEdicion = false }: PuntosRutaProps) {
  const [puntos, setPuntos] = useState<Punto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [tipo, setTipo] = useState<'retiro' | 'entrega'>('entrega')
  const [nombre, setNombre] = useState('')
  const [km, setKm] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [sugerencias, setSugerencias] = useState<string[]>([])

  const [editando, setEditando] = useState<Punto | null>(null)
  const [editForm, setEditForm] = useState<EdicionForm>({
    tipo: 'entrega',
    nombre_punto: '',
    km_llegada: '',
    foto_guia_url: '',
  })
  const [editFoto, setEditFoto] = useState<File | null>(null)
  const [editFotoPreview, setEditFotoPreview] = useState<string | null>(null)
  const [motivoEdicion, setMotivoEdicion] = useState('')

  const [anulando, setAnulando] = useState<Punto | null>(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

  const ultimoKm = puntos.length > 0 ? puntos[puntos.length - 1].km_llegada : kmInicio

  async function cargarPuntos() {
    try {
      const res = await fetch(`/api/viajes/${viajeId}/puntos`)
      if (res.ok) {
        const data = await res.json()
        setPuntos(data.puntos || [])
      }
    } catch (err) {
      console.error('Error cargando puntos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPuntos()
  }, [])

  useEffect(() => {
    if (!clienteId) return

    const term = nombre.trim()

    if (term.length < 2) return

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/puntos/sugerencias?cliente_id=${clienteId}&q=${encodeURIComponent(term)}&limit=8`
        )

        if (res.ok) {
          const data = await res.json()
          setSugerencias(data.sugerencias || [])
        }
      } catch {
        setSugerencias([])
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [nombre, clienteId])

  function limpiarMensajes() {
    setError('')
    setSuccess('')
  }

  async function uploadFoto(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'guias')

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.url
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]

    if (!file) return

    if (fotoPreview) URL.revokeObjectURL(fotoPreview)

    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  function handleEditFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]

    if (!file) return

    if (editFotoPreview && editFotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(editFotoPreview)
    }

    setEditFoto(file)
    setEditFotoPreview(URL.createObjectURL(file))
  }

  async function agregarPunto(e: React.FormEvent) {
    e.preventDefault()
    limpiarMensajes()

    const nombreLimpio = nombre.trim()
    const kmNumero = parseInt(km)

    if (!nombreLimpio) {
      setError('Ingresa el nombre del punto')
      return
    }

    if (!Number.isInteger(kmNumero) || kmNumero < kmInicio) {
      setError(`El odómetro debe ser mayor o igual a ${kmInicio} km`)
      return
    }

    if (kmNumero < ultimoKm) {
      setError(`El odómetro no puede ser menor al último punto (${ultimoKm} km)`)
      return
    }

    if (!foto) {
      setError('La foto de la guía es obligatoria')
      return
    }

    setSaving(true)

    try {
      setUploading(true)
      const fotoUrl = await uploadFoto(foto)
      setUploading(false)

      if (!fotoUrl) {
        setError('Error subiendo la foto de la guía')
        return
      }

      const res = await fetch(`/api/viajes/${viajeId}/puntos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          nombre_punto: nombreLimpio,
          km_llegada: kmNumero,
          foto_guia_url: fotoUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al registrar el punto')
        return
      }

      if (fotoPreview) URL.revokeObjectURL(fotoPreview)

      setNombre('')
      setKm('')
      setFoto(null)
      setFotoPreview(null)
      setSugerencias([])
      setSuccess('Punto registrado')
      await cargarPuntos()

      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  function abrirEdicion(punto: Punto) {
    limpiarMensajes()
    setEditando(punto)
    setEditForm({
      tipo: punto.tipo,
      nombre_punto: punto.nombre_punto,
      km_llegada: String(punto.km_llegada),
      foto_guia_url: punto.foto_guia_url,
    })
    setEditFoto(null)
    setEditFotoPreview(punto.foto_guia_url)
    setMotivoEdicion('')
  }

  function cerrarEdicion() {
    if (editFotoPreview && editFotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(editFotoPreview)
    }
    setEditando(null)
    setEditFoto(null)
    setEditFotoPreview(null)
    setMotivoEdicion('')
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault()

    if (!editando) return

    limpiarMensajes()

    if (!motivoEdicion.trim()) {
      setError('El motivo de la corrección es obligatorio')
      return
    }

    const kmNumero = parseInt(editForm.km_llegada)

    if (!Number.isInteger(kmNumero) || kmNumero < kmInicio) {
      setError(`El odómetro debe ser mayor o igual a ${kmInicio} km`)
      return
    }

    setSaving(true)

    try {
      let fotoUrl = editForm.foto_guia_url

      if (editFoto) {
        setUploading(true)
        const nuevaFoto = await uploadFoto(editFoto)
        setUploading(false)

        if (!nuevaFoto) {
          setError('Error subiendo la nueva foto de la guía')
          return
        }

        fotoUrl = nuevaFoto
      }

      const res = await fetch(`/api/viajes/${viajeId}/puntos/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: editForm.tipo,
          nombre_punto: editForm.nombre_punto,
          km_llegada: kmNumero,
          foto_guia_url: fotoUrl,
          motivo: motivoEdicion.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al corregir el punto')
        return
      }

      cerrarEdicion()
      setSuccess('Punto corregido')
      await cargarPuntos()

      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  async function confirmarAnulacion(e: React.FormEvent) {
    e.preventDefault()

    if (!anulando) return

    limpiarMensajes()

    if (!motivoAnulacion.trim()) {
      setError('El motivo de la anulación es obligatorio')
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/viajes/${viajeId}/puntos/${anulando.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoAnulacion.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al anular el punto')
        return
      }

      setAnulando(null)
      setMotivoAnulacion('')
      setSuccess('Punto anulado')
      await cargarPuntos()

      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl p-5 border space-y-4" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Puntos de la ruta</p>
          <p className="text-xs text-zinc-500 mt-0.5">Último odómetro: {ultimoKm.toLocaleString('es-CL')} km</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
          {puntos.length}
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-lg border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg border" style={{ background: '#0D2D1D', borderColor: '#0D5D3D' }}>
          <p className="text-xs text-emerald-400">{success}</p>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-zinc-500">Cargando puntos...</p>
      ) : puntos.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-3">Aún no hay puntos registrados</p>
      ) : (
        <div className="space-y-2">
          {puntos.map((punto) => (
            <div key={punto.id} className="rounded-lg p-3 border" style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-medium text-zinc-500 mt-0.5">{punto.orden}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-white truncate">{punto.nombre_punto}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        punto.tipo === 'retiro'
                          ? 'bg-sky-500/20 text-sky-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {punto.tipo}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {punto.km_llegada.toLocaleString('es-CL')} km
                    </p>
                  </div>
                </div>

                <a href={punto.foto_guia_url} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={punto.foto_guia_url} alt="Guía" className="w-12 h-12 rounded-lg object-cover" />
                </a>
              </div>

              <div className="flex gap-4 mt-3">
                <button
                  type="button"
                  onClick={() => abrirEdicion(punto)}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Corregir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    limpiarMensajes()
                    setAnulando(punto)
                    setMotivoAnulacion('')
                  }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Anular
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!soloEdicion && (
      <form onSubmit={agregarPunto} className="rounded-lg p-4 border space-y-3" style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nuevo punto</p>

        <div className="grid grid-cols-2 gap-3">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as 'retiro' | 'entrega')}
            className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
            style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
          >
            <option value="retiro">Retiro</option>
            <option value="entrega">Entrega</option>
          </select>

          <input
            type="number"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
            style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
            placeholder="Odómetro"
          />
        </div>

        <input
          type="text"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value)
            if (e.target.value.trim().length < 2) setSugerencias([])
          }}
          list="puntos-sugerencias"
          className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
          style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
          placeholder="Nombre del punto"
        />
        <datalist id="puntos-sugerencias">
          {sugerencias.map((sugerencia) => (
            <option key={sugerencia} value={sugerencia} />
          ))}
        </datalist>

        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFotoChange}
            className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
          />
          {fotoPreview && (
            <img src={fotoPreview} alt="Preview guía" className="mt-2 rounded-lg max-h-32 object-cover" />
          )}
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: '#10B981' }}
        >
          {saving ? (uploading ? 'Subiendo...' : 'Guardando...') : 'Agregar punto'}
        </button>
      </form>
      )}

      {soloEdicion && (
        <p className="text-xs text-zinc-500">Ruta cerrada: puedes corregir o anular puntos con motivo.</p>
      )}

      {editando && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <form
            onSubmit={guardarEdicion}
            className="w-full max-w-md rounded-xl p-5 border space-y-3"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <p className="text-sm font-medium text-white">Corregir punto {editando.orden}</p>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={editForm.tipo}
                onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value as 'retiro' | 'entrega' })}
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
                style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                <option value="retiro">Retiro</option>
                <option value="entrega">Entrega</option>
              </select>

              <input
                type="number"
                value={editForm.km_llegada}
                onChange={(e) => setEditForm({ ...editForm, km_llegada: e.target.value })}
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                placeholder="Odómetro"
              />
            </div>

            <input
              type="text"
              value={editForm.nombre_punto}
              onChange={(e) => setEditForm({ ...editForm, nombre_punto: e.target.value })}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
              placeholder="Nombre del punto"
            />

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Foto de guía</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleEditFotoChange}
                className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
              />
              {editFotoPreview && (
                <img src={editFotoPreview} alt="Preview guía" className="mt-2 rounded-lg max-h-24 object-cover" />
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Motivo de la corrección *</label>
              <textarea
                value={motivoEdicion}
                onChange={(e) => setMotivoEdicion(e.target.value)}
                rows={2}
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                placeholder="Explica qué se corrigió y por qué"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cerrarEdicion}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 border transition-colors"
                style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: '#10B981' }}
              >
                {saving ? (uploading ? 'Subiendo...' : 'Guardando...') : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {anulando && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <form
            onSubmit={confirmarAnulacion}
            className="w-full max-w-md rounded-xl p-5 border space-y-3"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <p className="text-sm font-medium text-white">Anular punto {anulando.orden}</p>
            <p className="text-xs text-zinc-500">{anulando.nombre_punto}</p>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Motivo de la anulación *</label>
              <textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                rows={3}
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                placeholder="Explica por qué se anula este punto"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setAnulando(null)
                  setMotivoAnulacion('')
                }}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 border transition-colors"
                style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: '#DC2626' }}
              >
                {saving ? 'Anulando...' : 'Anular'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
