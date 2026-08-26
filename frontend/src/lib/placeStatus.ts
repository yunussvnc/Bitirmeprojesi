/**
 * Mekan açık/kapalı/kapanmaya yakın durumunu hesapla.
 * apps/mobile/src/utils/placeStatus.ts ile birebir aynı mantık — web/mobil parite.
 *
 * Renkler:
 *   🟢 Yeşil  (#4CAF50) → Açık
 *   🔴 Kırmızı (#F44336) → Kapalı
 *   🟡 Sarı   (#FF9800) → Kapanmaya yakın (son 1 saat)
 */

export type PlaceStatusType = 'open' | 'closed' | 'closing_soon'

export interface PlaceStatus {
  status: PlaceStatusType
  label: string
  color: string
  hoursText: string
}

const STATUS_COLORS: Record<PlaceStatusType, string> = {
  open: '#4CAF50',
  closed: '#F44336',
  closing_soon: '#FF9800',
}

const STATUS_LABELS: Record<PlaceStatusType, string> = {
  open: 'Açık',
  closed: 'Kapalı',
  closing_soon: 'Kapanıyor',
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

const CLOSING_SOON_THRESHOLD = 60

export function getPlaceStatus(openingTime?: string, closingTime?: string, now?: Date): PlaceStatus {
  const fallback: PlaceStatus = {
    status: 'open',
    label: 'Bilinmiyor',
    color: '#9E9E9E',
    hoursText: '',
  }

  if (!openingTime || !closingTime) return fallback

  const date = now ?? new Date()
  const currentMinutes = date.getHours() * 60 + date.getMinutes()
  const openMin = timeToMinutes(openingTime)
  const closeMin = timeToMinutes(closingTime)
  const hoursText = `${openingTime} - ${closingTime}`

  if (closeMin > openMin) {
    const isOpen = currentMinutes >= openMin && currentMinutes < closeMin
    if (!isOpen) {
      return { status: 'closed', label: STATUS_LABELS.closed, color: STATUS_COLORS.closed, hoursText }
    }
    const minutesUntilClose = closeMin - currentMinutes
    if (minutesUntilClose <= CLOSING_SOON_THRESHOLD) {
      return { status: 'closing_soon', label: STATUS_LABELS.closing_soon, color: STATUS_COLORS.closing_soon, hoursText }
    }
    return { status: 'open', label: STATUS_LABELS.open, color: STATUS_COLORS.open, hoursText }
  }

  const isInEveningBlock = currentMinutes >= openMin
  const isInMorningBlock = currentMinutes < closeMin

  if (!isInEveningBlock && !isInMorningBlock) {
    return { status: 'closed', label: STATUS_LABELS.closed, color: STATUS_COLORS.closed, hoursText }
  }

  let minutesUntilClose: number
  if (isInEveningBlock) {
    minutesUntilClose = 1440 - currentMinutes + closeMin
  } else {
    minutesUntilClose = closeMin - currentMinutes
  }

  if (minutesUntilClose <= CLOSING_SOON_THRESHOLD) {
    return { status: 'closing_soon', label: STATUS_LABELS.closing_soon, color: STATUS_COLORS.closing_soon, hoursText }
  }

  return { status: 'open', label: STATUS_LABELS.open, color: STATUS_COLORS.open, hoursText }
}
