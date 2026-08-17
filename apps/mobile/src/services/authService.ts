import { apiPost, apiGet, apiPut, apiDelete } from "@/src/utils/apiClient";

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
  is_email_verified: boolean;
  created_at: string;
  birth_date: string | null;
  venue_name?: string | null;
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

export async function registerUser(payload: RegisterPayload): Promise<{ ok: boolean; message: string; email: string; registration_token: string }> {
  return apiPost<{ ok: boolean; message: string; email: string; registration_token: string }>("/auth/register", payload, { skipAuth: true });
}

export type RegisterVenuePayload = {
  venue_name: string;
  email: string;
  password: string;
  claimed_place_id: number;    // ZORUNLU — Sistemdeki Google mekan ID'si
  contact_name?: string;       // Yetkili adı soyadı
  contact_phone?: string;      // Telefon
  notes?: string;              // Ek açıklama
};

export async function registerVenue(payload: RegisterVenuePayload): Promise<{ id: number; venue_name: string; email: string; status: string }> {
  return apiPost<{ id: number; venue_name: string; email: string; status: string }>("/auth/venue-register", payload, { skipAuth: true });
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

// --- Email Doğrulama ---

export async function verifyEmail(code: string): Promise<{ ok: boolean; message: string }> {
  return apiPost<{ ok: boolean; message: string }>("/auth/verify-email", { code });
}

export async function resendVerification(): Promise<{ ok: boolean; message: string }> {
  return apiPost<{ ok: boolean; message: string }>("/auth/resend-verification", {});
}

export async function verifyRegister(email: string, code: string, registrationToken?: string): Promise<AuthTokens> {
  return apiPost<AuthTokens>(
    "/auth/verify-register",
    { email, code, registration_token: registrationToken },
    { skipAuth: true },
  );
}

export async function resendRegisterCode(email: string): Promise<{ ok: boolean; message: string; registration_token: string }> {
  return apiPost<{ ok: boolean; message: string; registration_token: string }>("/auth/resend-register-code", { email }, { skipAuth: true });
}

// --- Şifre & Hesap ---

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  return apiPut<{ ok: boolean; message: string }>("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function deleteAccount(): Promise<{ ok: boolean; message: string }> {
  return apiDelete<{ ok: boolean; message: string }>("/auth/me");
}

export async function forgotPassword(email: string): Promise<{ ok: boolean; message: string }> {
  return apiPost<{ ok: boolean; message: string }>("/auth/forgot-password", { email }, { skipAuth: true });
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  return apiPost<{ ok: boolean; message: string }>("/auth/reset-password", { email, code, new_password: newPassword }, { skipAuth: true });
}

// --- Sosyal Giriş ---

export async function googleLogin(token: string): Promise<AuthTokens> {
  return apiPost<AuthTokens>("/auth/google", { token }, { skipAuth: true });
}

export async function appleLogin(
  token: string,
  fullName?: { firstName?: string; lastName?: string }
): Promise<AuthTokens> {
  return apiPost<AuthTokens>("/auth/apple", { token, full_name: fullName }, { skipAuth: true });
}
