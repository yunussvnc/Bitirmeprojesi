/**
 * Mekan açık/kapalı/kapanmaya yakın durumunu hesapla.
 *
 * Renkler:
 *   🟢 Yeşil  (#4CAF50) → Açık
 *   🔴 Kırmızı (#F44336) → Kapalı
 *   🟡 Sarı   (#FF9800) → Kapanmaya yakın (son 1 saat)
 */

export type PlaceStatusType = 'open' | 'closed' | 'closing_soon';

export interface PlaceStatus {
    status: PlaceStatusType;
    label: string;
    color: string;
    hoursText: string; // ör. "08:00 - 23:00"
}

const STATUS_COLORS: Record<PlaceStatusType, string> = {
    open: '#4CAF50',
    closed: '#F44336',
    closing_soon: '#FF9800',
};

const STATUS_LABELS: Record<PlaceStatusType, string> = {
    open: 'Açık',
    closed: 'Kapalı',
    closing_soon: 'Kapanıyor',
};

/**
 * "HH:MM" formatındaki saati dakikaya çevirir (0-1439).
 */
function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Kapanmaya yakın eşiği (dakika). Son 60 dk içinde → sarı.
 */
const CLOSING_SOON_THRESHOLD = 60;

/**
 * Mekanın mevcut durumunu hesapla.
 * Gece yarısını geçen mekanları da doğru destekler
 * (ör. Bar 18:00 - 03:00).
 */
export function getPlaceStatus(
    openingTime?: string,
    closingTime?: string,
    now?: Date,
): PlaceStatus {
    const fallback: PlaceStatus = {
        status: 'open',
        label: 'Bilinmiyor',
        color: '#9E9E9E',
        hoursText: '',
    };

    if (!openingTime || !closingTime) return fallback;

    const date = now ?? new Date();
    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const openMin = timeToMinutes(openingTime);
    const closeMin = timeToMinutes(closingTime);

    const hoursText = `${openingTime} - ${closingTime}`;

    // Gece yarısını geçmeyen mekanlar (ör. 08:00 – 23:00)
    if (closeMin > openMin) {
        const isOpen = currentMinutes >= openMin && currentMinutes < closeMin;
        if (!isOpen) {
            return { status: 'closed', label: STATUS_LABELS.closed, color: STATUS_COLORS.closed, hoursText };
        }
        const minutesUntilClose = closeMin - currentMinutes;
        if (minutesUntilClose <= CLOSING_SOON_THRESHOLD) {
            return { status: 'closing_soon', label: STATUS_LABELS.closing_soon, color: STATUS_COLORS.closing_soon, hoursText };
        }
        return { status: 'open', label: STATUS_LABELS.open, color: STATUS_COLORS.open, hoursText };
    }

    // Gece yarısını geçen mekanlar (ör. 18:00 – 03:00)
    // İki zaman dilimi: [openMin..23:59] ve [00:00..closeMin)
    const isInEveningBlock = currentMinutes >= openMin; // 18:00+
    const isInMorningBlock = currentMinutes < closeMin; // ..03:00

    if (!isInEveningBlock && !isInMorningBlock) {
        return { status: 'closed', label: STATUS_LABELS.closed, color: STATUS_COLORS.closed, hoursText };
    }

    // Kapanmaya yakın mı?
    let minutesUntilClose: number;
    if (isInEveningBlock) {
        // Akşam bloğundayız, kapanışa kalan = (23:59-current) + closeMin
        minutesUntilClose = (1440 - currentMinutes) + closeMin;
    } else {
        // Sabah bloğundayız
        minutesUntilClose = closeMin - currentMinutes;
    }

    if (minutesUntilClose <= CLOSING_SOON_THRESHOLD) {
        return { status: 'closing_soon', label: STATUS_LABELS.closing_soon, color: STATUS_COLORS.closing_soon, hoursText };
    }

    return { status: 'open', label: STATUS_LABELS.open, color: STATUS_COLORS.open, hoursText };
}
