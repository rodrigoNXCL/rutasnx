const SUPABASE_PUBLIC_PREFIX = '/storage/v1/object/public/'

export function shortenStorageUrl(url: string | null, baseUrl: string): string | null {
  if (!url) return null

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return url

    const u = new URL(url)
    if (u.origin !== new URL(supabaseUrl).origin) return url
    if (!u.pathname.startsWith(SUPABASE_PUBLIC_PREFIX)) return url

    const rest = u.pathname.slice(SUPABASE_PUBLIC_PREFIX.length)
    const slash = rest.indexOf('/')
    if (slash === -1) return url

    const bucket = rest.slice(0, slash)
    const file = rest.slice(slash + 1)
    if (!bucket || !file) return url

    return `${baseUrl.replace(/\/$/, '')}/s/${bucket}/${file}${u.search}`
  } catch {
    return url
  }
}