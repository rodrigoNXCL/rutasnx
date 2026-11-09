'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  archivosDePuntoOffline,
  eliminarPuntoOffline,
  guardarPuntoOffline,
  listarPuntosOffline,
  type PuntoOffline,
} from '@/lib/offline-queue'
import {
  MAX_ARCHIVOS_PUNTO,
  archivoDesdeFile,
  archivosDesdePunto,
  esImagen,
  imagenPrincipal,
  validarArchivoLocal,
  validarArchivosPunto,
} from '@/lib/archivos-punto'
import type { ArchivoPunto } from '@/types/database'

interface Punto {
  id: string
  orden: number
  tipo: 'retiro' | 'entrega'
  nombre_punto: string
  km_llegada: number
  foto_guia_url: string
  archivos: ArchivoPunto[]
  captured_at: string
  pendiente?: boolean
}

interface ArchivoLocal {
  file: File
  previewUrl: string
}

const PUNTOS_CACHE_PREFIX = 'rutasnx:puntos:'
const UPLOAD_TIMEOUT_MS = 8000

function leerPuntosCache(viajeId: string): Punto[] {
  try {
    const raw = localStorage.getItem(`${PUNTOS_CACHE_PREFIX}${viajeId}`)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return (data as Punto[]).map((punto) => ({
      ...punto,
      archivos: archivosDesdePunto(punto),
    }))
  } catch {
    return []
  }
}

function guardarPuntosCache(viajeId: string, puntos: Punto[]): void {
  try {
    localStorage.setItem(`${PUNTOS_CACHE_PREFIX}${viajeId}`, JSON.stringify(puntos))
  } catch {
    // localStorage no disponible o lleno
  }
}

interface NetworkInformationLike {
  effectiveType?: string
  rtt?: number
  downlink?: number
  saveData?: boolean
}

function conexionLenta(): boolean {
  if (typeof navigator === 'undefined') return false
  if (!navigator.onLine) return true

  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  if (!connection) return false

  if (connection.saveData) return true
  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') return true
  if (typeof connection.rtt === 'number' && connection.rtt > 1500) return true
  if (typeof connection.downlink === 'number' && connection.downlink > 0 && connection.downlink < 0.5) return true

  return false
}

function suscribirConexion(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)

  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function leerConexion() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

function leerConexionServidor() {
  return true
}

function useOnline(): boolean {
  return useSyncExternalStore(suscribirConexion, leerConexion, leerConexionServidor)
}

async function fetchConTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  ms = UPLOAD_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
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
}

export default function PuntosRuta({ viajeId, clienteId, kmInicio, soloEdicion = false }: PuntosRutaProps) {
  const [puntos, setPuntos] = useState<Punto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [syncError, setSyncError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendientes, setPendientes] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)
  const online = useOnline()

  const [tipo, setTipo] = useState<'retiro' | 'entrega'>('entrega')
  const [nombre, setNombre] = useState('')
  const [km, setKm] = useState('')
  const [archivos, setArchivos] = useState<ArchivoLocal[]>([])
  const [sugerencias, setSugerencias] = useState<string[]>([])

  const [editando, setEditando] = useState<Punto | null>(null)
  const [editForm, setEditForm] = useState<EdicionForm>({
    tipo: 'entrega',
    nombre_punto: '',
    km_llegada: '',
  })
  const [editArchivos, setEditArchivos] = useState<ArchivoPunto[]>([])
  const [editNuevos, setEditNuevos] = useState<ArchivoLocal[]>([])
  const [motivoEdicion, setMotivoEdicion] = useState('')

  const [anulando, setAnulando] = useState<Punto | null>(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

  const previewsPendientes = useRef<string[]>([])
  const cargandoRef = useRef(false)
  const recargarRef = useRef(false)
  const sincronizandoRef = useRef(false)
  const resincronizarRef = useRef(false)

  const ultimoKm = puntos.length > 0 ? puntos[puntos.length - 1].km_llegada : kmInicio

  function tomarPreviewsPendientes() {
    const previas = previewsPendientes.current
    previewsPendientes.current = []
    return previas
  }

  async function cargarPuntos() {
    if (cargandoRef.current) {
      recargarRef.current = true
      return
    }

    cargandoRef.current = true
    const previewsAnteriores = tomarPreviewsPendientes()
    let puntosServidor: Punto[] = []
    let puntosPendientes: Punto[] = []

    try {
      try {
        const res = await fetchConTimeout(`/api/viajes/${viajeId}/puntos`, {}, 5000)
        if (res.ok) {
          const data = await res.json()
          puntosServidor = (data.puntos || []).map((punto: Punto) => ({
            ...punto,
            archivos: archivosDesdePunto(punto),
          }))
          guardarPuntosCache(viajeId, puntosServidor)
        } else {
          puntosServidor = leerPuntosCache(viajeId)
        }
      } catch (err) {
        console.error('Error cargando puntos:', err)
        puntosServidor = leerPuntosCache(viajeId)
      }

      try {
        const pendientesLocales = await listarPuntosOffline()
        const idsServidor = new Set(puntosServidor.map((punto) => punto.id))
        const ultimoOrden = puntosServidor[puntosServidor.length - 1]?.orden ?? 0

        puntosPendientes = pendientesLocales
          .filter((punto) => punto.viaje_id === viajeId && !idsServidor.has(punto.id))
          .map((punto, index) => {
            const archivosOffline = archivosDePuntoOffline(punto)
            const archivosPreview = archivosOffline.map((file) => {
              const previewUrl = URL.createObjectURL(file)
              previewsPendientes.current.push(previewUrl)
              return archivoDesdeFile(file, previewUrl)
            })

            return {
              id: punto.id,
              orden: ultimoOrden + index + 1,
              tipo: punto.tipo,
              nombre_punto: punto.nombre_punto,
              km_llegada: punto.km_llegada,
              foto_guia_url: imagenPrincipal(archivosPreview) || archivosPreview[0]?.url || '',
              archivos: archivosPreview,
              captured_at: punto.captured_at,
              pendiente: true,
            }
          })
      } catch (err) {
        console.error('Error cargando puntos pendientes:', err)
      }

      setPuntos([...puntosServidor, ...puntosPendientes])
    } finally {
      setTimeout(() => {
        for (const url of previewsAnteriores) {
          URL.revokeObjectURL(url)
        }
      }, 1000)

      cargandoRef.current = false
      setLoading(false)

      if (recargarRef.current) {
        recargarRef.current = false
        void cargarPuntos()
      }
    }
  }

  useEffect(() => {
    cargarPuntos()
    actualizarPendientes()
    sincronizarPendientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      for (const url of previewsPendientes.current) {
        URL.revokeObjectURL(url)
      }
      previewsPendientes.current = []
    }
  }, [])

  useEffect(() => {
    function alRecuperarConexion() {
      void sincronizarPendientes()
    }

    window.addEventListener('online', alRecuperarConexion)
    return () => window.removeEventListener('online', alRecuperarConexion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSyncError('')
    setSuccess('')
  }

  async function subirArchivos(files: File[]): Promise<ArchivoPunto[] | null> {
    if (files.length === 0) return null

    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    formData.append('bucket', 'guias')

    try {
      const res = await fetchConTimeout('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) return null

      const data = await res.json()
      const urls: string[] = Array.isArray(data.urls)
        ? data.urls
        : data.url
          ? [data.url]
          : []

      if (urls.length !== files.length) return null

      return files.map((file, index) => archivoDesdeFile(file, urls[index]))
    } catch {
      return null
    }
  }

  async function actualizarPendientes() {
    try {
      const locales = await listarPuntosOffline()
      setPendientes(locales.filter((punto) => punto.viaje_id === viajeId).length)
    } catch {
      // IndexedDB no disponible: el flujo online sigue funcionando
    }
  }

  async function sincronizarPendientes() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    if (sincronizandoRef.current) {
      resincronizarRef.current = true
      return
    }

    let pendientesLocales: PuntoOffline[]
    try {
      const todos = await listarPuntosOffline()
      pendientesLocales = todos.filter((punto) => punto.viaje_id === viajeId)
    } catch {
      return
    }

    if (pendientesLocales.length === 0) {
      await actualizarPendientes()
      return
    }

    sincronizandoRef.current = true
    setSincronizando(true)
    setSyncError('')
    let sincronizados = 0

    try {
      for (const pendiente of pendientesLocales) {
        try {
          const archivosPendiente = archivosDePuntoOffline(pendiente)

          if (archivosPendiente.length === 0) {
            setSyncError('Un punto pendiente no tiene archivos. Descártalo y vuelve a registrarlo.')
            break
          }

          const subida = await subirArchivos(archivosPendiente)

          if (!subida) {
            setSyncError('No se pudieron subir los archivos. El punto quedó guardado en el dispositivo.')
            break
          }

          const res = await fetchConTimeout(`/api/viajes/${pendiente.viaje_id}/puntos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: pendiente.id,
              tipo: pendiente.tipo,
              nombre_punto: pendiente.nombre_punto,
              km_llegada: pendiente.km_llegada,
              foto_guia_url: imagenPrincipal(subida) || subida[0].url,
              archivos: subida,
              captured_at: pendiente.captured_at,
            }),
          })

          if (res.status === 409) {
            await eliminarPuntoOffline(pendiente.id)
            continue
          }

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            setSyncError(data.error || 'No se pudo enviar el punto. Quedó pendiente para reintentar.')
            break
          }

          await eliminarPuntoOffline(pendiente.id)
          sincronizados++
        } catch {
          setSyncError('Conexión lenta o interrumpida. El punto quedó guardado en el dispositivo.')
          break
        }
      }

      await actualizarPendientes()
    } finally {
      sincronizandoRef.current = false
      setSincronizando(false)
    }

    if (sincronizados > 0) {
      setSuccess(`${sincronizados} punto${sincronizados !== 1 ? 's' : ''} sincronizado${sincronizados !== 1 ? 's' : ''}`)
      await cargarPuntos()
      setTimeout(() => setSuccess(''), 4000)
    }

    if (resincronizarRef.current) {
      resincronizarRef.current = false
      void sincronizarPendientes()
    }
  }

  function handleArchivosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const seleccionados = Array.from(e.target.files || [])
    e.target.value = ''

    if (seleccionados.length === 0) return

    limpiarMensajes()

    const disponibles = MAX_ARCHIVOS_PUNTO - archivos.length

    if (disponibles <= 0) {
      setError(`Puedes adjuntar máximo ${MAX_ARCHIVOS_PUNTO} archivos`)
      return
    }

    const nuevos: ArchivoLocal[] = []
    let errorArchivo = ''

    for (const file of seleccionados.slice(0, disponibles)) {
      const errorValidacion = validarArchivoLocal(file)
      if (errorValidacion) {
        errorArchivo = `${file.name}: ${errorValidacion}`
        continue
      }
      nuevos.push({ file, previewUrl: URL.createObjectURL(file) })
    }

    if (nuevos.length > 0) {
      setArchivos((prev) => [...prev, ...nuevos])
    }

    if (errorArchivo) {
      setError(errorArchivo)
    } else if (seleccionados.length > disponibles) {
      setError(`Puedes adjuntar máximo ${MAX_ARCHIVOS_PUNTO} archivos`)
    }
  }

  function quitarArchivo(index: number) {
    setArchivos((prev) => {
      const archivo = prev[index]
      if (archivo) URL.revokeObjectURL(archivo.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleEditArchivosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const seleccionados = Array.from(e.target.files || [])
    e.target.value = ''

    if (seleccionados.length === 0) return

    limpiarMensajes()

    const disponibles = MAX_ARCHIVOS_PUNTO - editArchivos.length - editNuevos.length

    if (disponibles <= 0) {
      setError(`Puedes adjuntar máximo ${MAX_ARCHIVOS_PUNTO} archivos`)
      return
    }

    const nuevos: ArchivoLocal[] = []
    let errorArchivo = ''

    for (const file of seleccionados.slice(0, disponibles)) {
      const errorValidacion = validarArchivoLocal(file)
      if (errorValidacion) {
        errorArchivo = `${file.name}: ${errorValidacion}`
        continue
      }
      nuevos.push({ file, previewUrl: URL.createObjectURL(file) })
    }

    if (nuevos.length > 0) {
      setEditNuevos((prev) => [...prev, ...nuevos])
    }

    if (errorArchivo) {
      setError(errorArchivo)
    } else if (seleccionados.length > disponibles) {
      setError(`Puedes adjuntar máximo ${MAX_ARCHIVOS_PUNTO} archivos`)
    }
  }

  function quitarEditArchivo(index: number) {
    setEditArchivos((prev) => prev.filter((_, i) => i !== index))
  }

  function quitarEditNuevo(index: number) {
    setEditNuevos((prev) => {
      const archivo = prev[index]
      if (archivo) URL.revokeObjectURL(archivo.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  function abrirEdicion(punto: Punto) {
    limpiarMensajes()
    setEditando(punto)
    setEditForm({
      tipo: punto.tipo,
      nombre_punto: punto.nombre_punto,
      km_llegada: String(punto.km_llegada),
    })
    setEditArchivos(archivosDesdePunto(punto))
    setEditNuevos([])
    setMotivoEdicion('')
  }

  function cerrarEdicion() {
    for (const archivo of editNuevos) {
      URL.revokeObjectURL(archivo.previewUrl)
    }
    setEditando(null)
    setEditArchivos([])
    setEditNuevos([])
    setMotivoEdicion('')
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

    if (archivos.length === 0) {
      setError('Adjunta al menos un archivo de la guía')
      return
    }

    if (archivos.length > MAX_ARCHIVOS_PUNTO) {
      setError(`Puedes adjuntar máximo ${MAX_ARCHIVOS_PUNTO} archivos`)
      return
    }

    if (!archivos.some((archivo) => esImagen(archivo.file.type))) {
      setError('Debes incluir al menos una imagen de la guía')
      return
    }

    const errorArchivo = archivos
      .map((archivo) => validarArchivoLocal(archivo.file))
      .find(Boolean)

    if (errorArchivo) {
      setError(errorArchivo)
      return
    }

    const puntoId = crypto.randomUUID()
    const capturedAt = new Date().toISOString()
    const archivosPunto = archivos.map((archivo) =>
      archivoDesdeFile(archivo.file, archivo.previewUrl)
    )
    const fotoPrincipal = imagenPrincipal(archivosPunto) || archivosPunto[0]?.url || ''

    const puntoLocal: PuntoOffline = {
      id: puntoId,
      viaje_id: viajeId,
      cliente_id: clienteId,
      tipo,
      nombre_punto: nombreLimpio,
      km_llegada: kmNumero,
      captured_at: capturedAt,
      archivos: archivos.map((archivo) => archivo.file),
      created_at: capturedAt,
    }

    setSaving(true)

    try {
      await guardarPuntoOffline(puntoLocal)

      for (const archivo of archivos) {
        previewsPendientes.current.push(archivo.previewUrl)
      }

      setPuntos((prev) => [
        ...prev,
        {
          id: puntoId,
          orden: (prev[prev.length - 1]?.orden ?? 0) + 1,
          tipo,
          nombre_punto: nombreLimpio,
          km_llegada: kmNumero,
          foto_guia_url: fotoPrincipal,
          archivos: archivosPunto,
          captured_at: capturedAt,
          pendiente: true,
        },
      ])

      setNombre('')
      setKm('')
      setArchivos([])
      setSugerencias([])
      await actualizarPendientes()

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSuccess('Sin conexión: el punto quedó guardado en el dispositivo. Se enviará al reconectar.')
      } else {
        setSuccess(
          conexionLenta()
            ? 'Conexión lenta: el punto quedó guardado. Sincronizando en segundo plano...'
            : 'Punto guardado. Sincronizando...'
        )
        void sincronizarPendientes()
      }

      setTimeout(() => setSuccess(''), 6000)
    } catch {
      setError('No se pudo guardar el punto en el dispositivo')
    } finally {
      setSaving(false)
    }
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

    if (editArchivos.length + editNuevos.length > MAX_ARCHIVOS_PUNTO) {
      setError(`Puedes adjuntar máximo ${MAX_ARCHIVOS_PUNTO} archivos`)
      return
    }

    const tieneImagen =
      editArchivos.some((archivo) => esImagen(archivo.tipo)) ||
      editNuevos.some((archivo) => esImagen(archivo.file.type))

    if (!tieneImagen) {
      setError('Debes incluir al menos una imagen de la guía')
      return
    }

    setSaving(true)

    try {
      const archivosFinales = [...editArchivos]

      if (editNuevos.length > 0) {
        setUploading(true)
        const subida = await subirArchivos(editNuevos.map((archivo) => archivo.file))
        setUploading(false)

        if (!subida) {
          setError('No se pudieron subir los archivos. Revisa la conexión e intenta nuevamente.')
          return
        }

        archivosFinales.push(...subida)
      }

      const errorArchivos = validarArchivosPunto(archivosFinales)
      const fotoPrincipal = imagenPrincipal(archivosFinales)

      if (errorArchivos) {
        setError(errorArchivos)
        return
      }

      if (!fotoPrincipal) {
        setError('Debes incluir al menos una imagen de la guía')
        return
      }

      const res = await fetchConTimeout(`/api/viajes/${viajeId}/puntos/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: editForm.tipo,
          nombre_punto: editForm.nombre_punto,
          km_llegada: kmNumero,
          foto_guia_url: fotoPrincipal,
          archivos: archivosFinales,
          motivo: motivoEdicion.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
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
      const res = await fetchConTimeout(`/api/viajes/${viajeId}/puntos/${anulando.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoAnulacion.trim() }),
      }, 10000)

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

  async function descartarPendiente(punto: Punto) {
    if (!window.confirm('¿Descartar este punto pendiente? No se enviará al servidor.')) return

    try {
      await eliminarPuntoOffline(punto.id)

      for (const archivo of punto.archivos) {
        if (archivo.url.startsWith('blob:')) {
          URL.revokeObjectURL(archivo.url)
        }
      }

      setPuntos((prev) => prev.filter((item) => item.id !== punto.id))
      await actualizarPendientes()
      setSuccess('Punto pendiente descartado')
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setError('No se pudo descartar el punto pendiente')
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

      {!online && (
        <div
          className="p-3 rounded-lg border"
          style={{ background: '#1C1A0D', borderColor: '#5D5220' }}
        >
          <p className="text-xs text-amber-300">
            Sin conexión: los puntos se guardarán en el dispositivo y se enviarán al reconectar.
          </p>
        </div>
      )}

      {pendientes > 0 && (
        <div
          className="p-3 rounded-lg border flex items-center justify-between gap-3"
          style={{ background: '#1C1A0D', borderColor: '#5D5220' }}
        >
          <p className="text-xs text-amber-300">
            {pendientes} punto{pendientes !== 1 ? 's' : ''} pendiente{pendientes !== 1 ? 's' : ''} de sincronizar. Sincroniza antes de cerrar la ruta.
          </p>
          <button
            type="button"
            onClick={sincronizarPendientes}
            disabled={sincronizando}
            className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ background: '#10B981' }}
          >
            {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      )}

      {syncError && (
        <div className="p-3 rounded-lg border" style={{ background: '#2D1515', borderColor: '#5D2020' }}>
          <p className="text-xs text-red-400">{syncError}</p>
        </div>
      )}

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
                    {punto.pendiente && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {punto.km_llegada.toLocaleString('es-CL')} km
                  </p>
                </div>
              </div>

              {punto.archivos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {punto.archivos.map((archivo, index) => (
                    <a
                      key={`${archivo.url}-${index}`}
                      href={archivo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                      title={archivo.nombre}
                    >
                      {esImagen(archivo.tipo) ? (
                        <img
                          src={archivo.url}
                          alt={archivo.nombre}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex w-12 h-12 items-center justify-center rounded-lg bg-red-500/15 text-[10px] font-medium text-red-300">
                          PDF
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}

              {punto.pendiente ? (
                <div className="flex gap-4 mt-3">
                  <button
                    type="button"
                    onClick={() => descartarPendiente(punto)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Descartar
                  </button>
                </div>
              ) : (
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
              )}
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
          <label className="block text-xs text-zinc-500 mb-1">Guía y documentos</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            onChange={handleArchivosChange}
            className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            Hasta {MAX_ARCHIVOS_PUNTO} archivos, 5 MB cada uno. Incluye al menos una imagen.
          </p>

          {archivos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {archivos.map((archivo, index) => (
                <div key={archivo.previewUrl} className="relative">
                  {esImagen(archivo.file.type) ? (
                    <img
                      src={archivo.previewUrl}
                      alt={archivo.file.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <a
                      href={archivo.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-16 h-16 items-center justify-center rounded-lg bg-red-500/15 text-[10px] font-medium text-red-300"
                    >
                      PDF
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => quitarArchivo(index)}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-xs text-white"
                    aria-label={`Quitar ${archivo.file.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: '#10B981' }}
        >
          {saving ? 'Guardando...' : 'Agregar punto'}
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
              <label className="block text-xs text-zinc-500 mb-1">Guía y documentos</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                onChange={handleEditArchivosChange}
                className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Hasta {MAX_ARCHIVOS_PUNTO} archivos, 5 MB cada uno. Incluye al menos una imagen.
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {editArchivos.map((archivo, index) => (
                  <div key={`${archivo.url}-${index}`} className="relative">
                    {esImagen(archivo.tipo) ? (
                      <img
                        src={archivo.url}
                        alt={archivo.nombre}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <a
                        href={archivo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-16 h-16 items-center justify-center rounded-lg bg-red-500/15 text-[10px] font-medium text-red-300"
                      >
                        PDF
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => quitarEditArchivo(index)}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-xs text-white"
                      aria-label={`Quitar ${archivo.nombre}`}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {editNuevos.map((archivo, index) => (
                  <div key={archivo.previewUrl} className="relative">
                    {esImagen(archivo.file.type) ? (
                      <img
                        src={archivo.previewUrl}
                        alt={archivo.file.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <a
                        href={archivo.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-16 h-16 items-center justify-center rounded-lg bg-red-500/15 text-[10px] font-medium text-red-300"
                      >
                        PDF
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => quitarEditNuevo(index)}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-xs text-white"
                      aria-label={`Quitar ${archivo.file.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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
