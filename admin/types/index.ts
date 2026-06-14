// types/index.ts

export interface User {
  id: number;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'standard' | 'venue' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface Place {
  id: number;
  name: string;
  address: string;
  city: string; // district
  description: string;
  price_range: number;
  category: string;
  features: string;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  phone_number: string | null;
  has_vector?: boolean;
}

export interface PostMedia {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
}

export interface Report {
  id: number;
  reporter_id: number;
  target_type: 'post' | 'comment' | 'user' | 'match_profile';
  target_id: number;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface Post {
  id: number;
  caption: string | null;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  is_flagged: boolean;
  user: {
    id: number;
    username: string | null;
    avatar_url: string | null;
  };
  media: PostMedia[];
  reports: Report[];
}

export interface Story {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  expires_at: string;
  user: {
    id: number;
    username: string | null;
    avatar_url: string | null;
  };
  view_count: number;
  reaction_count: number;
}

export interface AIQueryLog {
  id: number;
  user_id: number | null;
  query_text: string;
  query_type: 'venue_search' | 'chit_chat' | 'blocked';
  llm_layer: 'groq' | 'gemma_fallback';
  response_time_ms: number;
  result_count: number;
  status: 'success' | 'fallback' | 'error' | 'blocked';
  created_at: string;
}

export interface AdminAuditLog {
  id: number;
  admin_username: string;
  action: string;
  target_type: string;
  target_id: number | null;
  details: Record<string, any> | null;
  created_at: string;
}

export interface DashboardStats {
  total_users: number;
  total_venues: number;
  active_stories: number;
  ai_queries_today: number;
}

export interface SystemHealthItem {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  latency_ms: number;
}

export interface SystemHealth {
  status: string;
  services: {
    postgresql: SystemHealthItem;
    redis: SystemHealthItem;
    'asemos-ai': SystemHealthItem;
    'qdrant-cloud': SystemHealthItem;
  };
}

export interface RedisStats {
  connected: boolean;
  keys_count: number;
  used_memory_human: string;
  used_memory: number;
  hits: number;
  misses: number;
  hit_rate_pct: number;
}

export interface QdrantStats {
  collections: string[];
  vectors_count: number;
  status: string;
}
