import { useEffect, useState } from 'react'
import { fetchAllVenues, type Venue } from '../lib/api'

export type { Venue }

let cachedPromise: Promise<Venue[]> | null = null

function getVenuesPromise(): Promise<Venue[]> {
  if (!cachedPromise) cachedPromise = fetchAllVenues()
  return cachedPromise
}

interface UseVenuesResult {
  venues: Venue[]
  districts: string[]
  categories: string[]
  loading: boolean
  error: string | null
}

export function useVenues(): UseVenuesResult {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getVenuesPromise()
      .then((v) => {
        if (!cancelled) {
          setVenues(v)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const districts = Array.from(new Set(venues.map((v) => v.district))).sort()
  const categories = Array.from(new Set(venues.map((v) => v.category))).sort()

  return { venues, districts, categories, loading, error }
}
