import { apiPost, apiGet, apiPut } from "@/src/utils/apiClient";

export type AuthUser = {
  id: number;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  birth_date: string | null;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UpdateProfilePayload = {
  username?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
};

export async function registerUser(payload: RegisterPayload): Promise<AuthTokens> {
  return apiPost<AuthTokens>("/auth/register", payload, { skipAuth: true });
}

export async function loginUser(payload: LoginPayload): Promise<AuthTokens> {
  return apiPost<AuthTokens>("/auth/login", payload, { skipAuth: true });
}

export async function refreshTokens(refresh_token: string): Promise<AuthTokens> {
  return apiPost<AuthTokens>("/auth/refresh", { refresh_token }, { skipAuth: true });
}

export async function getMe(): Promise<AuthUser> {
  return apiGet<AuthUser>("/auth/me");
}

export async function updateMe(payload: UpdateProfilePayload): Promise<AuthUser> {
  return apiPut<AuthUser>("/auth/me", payload);
}
