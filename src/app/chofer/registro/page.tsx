'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Asignacion {
  id: string
  observaciones: string | null
  camiones: { id: string; patente: string; marca: string | null }
  servicios: {
    id: string
    nombre: string
    origen: string | null
    destino: string | null
    clientes: { nombre: string } | null
  } | null
}

interface Viaje {
  id: string
  fecha: string
  km_inicio: number
  km_termino: number | null
  foto_km_inicio: string | null
  foto_km_termino: string | null
  observaciones: string | null
  estado: string
  camiones: { id: string; patente: string; marca: string | null }
  servicios: {
    id: string
    nombre: string
    origen: string | null
    destino: string | null
    clientes: { nombre: string } | null
  } | null
  gastos: Gasto[]
}

interface Gasto {
  id: string
  tipo: string
  monto: number
  descripcion: string | null
  foto_url: string | null
}

interface GastoForm {
  tipo: 'combustible' | 'peaje' | 'comida' | 'mecanico' | 'otro'
  monto: string
  descripcion: string
  foto: File | null
  fotoPreview: string | null
  fotoUrl: string | null
}

export default function ChoferRegistro() {
  const router = useRouter()
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null)
  const [viajeActual, setViajeActual] = useState<Viaje | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })

  const [form, setForm] = useState({
    fecha: today,
    km_inicio: '',
    km_termino: '',
    observaciones: '',
    fotoKmInicio: null as File | null,
    fotoKmInicioPreview: null as string | null,
    fotoKmTermino: null as File | null,
    fotoKmTerminoPreview: null as string | null,
  })

  const [loadingFecha, setLoadingFecha] = useState(false)

  const [gastos, setGastos] = useState<GastoForm[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fechaParam = params.get('fecha')
    if (fechaParam) {
      onFechaChange(fechaParam)
    }
    fetchAsignaciones()
  }, [])

  async function fetchAsignaciones() {
    try {
      const [asigRes, viajeRes] = await Promise.all([
        fetch('/api/chofer/asignacion'),
        fetch('/api/viajes/hoy'),
      ])

      if (asigRes.ok) {
        const data = await asigRes.json()
        setAsignaciones(data)
        if (data && data.length > 0) {
          setAsignacion(data[0])
        }
      }

      if (viajeRes.ok) {
        const data = await viajeRes.json()
        if (data.viaje) {
          setViajeActual(data.viaje)
          setForm({
            fecha: data.viaje.fecha,
            km_inicio: String(data.viaje.km_inicio),
            km_termino: '',
            observaciones: data.viaje.observaciones || '',
            fotoKmInicio: null,
            fotoKmInicioPreview: data.viaje.foto_km_inicio,
            fotoKmTermino: null,
            fotoKmTerminoPreview: null,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  function selectAsignacion(asig: Asignacion) {
    setAsignacion(asig)
    setError('')
    setSuccess('')
  }

  async function onFechaChange(newFecha: string) {
    setForm({ ...form, fecha: newFecha })
    setLoadingFecha(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/viajes/fecha?fecha=${newFecha}`)
      if (res.ok) {
        const data = await res.json()
        if (data.viaje) {
          setViajeActual(data.viaje)
          setForm(prev => ({
            ...prev,
            fecha: newFecha,
            km_inicio: String(data.viaje.km_inicio),
            km_termino: '',
            observaciones: data.viaje.observaciones || '',
            fotoKmInicio: null,
            fotoKmInicioPreview: data.viaje.foto_km_inicio,
            fotoKmTermino: null,
            fotoKmTerminoPreview: data.viaje.foto_km_termino,
          }))
          setGastos([])
        } else {
          setViajeActual(null)
          setForm(prev => ({
            ...prev,
            fecha: newFecha,
            km_inicio: '',
            km_termino: '',
            observaciones: '',
            fotoKmInicio: null,
            fotoKmInicioPreview: null,
            fotoKmTermino: null,
            fotoKmTerminoPreview: null,
          }))
          setGastos([])
        }
      }
    } catch (error) {
      console.error('Error fetching viaje:', error)
    } finally {
      setLoadingFecha(false)
    }
  }

  function handleFileKmInicioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (form.fotoKmInicioPreview) {
        URL.revokeObjectURL(form.fotoKmInicioPreview)
      }
      setForm({
        ...form,
        fotoKmInicio: file,
        fotoKmInicioPreview: URL.createObjectURL(file),
      })
    }
  }

  function handleFileKmTerminoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (form.fotoKmTerminoPreview) {
        URL.revokeObjectURL(form.fotoKmTerminoPreview)
      }
      setForm({
        ...form,
        fotoKmTermino: file,
        fotoKmTerminoPreview: URL.createObjectURL(file),
      })
    }
  }

  async function uploadFoto(file: File, bucket: string = 'gastos'): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      return data.url
    }
    return null
  }

  async function iniciarDia(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!asignacion) {
      setError('Selecciona una asignación')
      return
    }

    if (!form.km_inicio) {
      setError('Ingresa el kilómetro de inicio')
      return
    }

    if (!form.fotoKmInicio && !form.fotoKmInicioPreview) {
      setError('Sube una foto del cuenta kilómetros')
      return
    }

    setSaving(true)

    try {
      let fotoUrl = form.fotoKmInicioPreview

      if (form.fotoKmInicio) {
        setUploading(true)
        fotoUrl = await uploadFoto(form.fotoKmInicio, 'km-fotos')
        setUploading(false)
        if (!fotoUrl) {
          setError('Error subiendo foto del cuenta km')
          setSaving(false)
          return
        }
      }

      const res = await fetch('/api/viajes/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camion_id: asignacion.camiones.id,
          servicio_id: asignacion.servicios?.id,
          fecha: form.fecha,
          km_inicio: parseInt(form.km_inicio),
          foto_km_inicio: fotoUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al iniciar el día')
        setSaving(false)
        return
      }

      const viaje = await res.json()
      setViajeActual(viaje)
      setSuccess('Día iniciado')

      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  function addGasto() {
    setGastos([...gastos, {
      tipo: 'combustible',
      monto: '',
      descripcion: '',
      foto: null,
      fotoPreview: null,
      fotoUrl: null,
    }])
  }

  function removeGasto(index: number) {
    const removed = gastos[index]
    if (removed.fotoPreview) {
      URL.revokeObjectURL(removed.fotoPreview)
    }
    setGastos(gastos.filter((_, i) => i !== index))
  }

  function updateGasto(index: number, field: keyof GastoForm, value: string | File | null) {
    const updated = [...gastos]

    if (field === 'foto' && value instanceof File) {
      if (updated[index].fotoPreview) {
        URL.revokeObjectURL(updated[index].fotoPreview)
      }
      updated[index] = {
        ...updated[index],
        foto: value,
        fotoPreview: URL.createObjectURL(value),
        fotoUrl: null,
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setGastos(updated)
  }

  async function terminarDia(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!viajeActual) {
      setError('No hay un viaje activo')
      return
    }

    if (!form.km_termino) {
      setError('Ingresa el kilómetro de término')
      return
    }

    const kmInicio = parseInt(form.km_inicio)
    const kmTermino = parseInt(form.km_termino)

    if (kmTermino < kmInicio) {
      setError('Km término debe ser mayor o igual a km inicio')
      return
    }

    setSaving(true)

    try {
      let fotoUrl = form.fotoKmTerminoPreview

      if (form.fotoKmTermino) {
        setUploading(true)
        fotoUrl = await uploadFoto(form.fotoKmTermino, 'km-fotos')
        setUploading(false)
        if (!fotoUrl) {
          setError('Error subiendo foto de respaldo')
          setSaving(false)
          return
        }
      }

      const gastosConFoto = await Promise.all(
        gastos
          .filter(g => g.monto)
          .map(async (g) => {
            let foto = g.fotoUrl
            if (g.foto && !g.fotoUrl) {
              setUploading(true)
              foto = await uploadFoto(g.foto, 'gastos')
              setUploading(false)
            }
            return {
              tipo: g.tipo,
              monto: parseInt(g.monto),
              descripcion: g.descripcion || null,
              foto_url: foto,
            }
          })
      )

      const res = await fetch(`/api/viajes/${viajeActual.id}/terminar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          km_termino: kmTermino,
          foto_km_termino: fotoUrl,
          observaciones: form.observaciones || null,
          gastos: gastosConFoto,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al terminar el día')
        setSaving(false)
        return
      }

      setSuccess('Día terminado')
      setGastos([])

      setTimeout(() => {
        router.push('/chofer/historial')
      }, 2000)
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
        <div className="max-w-lg mx-auto px-6 py-10">
          <p className="text-sm text-zinc-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (asignaciones.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="text-center py-16">
            <p className="text-sm text-zinc-500">Sin asignaciones activas</p>
            <p className="text-xs text-zinc-600 mt-1">Contacta al admin</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">
          {loadingFecha ? 'Cargando...' : (viajeActual ? 'Terminar Día' : 'Iniciar Día')}
        </h1>

        {error && (
          <div className="mb-5 p-4 rounded-xl border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-xl border" style={{ background: '#0D2D1D', borderColor: '#0D5D3D' }}>
            <p className="text-sm text-emerald-400">{success}</p>
          </div>
        )}

        {viajeActual ? (
          <form onSubmit={terminarDia} className="space-y-5">
            <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-400">Día en curso</p>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400">En proceso</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Km Inicio: <span className="font-medium text-white">{viajeActual.km_inicio.toLocaleString('es-CL')}</span></p>
                {viajeActual.gastos && viajeActual.gastos.length > 0 && (
                  <p className="text-sm text-zinc-400">{viajeActual.gastos.length} gasto(s)</p>
                )}
              </div>
            </div>

            <div className="rounded-xl p-5 border space-y-4" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Km Término</label>
                <input
                  type="number"
                  value={form.km_termino}
                  onChange={(e) => setForm({ ...form, km_termino: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3.5 text-white placeholder-zinc-500 transition-colors focus:outline-none"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  placeholder="Ej: 45250"
                  required
                />
                {form.km_termino && parseInt(form.km_termino) >= parseInt(form.km_inicio) && (
                  <p className="text-xs text-emerald-400 mt-2">+{parseInt(form.km_termino) - parseInt(form.km_inicio)} km</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Foto respaldo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileKmTerminoChange}
                  className="w-full text-sm text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 transition-colors"
                  required
                />
                {form.fotoKmTerminoPreview && (
                  <img src={form.fotoKmTerminoPreview} alt="Preview" className="mt-3 rounded-lg max-h-40 object-cover" />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:outline-none"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  placeholder="Notas..."
                />
              </div>
            </div>

            <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white">Gastos</p>
                <button
                  type="button"
                  onClick={addGasto}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  + Agregar
                </button>
              </div>

              {gastos.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-3">Sin gastos</p>
              )}

              {gastos.map((gasto, index) => (
                <div key={index} className="rounded-lg p-4 mb-3" style={{ background: '#1A1A1A' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-zinc-500">Gasto {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeGasto(index)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="space-y-3">
                    <select
                      value={gasto.tipo}
                      onChange={(e) => updateGasto(index, 'tipo', e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm text-white transition-colors focus:outline-none"
                      style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
                    >
                      <option value="combustible">Combustible</option>
                      <option value="peaje">Peaje</option>
                      <option value="comida">Comida</option>
                      <option value="mecanico">Mecánico</option>
                      <option value="otro">Otro</option>
                    </select>
                    <input
                      type="number"
                      value={gasto.monto}
                      onChange={(e) => updateGasto(index, 'monto', e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:outline-none"
                      style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
                      placeholder="Monto CLP"
                    />
                    <input
                      type="text"
                      value={gasto.descripcion}
                      onChange={(e) => updateGasto(index, 'descripcion', e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:outline-none"
                      style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
                      placeholder="Descripción"
                    />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => updateGasto(index, 'foto', e.target.files?.[0] || null)}
                      className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
                    />
                    {gasto.fotoPreview && (
                      <img src={gasto.fotoPreview} alt="Preview" className="mt-2 rounded-lg max-h-24 object-cover" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-xl px-4 py-3.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: '#10B981' }}
            >
              {saving ? (uploading ? 'Subiendo...' : 'Guardando...') : 'Terminar Día'}
            </button>
          </form>
        ) : (
          <form onSubmit={iniciarDia} className="space-y-5">
            <div className="mb-5">
              <input
                type="date"
                value={form.fecha}
                max={today}
                onChange={(e) => onFechaChange(e.target.value)}
                className="rounded-lg border px-4 py-3 text-white transition-colors focus:outline-none"
                style={{ background: '#141414', borderColor: '#2A2A2A' }}
              />
            </div>

            {asignaciones.length > 1 && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide">Selecciona asignación</label>
                {asignaciones.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectAsignacion(a)}
                    className={`w-full p-4 rounded-xl border text-left transition-colors ${
                      asignacion?.id === a.id
                        ? 'border-emerald-500/50'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    style={{ background: asignacion?.id === a.id ? '#1A2D2A' : '#141414' }}
                  >
                    <p className="text-sm font-medium text-white">{a.camiones.patente}</p>
                    {a.servicios && (
                      <p className="text-xs text-zinc-500 mt-0.5">{a.servicios.nombre}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {asignacion && (
              <div className="rounded-xl p-5 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <p className="text-sm font-medium text-white">{asignacion.camiones.patente}</p>
                {asignacion.camiones.marca && (
                  <p className="text-xs text-zinc-500">{asignacion.camiones.marca}</p>
                )}
                {asignacion.servicios && (
                  <p className="text-xs text-zinc-500 mt-1">{asignacion.servicios.nombre}</p>
                )}
              </div>
            )}

            <div className="rounded-xl p-5 border space-y-4" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Km Inicio</label>
                <input
                  type="number"
                  value={form.km_inicio}
                  onChange={(e) => setForm({ ...form, km_inicio: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3.5 text-white placeholder-zinc-500 transition-colors focus:outline-none"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  placeholder="Ej: 45000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Foto cuenta km</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileKmInicioChange}
                  className="w-full text-sm text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 transition-colors"
                  required
                />
                {form.fotoKmInicioPreview && (
                  <img src={form.fotoKmInicioPreview} alt="Preview" className="mt-3 rounded-lg max-h-40 object-cover" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-xl px-4 py-3.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: '#10B981' }}
            >
              {saving ? (uploading ? 'Subiendo...' : 'Guardando...') : 'Iniciar Día'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
