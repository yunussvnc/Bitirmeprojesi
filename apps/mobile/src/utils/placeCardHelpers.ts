import type { TFunction } from 'i18next';
import type { Place } from '@/src/services/mekanService';
import { getPlaceStatus, type PlaceStatus } from '@/src/utils/placeStatus';

/** SerpAPI / legacy price_level → backend price_range (1–4) */
export function normalizePriceRange(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  if (value >= 1 && value <= 4) return Math.round(value);
  // Values outside 1-4 are not reliable Google $ counts; omit so UI can hide price.
  return undefined;
}

export function formatPriceRange(priceRange?: number): string | undefined {
  if (!priceRange || priceRange < 1) return undefined;
  return '₺'.repeat(Math.min(4, Math.max(1, Math.round(priceRange))));
}

export function getPlaceStatusLocalized(
  openingTime: string | undefined,
  closingTime: string | undefined,
  t: TFunction,
  now?: Date,
): PlaceStatus {
  const status = getPlaceStatus(openingTime, closingTime, now);
  if (!openingTime || !closingTime) {
    return {
      status: 'closed',
      label: t('place_detail.hours_unavailable'),
      color: '#9E9E9E',
      hoursText: t('place_detail.hours_unavailable'),
    };
  }
  const labelMap: Record<string, string> = {
    open: t('explore.status_open'),
    closed: t('explore.status_closed'),
    closing_soon: t('explore.status_closing'),
  };
  return {
    ...status,
    label: labelMap[status.status] ?? status.label,
  };
}

export type PlaceCardMeta = {
  openingTime?: string;
  closingTime?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: number;
  priceLabel?: string;
  hasMenu: boolean;
  menuComingSoon: boolean;
  category?: string;
  address?: string;
  userReview?: string;
};

export function buildPlaceCardMeta(place: Partial<Place> | null | undefined): PlaceCardMeta {
  const menuItems = place?.menu_items;
  const hasMenu = Array.isArray(menuItems) && menuItems.length > 0;
  const rating =
    typeof place?.average_rating === 'number'
      ? place.average_rating
      : undefined;
  const priceRange = normalizePriceRange(place?.price_range);

  return {
    openingTime: place?.opening_time,
    closingTime: place?.closing_time,
    rating,
    reviewCount: place?.review_count,
    priceRange,
    priceLabel: formatPriceRange(priceRange),
    hasMenu,
    menuComingSoon: !hasMenu,
    category: place?.category,
    address: place?.address,
    userReview: place?.user_review,
  };
}
