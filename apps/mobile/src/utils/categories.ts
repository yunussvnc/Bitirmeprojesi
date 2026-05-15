export type PlaceStatusType = 'open' | 'closing_soon' | 'closed';

export const CATEGORY_KEYS = [
  { value: 'Kafe', tKey: 'categories.cafe' },
  { value: 'Restoran', tKey: 'categories.restaurant' },
  { value: 'Bar', tKey: 'categories.bar' },
  { value: 'Meyhane', tKey: 'categories.meyhane' },
  { value: 'Gece Kulübü', tKey: 'categories.nightclub' },
  { value: 'Fast Food', tKey: 'categories.fastfood' },
  { value: 'Nargile Cafe', tKey: 'categories.nargile' },
] as const;

export const STATUS_KEYS: { key: PlaceStatusType; tKey: string; color: string }[] = [
  { key: 'open', tKey: 'status.open', color: '#4CAF50' },
  { key: 'closing_soon', tKey: 'status.closing_soon', color: '#FF9800' },
  { key: 'closed', tKey: 'status.closed', color: '#F44336' },
];

export const getTranslatedCategory = (category: string | undefined | null, t: any) => {
  if (!category) return "";
  const found = CATEGORY_KEYS.find(c => c.value === category);
  return found ? t(found.tKey, category) : category;
};
