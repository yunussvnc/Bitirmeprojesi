export type Preferences = {
  vibe?: string;
  purpose?: string;
  budget?: string;
};

export type Location = {
  lat: number;
  lng: number;
};

export type RecommendRequest = {
  queryText?: string;
  preferences?: Preferences;
  location?: Location;
  radius_m?: number;
  category?: string;
  district?: string;
};

export type RecommendItem = {
  id: number;
  name: string;
  category?: string;
  distance_m?: number;
  score?: number;
  photo_url?: string;
  explanation?: string;
  tags?: string[];
};

export type RecommendResponse = {
  items: RecommendItem[];
  summary: string;
  cached: boolean;
};

/** Backward compatibility */
export type PlaceCard = RecommendItem;
