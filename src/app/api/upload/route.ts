import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MAX_ARCHIVOS_PUNTO,
  MAX_ARCHIVO_PUNTO_BYTES,
  TIPOS_ARCHIVO_PUNTO,
} from '@/lib/archivos-punto'

const ALLOWED_BUCKETS = new Set(['gastos', 'km-fotos', 'guias'])
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']

function extensionArchivo(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension && /^[a-z0-9]{1,8}$/.test(extension)) return extension
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

function nombreArchivo(file: File): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensionArchivo(file)}`
}

export async function POST(request: Request) {
  try {
    await requireRole(['chofer', 'admin', 'superadmin'])
    const supabaseAdmin = createAdminClient()

    const formData = await request.formData()
    const bucket = (formData.get('bucket') as string) || 'gastos'

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Bucket no permitido' }, { status: 400 })
    }

    const multiples = formData
      .getAll('files')
      .filter((value): value is File => value instanceof File && value.size > 0)

    const unico = formData.get('file')
    const archivos = multiples.length > 0
      ? multiples
      : unico instanceof File
        ? [unico]
        : []

    if (archivos.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (archivos.length > MAX_ARCHIVOS_PUNTO) {
      return NextResponse.json(
        { error: `Puedes subir máximo ${MAX_ARCHIVOS_PUNTO} archivos` },
        { status: 400 }
      )
    }

    const permitidos = bucket === 'guias' ? TIPOS_ARCHIVO_PUNTO : TIPOS_IMAGEN

    for (const file of archivos) {
      if (!(permitidos as readonly string[]).includes(file.type)) {
        return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
      }

      if (file.size > MAX_ARCHIVO_PUNTO_BYTES) {
        return NextResponse.json({ error: 'El archivo debe ser menor a 5MB' }, { status: 400 })
      }
    }

    const urls: string[] = []

    for (const file of archivos) {
      const fileName = nombreArchivo(file)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(fileName)

      urls.push(publicUrl)
    }

    if (multiples.length > 0) {
      return NextResponse.json({ urls })
    }

    return NextResponse.json({ url: urls[0] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
