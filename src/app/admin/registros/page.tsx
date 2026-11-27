'use client'

import { useEffect, useMemo, useState } from 'react'
import PuntosRuta from '@/app/chofer/registro/PuntosRuta'

interface Chofer {
  id: string
  nombre: string
}

interface Camion {
  id: string
  patente: string
  marca: string | null
  modelo: string | null
}

interface TipoServicio {
  id: string
  codigo: string
  nombre: string
  flujo: 'simple' | 'puntos'
}

interface Servicio {
  id: string
  nombre: string
  cliente_id: string
  tipo_servicio_id: string | null
  clientes: { id: string; nombre: string } | null
  tipos_servicio: TipoServicio | null
}

interface Gasto {
  id: string
  tipo: string
  monto: number
  descripcion: string | null
  foto_url: string | null
}

interface Viaje {
  id: string
  fecha: string
  km_inicio: number
  km_termino: number | null
  estado: 'en_curso' | 'terminado'
  iniciado_at: string
  cerrado_at: string | null
  cliente_id: string | null
  tipo_servicio_id: string | null
  observaciones: string | null
  camiones: { id: string; patente: string; marca: string | null } | null
  servicios: { id: string; nombre: string; clientes: { nombre: string } | null } | null
  tipos_servicio: TipoServicio | null
  gastos: Gasto[]
  puntos_count: number
}

interface RespuestaRegistros {
  choferes: Chofer[]
  camiones: Camion[]
  servicios: Servicio[]
  viajes: Viaje[]
}

const TIPOS_GASTO = [
  { value: 'combustible', label: 'Combustible' },
  { value: 'peaje', label: 'Peaje' },
  { value: 'comida', label: 'Comida' },
  { value: 'mecanico', label: 'Mecánico' },
  { value: 'otro', label: 'Otro' },
] as const

type TipoGasto = (typeof TIPOS_GASTO)[number]['value']

function hoyChile(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}

function formatFecha(value: string): string {
  return new Date(value + 'T00:00:00').toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
  })
}

function formatMonto(monto: number): string {
  return '$' + monto.toLocaleString('es-CL')
}

async function subirArchivo(file: File, bucket: string): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', bucket)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) return null

  const data = await res.json().catch(() => ({}))
  return data.url || null
}

export default function AdminRegistros() {
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [choferId, setChoferId] = useState('')
  const [fecha, setFecha] = useState(hoyChile())
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [camionId, setCamionId] = useState('')
  const [servicioId, setServicioId] = useState('')
  const [kmInicio, setKmInicio] = useState('')
  const [fotoInicio, setFotoInicio] = useState<File | null>(null)
  const [previewInicio, setPreviewInicio] = useState<string | null>(null)
  const [iniciando, setIniciando] = useState(false)

  const [seleccionada, setSeleccionada] = useState<Viaje | null>(null)
  const [kmTermino, setKmTermino] = useState('')
  const [fotoTermino, setFotoTermino] = useState<File | null>(null)
  const [previewTermino, setPreviewTermino] = useState<string | null>(null)
  const [obsCierre, setObsCierre] = useState('')
  const [cerrando, setCerrando] = useState(false)

  async function cargar(id: string, f: string) {
    try {
      const params = new URLSearchParams()
      if (id) params.set('chofer_id', id)
      if (f) params.set('fecha', f)

      const res = await fetch(`/api/admin/registros?${params.toString()}`)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error cargando registros')
        return null
      }

      const data = (await res.json()) as RespuestaRegistros

      setChoferes(data.choferes || [])
      setCamiones(data.camiones || [])
      setServicios(data.servicios || [])

      if (!id) {
        setViajes([])
        setSeleccionada(null)
        return [] as Viaje[]
      }

      const lista = data.viajes || []
      setViajes(lista)
      setSeleccionada((actual) =>
        actual ? lista.find((viaje) => viaje.id === actual.id) || null : null
      )

      return lista
    } catch {
      setError('Error de conexión')
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar(choferId, fecha)
  }, [choferId, fecha])

  const rutaExistente = useMemo(() => {
    if (!camionId) return null

    return (
      viajes.find(
        (viaje) =>
          viaje.estado === 'en_curso' &&
          viaje.camiones?.id === camionId &&
          (viaje.servicios?.id || '') === servicioId
      ) || null
    )
  }, [viajes, camionId, servicioId])

  function cambiarChofer(id: string) {
    setChoferId(id)
    setSeleccionada(null)
    setCamionId('')
    setServicioId('')
    setError('')
    setSuccess('')
    setLoading(true)
  }

  function cambiarFecha(value: string) {
    setFecha(value)
    setSeleccionada(null)
    setError('')
    setSuccess('')
    setLoading(true)
  }

  function limpiarNuevaRuta() {
    setKmInicio('')
    setFotoInicio(null)
    if (previewInicio) URL.revokeObjectURL(previewInicio)
    setPreviewInicio(null)
  }

  function cambiarFotoInicio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (previewInicio) URL.revokeObjectURL(previewInicio)
    setFotoInicio(file)
    setPreviewInicio(file ? URL.createObjectURL(file) : null)
  }

  function cambiarFotoTermino(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (previewTermino) URL.revokeObjectURL(previewTermino)
    setFotoTermino(file)
    setPreviewTermino(file ? URL.createObjectURL(file) : null)
  }

  function abrirViaje(viaje: Viaje) {
    setSeleccionada(viaje)
    setKmTermino(viaje.km_termino != null ? String(viaje.km_termino) : '')
    setObsCierre(viaje.observaciones || '')
    setFotoTermino(null)
    if (previewTermino) URL.revokeObjectURL(previewTermino)
    setPreviewTermino(null)
    setError('')
    setSuccess('')
  }

  function cerrarModal() {
    setSeleccionada(null)
    setFotoTermino(null)
    if (previewTermino) URL.revokeObjectURL(previewTermino)
    setPreviewTermino(null)
  }

  async function iniciarRuta(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!choferId) {
      setError('Selecciona un chófer')
      return
    }

    if (!camionId) {
      setError('Selecciona un camión')
      return
    }

    const km = parseInt(kmInicio)

    if (!Number.isInteger(km) || km < 0) {
      setError('Odómetro inicial inválido')
      return
    }

    if (rutaExistente) {
      setError('Ya existe una ruta para este camión y servicio en la fecha seleccionada.')
      return
    }

    setIniciando(true)

    try {
      let fotoUrl: string | null = null

      if (fotoInicio) {
        fotoUrl = await subirArchivo(fotoInicio, 'km-fotos')

        if (!fotoUrl) {
          setError('Error subiendo la foto del odómetro')
          return
        }
      }

      const res = await fetch('/api/viajes/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          chofer_id: choferId,
          camion_id: camionId,
          servicio_id: servicioId || undefined,
          fecha,
          km_inicio: km,
          foto_km_inicio: fotoUrl,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Error al iniciar la ruta')
        return
      }

      limpiarNuevaRuta()
      setSuccess('Ruta iniciada')
      const lista = await cargar(choferId, fecha)
      const nueva = lista?.find((viaje) => viaje.id === data.id) || null
      if (nueva) abrirViaje(nueva)

      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setError('Error de conexión')
    } finally {
      setIniciando(false)
    }
  }

  async function terminarRuta(e: React.FormEvent) {
    e.preventDefault()

    if (!seleccionada) return

    setError('')
    setSuccess('')

    const km = parseInt(kmTermino)

    if (!Number.isInteger(km) || km < seleccionada.km_inicio) {
      setError('Km término debe ser mayor o igual a km inicio')
      return
    }

    setCerrando(true)

    try {
      let fotoUrl: string | null = null

      if (fotoTermino) {
        fotoUrl = await subirArchivo(fotoTermino, 'km-fotos')

        if (!fotoUrl) {
          setError('Error subiendo la foto de término')
          return
        }
      }

      const res = await fetch(`/api/viajes/${seleccionada.id}/terminar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          km_termino: km,
          foto_km_termino: fotoUrl,
          observaciones: obsCierre || null,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Error al cerrar la ruta')
        return
      }

      cerrarModal()
      setSuccess('Ruta cerrada')
      await cargar(choferId, fecha)
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setError('Error de conexión')
    } finally {
      setCerrando(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Registros</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Inicia, completa y cierra rutas en nombre de un chófer.
        </p>
      </div>

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

      <div
        className="rounded-xl p-4 border mb-6"
        style={{ background: '#141414', borderColor: '#2A2A2A' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Chófer</label>
            <select
              value={choferId}
              onChange={(e) => cambiarChofer(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
            >
              <option value="">Selecciona un chófer</option>
              {choferes.map((chofer) => (
                <option key={chofer.id} value={chofer.id}>
                  {chofer.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              max={hoyChile()}
              onChange={(e) => cambiarFecha(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
            />
          </div>
        </div>

        {!loading && choferes.length === 0 && (
          <p className="text-xs text-zinc-500 mt-3">
            No tienes chóferes autorizados para tus camiones.
          </p>
        )}
      </div>

      {!choferId ? (
        <div className="text-center py-12">
          <p className="text-sm text-zinc-500">
            Selecciona un chófer para ver o registrar sus rutas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-white">Rutas del día</h2>
              {loading && <span className="text-xs text-zinc-500">Cargando...</span>}
            </div>

            {!loading && viajes.length === 0 ? (
              <div
                className="rounded-xl p-4 border text-center"
                style={{ background: '#141414', borderColor: '#2A2A2A' }}
              >
                <p className="text-sm text-zinc-500">
                  Sin rutas registradas para esta fecha.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {viajes.map((viaje) => (
                  <div
                    key={viaje.id}
                    className="rounded-xl p-4 border"
                    style={{ background: '#141414', borderColor: '#2A2A2A' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-white">
                            {viaje.camiones?.patente || 'Sin camión'}
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              viaje.estado === 'en_curso'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            {viaje.estado === 'en_curso' ? 'En curso' : 'Terminada'}
                          </span>
                          {viaje.tipos_servicio && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                              {viaje.tipos_servicio.nombre}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 truncate">
                          {viaje.servicios?.nombre || 'Sin servicio'}
                          {viaje.servicios?.clientes?.nombre
                            ? ` · ${viaje.servicios.clientes.nombre}`
                            : ''}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {viaje.km_inicio.toLocaleString('es-CL')} →{' '}
                          {viaje.km_termino != null
                            ? viaje.km_termino.toLocaleString('es-CL')
                            : '...'}{' '}
                          · {viaje.puntos_count} punto(s) · {viaje.gastos.length} gasto(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => abrirViaje(viaje)}
                        className="text-xs text-white px-3 py-2 rounded-lg border transition-colors hover:bg-zinc-800"
                        style={{ borderColor: '#2A2A2A' }}
                      >
                        Gestionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={iniciarRuta}
            className="rounded-xl p-4 border space-y-3"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <div>
              <p className="text-sm font-medium text-white">Nueva ruta</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Para registrar datos atrasados del chófer.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Camión</label>
                <select
                  value={camionId}
                  onChange={(e) => setCamionId(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                >
                  <option value="">Selecciona un camión</option>
                  {camiones.map((camion) => (
                    <option key={camion.id} value={camion.id}>
                      {camion.patente}
                      {camion.marca ? ` · ${camion.marca}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Servicio</label>
                <select
                  value={servicioId}
                  onChange={(e) => setServicioId(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                >
                  <option value="">Sin servicio</option>
                  {servicios.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre}
                      {servicio.tipos_servicio ? ` · ${servicio.tipos_servicio.nombre}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {rutaExistente && (
              <div
                className="p-3 rounded-lg border"
                style={{ background: '#2D2515', borderColor: '#5D4A20' }}
              >
                <p className="text-xs text-amber-400">
                  Ya existe una ruta abierta para este camión y servicio. Gestiona o
                  cierra esa ruta antes de iniciar otra.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Km inicio</label>
                <input
                  type="number"
                  value={kmInicio}
                  onChange={(e) => setKmInicio(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                  style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                  placeholder="Ej: 45000"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Foto odómetro (opcional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={cambiarFotoInicio}
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
                />
                {previewInicio && (
                  <img
                    src={previewInicio}
                    alt="Preview odómetro inicio"
                    className="mt-2 rounded-lg max-h-32 object-cover"
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={iniciando || Boolean(rutaExistente)}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: '#10B981' }}
            >
              {iniciando ? 'Iniciando...' : 'Iniciar ruta'}
            </button>
          </form>
        </div>
      )}

      {seleccionada && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 py-6"
          onClick={cerrarModal}
        >
          <div
            className="rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border"
            style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 z-10 flex items-start justify-between gap-4 px-5 py-4 border-b"
              style={{ background: '#0D0D0D', borderColor: '#2A2A2A' }}
            >
              <div>
                <p className="text-sm font-medium text-white">
                  Ruta {formatFecha(seleccionada.fecha)} ·{' '}
                  {seleccionada.camiones?.patente || 'Sin camión'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {seleccionada.servicios?.nombre || 'Sin servicio'}
                  {seleccionada.tipos_servicio
                    ? ` · ${seleccionada.tipos_servicio.nombre}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                Cerrar
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div
                className="rounded-xl p-4 border"
                style={{ background: '#141414', borderColor: '#2A2A2A' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white">
                    {seleccionada.km_inicio.toLocaleString('es-CL')} →{' '}
                    {seleccionada.km_termino != null
                      ? seleccionada.km_termino.toLocaleString('es-CL')
                      : '...'}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      seleccionada.estado === 'en_curso'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {seleccionada.estado === 'en_curso' ? 'En curso' : 'Terminada'}
                  </span>
                </div>
                {seleccionada.observaciones && (
                  <p className="text-xs text-zinc-500 mt-2">
                    {seleccionada.observaciones}
                  </p>
                )}
                {seleccionada.estado === 'terminado' && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Ruta cerrada: puedes agregar, corregir o anular puntos y gastos
                    para completar el registro.
                  </p>
                )}
              </div>

              {seleccionada.tipos_servicio?.flujo === 'puntos' && (
                <PuntosRuta
                  key={seleccionada.id}
                  viajeId={seleccionada.id}
                  clienteId={seleccionada.cliente_id}
                  kmInicio={seleccionada.km_inicio}
                />
              )}

              <GastosViaje
                key={`gastos-${seleccionada.id}`}
                viajeId={seleccionada.id}
                gastos={seleccionada.gastos}
                onChanged={() => cargar(choferId, fecha)}
              />

              {seleccionada.estado === 'en_curso' && (
                <form
                  onSubmit={terminarRuta}
                  className="rounded-xl p-4 border space-y-3"
                  style={{ background: '#141414', borderColor: '#2A2A2A' }}
                >
                  <p className="text-sm font-medium text-white">Cerrar ruta</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Km término</label>
                      <input
                        type="number"
                        value={kmTermino}
                        onChange={(e) => setKmTermino(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                        style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                        placeholder="Ej: 45250"
                      />
                      {kmTermino &&
                        parseInt(kmTermino) >= seleccionada.km_inicio && (
                          <p className="text-xs text-emerald-400 mt-1">
                            +{parseInt(kmTermino) - seleccionada.km_inicio} km
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Foto odómetro final (opcional)
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={cambiarFotoTermino}
                        className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
                      />
                      {previewTermino && (
                        <img
                          src={previewTermino}
                          alt="Preview odómetro término"
                          className="mt-2 rounded-lg max-h-32 object-cover"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Observaciones</label>
                    <textarea
                      value={obsCierre}
                      onChange={(e) => setObsCierre(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                      style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
                      placeholder="Notas del cierre"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={cerrando}
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ background: '#10B981' }}
                  >
                    {cerrando ? 'Cerrando...' : 'Cerrar ruta'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GastosViaje({
  viajeId,
  gastos,
  onChanged,
}: {
  viajeId: string
  gastos: Gasto[]
  onChanged: () => Promise<Viaje[] | null>
}) {
  const [tipo, setTipo] = useState<TipoGasto>('combustible')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const valor = parseInt(monto)

    if (!Number.isInteger(valor) || valor <= 0) {
      setError('Ingresa un monto válido')
      return
    }

    setGuardando(true)

    try {
      let fotoUrl: string | null = null

      if (foto) {
        fotoUrl = await subirArchivo(foto, 'gastos')

        if (!fotoUrl) {
          setError('Error subiendo la foto del gasto')
          return
        }
      }

      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viaje_id: viajeId,
          tipo,
          monto: valor,
          descripcion: descripcion || null,
          foto_url: fotoUrl,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Error guardando el gasto')
        return
      }

      setMonto('')
      setDescripcion('')
      setFoto(null)
      await onChanged()
    } catch {
      setError('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: string) {
    setError('')

    try {
      const res = await fetch(`/api/gastos/${id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error eliminando el gasto')
        return
      }

      await onChanged()
    } catch {
      setError('Error de conexión')
    }
  }

  return (
    <div
      className="rounded-xl p-4 border space-y-3"
      style={{ background: '#141414', borderColor: '#2A2A2A' }}
    >
      <p className="text-sm font-medium text-white">Gastos</p>

      {error && (
        <div className="p-3 rounded-lg border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {gastos.length === 0 ? (
        <p className="text-xs text-zinc-500">Sin gastos registrados.</p>
      ) : (
        <div className="space-y-2">
          {gastos.map((gasto) => (
            <div
              key={gasto.id}
              className="flex items-start justify-between gap-3 rounded-lg p-3"
              style={{ background: '#1A1A1A' }}
            >
              <div className="min-w-0">
                <p className="text-sm text-white">
                  {TIPOS_GASTO.find((t) => t.value === gasto.tipo)?.label || gasto.tipo} ·{' '}
                  {formatMonto(gasto.monto)}
                </p>
                {gasto.descripcion && (
                  <p className="text-xs text-zinc-500 mt-0.5">{gasto.descripcion}</p>
                )}
                {gasto.foto_url && (
                  <a
                    href={gasto.foto_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    Ver comprobante
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => eliminar(gasto.id)}
                className="text-xs text-red-400 hover:text-red-300 shrink-0"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={agregar} className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoGasto)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
            style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
          >
            {TIPOS_GASTO.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
            style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
            placeholder="Monto CLP"
          />
        </div>

        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
          style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}
          placeholder="Descripción (opcional)"
        />

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFoto(e.target.files?.[0] || null)}
          className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
        />

        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: '#10B981' }}
        >
          {guardando ? 'Guardando...' : 'Agregar gasto'}
        </button>
      </form>
    </div>
  )
}
