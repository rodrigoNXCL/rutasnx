'use client'

import { useState, useEffect, useRef } from 'react'
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

interface GastoForm {
  tipo: 'combustible' | 'peaje' | 'comida' | 'mecanico' | 'otro'
  monto: string
  descripcion: string
  foto: File | null
  fotoPreview: string | null
}

export default function ChoferRegistro() {
  const router = useRouter()
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null)
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
  })

  const [gastos, setGastos] = useState<GastoForm[]>([])

  useEffect(() => {
    fetchAsignaciones()
  }, [])

  async function fetchAsignaciones() {
    try {
      const res = await fetch('/api/chofer/asignacion')
      if (res.ok) {
        const data = await res.json()
        setAsignaciones(data)
        if (data && data.length > 0) {
          setAsignacion(data[0])
          setForm({
            km_inicio: '',
            km_termino: '',
            observaciones: data[0].observaciones || '',
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
    setForm({
      km_inicio: '',
      km_termino: '',
      observaciones: asig.observaciones || '',
    })
    setError('')
    setSuccess('')
  }

  function addGasto() {
    setGastos([...gastos, {
      tipo: 'combustible',
      monto: '',
      descripcion: '',
      foto: null,
      fotoPreview: null
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
        fotoPreview: URL.createObjectURL(value)
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setGastos(updated)
  }

  async function uploadFoto(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!asignacion) {
      setError('Selecciona una asignación')
      return
    }

    if (!form.km_inicio || !form.km_termino) {
      setError('Completa los kilómetros')
      return
    }

    for (const gasto of gastos) {
      if (gasto.monto && !gasto.foto) {
        setError(`Gasto tipo "${gasto.tipo}" requiere foto del comprobante`)
        return
      }
    }

    const kmInicio = parseInt(form.km_inicio)
    const kmTermino = parseInt(form.km_termino)

    if (kmTermino < kmInicio) {
      setError('Km término debe ser mayor o igual a km inicio')
      return
    }

    setSaving(true)

    try {
      const viajeRes = await fetch('/api/viajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camion_id: asignacion.camiones.id,
          servicio_id: asignacion.servicios?.id,
          fecha: form.fecha,
          km_inicio: kmInicio,
          km_termino: kmTermino,
          observaciones: form.observaciones || null,
        }),
      })

      if (!viajeRes.ok) {
        const data = await viajeRes.json()
        setError(data.error || 'Error al guardar')
        setSaving(false)
        return
      }

      const viaje = await viajeRes.json()

      for (const gasto of gastos) {
        if (!gasto.monto) continue

        setUploading(true)
        const fotoUrl = await uploadFoto(gasto.foto!)
        setUploading(false)

        if (!fotoUrl) {
          setError(`Error subiendo foto para gasto tipo "${gasto.tipo}"`)
          setSaving(false)
          return
        }

        await fetch('/api/gastos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viaje_id: viaje.id,
            tipo: gasto.tipo,
            monto: parseInt(gasto.monto),
            descripcion: gasto.descripcion || null,
            foto_url: fotoUrl,
          }),
        })
      }

      setSuccess('Viaje registrado exitosamente')
      setForm({ km_inicio: '', km_termino: '', observaciones: '' })
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

  function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount)
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
      <h1 className="text-xl font-bold mb-4 text-slate-900">Registrar Viaje</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha del viaje</label>
        <input
          type="date"
          value={form.fecha}
          max={today}
          onChange={(e) => setForm({ ...form, fecha: e.target.value })}
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
        <>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-800">Asignación activa</span>
            </div>
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
                {asignacion.servicios.origen && asignacion.servicios.destino && (
                  <p className="text-sm text-emerald-600">
                    <span className="font-medium">Trayecto:</span> {asignacion.servicios.origen} → {asignacion.servicios.destino}
                  </p>
                )}
              </>
            )}
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Kilómetros</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
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
              </div>

              {form.km_inicio && form.km_termino && parseInt(form.km_termino) >= parseInt(form.km_inicio) && (
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  Recorrido: +{parseInt(form.km_termino) - parseInt(form.km_inicio)} km
                </p>
              )}

              <div className="mt-4">
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
                <h2 className="text-sm font-semibold text-slate-700">Gastos</h2>
                <button
                  type="button"
                  onClick={addGasto}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + Agregar
                </button>
              </div>

              {gastos.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Sin gastos registrados</p>
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
                        Foto comprobante *
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => updateGasto(index, 'foto', e.target.files?.[0] || null)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        required
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
              {saving ? (uploading ? 'Subiendo fotos...' : 'Guardando...') : 'Registrar Viaje'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
