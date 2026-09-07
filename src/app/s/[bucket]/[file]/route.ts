import { NextResponse } from 'next/server'

const ALLOWED_BUCKETS = new Set(['gastos', 'km-fotos'])
const SAFE_FILE = /^[A-Za-z0-9._-]+$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bucket: string; file: string }> }
) {
  const { bucket, file } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl || !ALLOWED_BUCKETS.has(bucket) || !file || !SAFE_FILE.test(file)) {
    return new Response(null, { status: 404 })
  }

  return NextResponse.redirect(
    `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${file}`,
    302
  )
}