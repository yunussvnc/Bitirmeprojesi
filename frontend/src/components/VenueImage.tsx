import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'

export default function VenueImage({
  src,
  fallbackSrc,
  alt,
  className,
}: {
  src: string
  fallbackSrc?: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
    setFallbackFailed(false)
  }, [src, fallbackSrc])

  if (src && !failed) {
    return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />
  }

  if (fallbackSrc && !fallbackFailed) {
    return (
      <img
        src={fallbackSrc}
        alt={`${alt} — kategori görseli`}
        loading="lazy"
        className={className}
        onError={() => setFallbackFailed(true)}
      />
    )
  }

  return (
    <div className={`${className ?? ''} venue-image-fallback`} role="img" aria-label={`${alt} görseli kullanılamıyor`}>
      <ImageOff size={22} />
    </div>
  )
}
