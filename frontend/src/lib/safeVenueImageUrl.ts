const ALLOWED_IMAGE_HOSTS = new Set([
  'api.asemos.tr',
  'images.unsplash.com',
  'res.cloudinary.com',
  'places.googleapis.com',
  'streetviewpixels-pa.googleapis.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
])

function isLocalDevelopmentUrl(url: URL): boolean {
  return (
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1')
  )
}

export function getAllowedVenueImageUrl(rawUrl: string, baseOrigin: string): string | null {
  if (!rawUrl.trim()) return null

  try {
    const url = new URL(rawUrl, baseOrigin)
    const base = new URL(baseOrigin)
    const isSameOrigin = url.origin === base.origin
    const isLocalDevelopment = isLocalDevelopmentUrl(url)
    const hasAllowedProtocol = url.protocol === 'https:' || isLocalDevelopment
    const hasAllowedHost = isSameOrigin || isLocalDevelopment || ALLOWED_IMAGE_HOSTS.has(url.hostname)

    return hasAllowedProtocol && hasAllowedHost ? url.href : null
  } catch {
    return null
  }
}
