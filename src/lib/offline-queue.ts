export interface PuntoOffline {
  id: string
  viaje_id: string
  cliente_id: string | null
  tipo: 'retiro' | 'entrega'
  nombre_punto: string
  km_llegada: number
  captured_at: string
  archivos?: File[]
  foto?: Blob
  created_at: string
}

const DB_NAME = 'rutasnx-offline'
const STORE = 'puntos'
const VERSION = 1

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible'))
      return
    }

    const request = indexedDB.open(DB_NAME, VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transaccion<T>(
  mode: IDBTransactionMode,
  ejecutar: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return abrirDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const store = tx.objectStore(STORE)
        const request = ejecutar(store)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        tx.oncomplete = () => db.close()
        tx.onerror = () => reject(tx.error)
      })
  )
}

export async function guardarPuntoOffline(punto: PuntoOffline): Promise<void> {
  await transaccion('readwrite', (store) => store.put(punto))
}

export async function listarPuntosOffline(): Promise<PuntoOffline[]> {
  const puntos = await transaccion<PuntoOffline[]>('readonly', (store) => store.getAll())
  return puntos.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function eliminarPuntoOffline(id: string): Promise<void> {
  await transaccion('readwrite', (store) => store.delete(id))
}

export async function contarPuntosOffline(): Promise<number> {
  return transaccion<number>('readonly', (store) => store.count())
}

export function archivosDePuntoOffline(punto: PuntoOffline): File[] {
  if (Array.isArray(punto.archivos) && punto.archivos.length > 0) {
    return punto.archivos
  }

  if (!punto.foto) return []

  const tipo = punto.foto.type || 'image/jpeg'
  const extension = tipo === 'application/pdf'
    ? 'pdf'
    : tipo === 'image/png'
      ? 'png'
      : tipo === 'image/webp'
        ? 'webp'
        : 'jpg'

  return [new File([punto.foto], `guia.${extension}`, { type: tipo })]
}
