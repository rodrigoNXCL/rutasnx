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
      setSuccess('Día iniciado. Recuerda terminar el día al finalizar.')

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

      setSuccess('Día terminado exitosamente')
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
    return <div className="text-slate-600">Cargando...</div>
  }

  if (asignaciones.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sin asignaciones activas</h2>
        <p className="text-slate-500">Contacta al admin para que te asigne a un servicio.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-slate-900">
        {loadingFecha ? 'Cargando...' : (viajeActual ? 'Terminar Día' : 'Iniciar Día')}
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {viajeActual ? (
        <form onSubmit={terminarDia} className="space-y-6">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-800">Día en curso</span>
              <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded">En proceso</span>
            </div>
            <p className="text-sm text-emerald-700">
              <span className="font-medium">Km Inicio:</span> {viajeActual.km_inicio}
            </p>
            {viajeActual.foto_km_inicio && (
              <p className="text-sm text-emerald-700 mt-1">
                <span className="font-medium">Foto km inicio:</span>{' '}
                <a href={viajeActual.foto_km_inicio} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">
                  Ver foto
                </a>
              </p>
            )}
            {viajeActual.gastos && viajeActual.gastos.length > 0 && (
              <p className="text-sm text-emerald-700 mt-1">
                <span className="font-medium">Gastos registrados:</span> {viajeActual.gastos.length}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Kilómetro de Término</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Km Término *</label>
              <input
                type="number"
                value={form.km_termino}
                onChange={(e) => setForm({ ...form, km_termino: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                placeholder="Ej: 45250"
                required
              />
            </div>

            {form.km_termino && parseInt(form.km_termino) >= parseInt(form.km_inicio) && (
              <p className="mb-4 text-sm font-medium text-emerald-600">
                Recorrido: +{parseInt(form.km_termino) - parseInt(form.km_inicio)} km
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Foto de respaldo (cuenta km) *
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileKmTerminoChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                required
              />
              {form.fotoKmTerminoPreview && (
                <img
                  src={form.fotoKmTerminoPreview}
                  alt="Preview"
                  className="mt-2 rounded-lg max-h-40 object-cover"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Gastos del día</h2>
              <button
                type="button"
                onClick={addGasto}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                + Agregar
              </button>
            </div>

            {gastos.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                Sin gastos registrados. Puedes agregar antes de terminar.
              </p>
            )}

            {gastos.map((gasto, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Gasto {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeGasto(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="space-y-2">
                  <select
                    value={gasto.tipo}
                    onChange={(e) => updateGasto(index, 'tipo', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
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
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                    placeholder="Monto CLP"
                  />
                  <input
                    type="text"
                    value={gasto.descripcion}
                    onChange={(e) => updateGasto(index, 'descripcion', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                    placeholder="Descripción (opcional)"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Foto comprobante
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => updateGasto(index, 'foto', e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    {gasto.fotoPreview && (
                      <img
                        src={gasto.fotoPreview}
                        alt="Preview"
                        className="mt-2 rounded-lg max-h-32 object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? (uploading ? 'Subiendo fotos...' : 'Guardando...') : 'Terminar Día'}
          </button>
        </form>
      ) : (
        <form onSubmit={iniciarDia} className="space-y-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input
              type="date"
              value={form.fecha}
              max={today}
              onChange={(e) => onFechaChange(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 max-w-xs"
            />
          </div>

          {asignaciones.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Selecciona asignación:</label>
              <div className="grid gap-2">
                {asignaciones.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectAsignacion(a)}
                    className={`p-3 rounded-lg border text-left transition ${
                      asignacion?.id === a.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="font-medium text-slate-900">
                      {a.camiones.patente} - {a.servicios?.nombre || 'Sin servicio'}
                    </div>
                    {a.servicios?.clientes && (
                      <div className="text-sm text-slate-500">{a.servicios.clientes.nombre}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {asignacion && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 mb-6">
              <p className="text-sm text-emerald-700">
                <span className="font-medium">Camión:</span> {asignacion.camiones.patente}
                {asignacion.camiones.marca && ` - ${asignacion.camiones.marca}`}
              </p>
              {asignacion.servicios && (
                <>
                  <p className="text-sm text-emerald-700">
                    <span className="font-medium">Servicio:</span> {asignacion.servicios.nombre}
                  </p>
                  {asignacion.servicios.clientes && (
                    <p className="text-sm text-emerald-600">
                      <span className="font-medium">Cliente:</span> {asignacion.servicios.clientes.nombre}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Kilómetro de Inicio</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Km Inicio *</label>
              <input
                type="number"
                value={form.km_inicio}
                onChange={(e) => setForm({ ...form, km_inicio: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                placeholder="Ej: 45000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Foto del cuenta kilómetros *
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileKmInicioChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                required
              />
              {form.fotoKmInicioPreview && (
                <img
                  src={form.fotoKmInicioPreview}
                  alt="Preview"
                  className="mt-2 rounded-lg max-h-40 object-cover"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? (uploading ? 'Subiendo foto...' : 'Guardando...') : 'Iniciar Día'}
          </button>
        </form>
      )}
    </div>
  )
}
