import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export default function VenueImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`${className ?? ''} venue-image-fallback`} aria-hidden="true">
        <ImageOff size={22} />
      </div>
    )
  }

  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />
}
