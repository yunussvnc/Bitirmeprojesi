export type Preferences = {
  budget: "low" | "mid" | "high";
  vibe: "quiet" | "lively";
  purpose: "work" | "friends" | "date";
};

export type RecommendRequest = {
  queryText: string;
  preferences: Preferences;
  // location?: { lat: number; lng: number };
};

export type PlaceCard = {
  id: number;
  name: string;
  subtitle: string;
  tags: string[];
};

export type RecommendResponse = {
  items: PlaceCard[];
  explanation: string; // LLM açıklaması gibi
};
