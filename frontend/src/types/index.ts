/**
 * TypeScript Tip Tanımları
 */

// Kullanıcı Tipleri
export interface User {
    id: number;
    email: string;
    username: string;
    full_name?: string;
    is_active: boolean;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    full_name?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

// Mekan Tipleri
export interface Mekan {
    id: number;
    ad: string;
    aciklama?: string;
    kategori?: string;
    enlem: number;
    boylam: number;
    adres?: string;
    telefon?: string;
    email?: string;
    website?: string;
    created_at: string;
}

// Öneri Tipleri
export interface MekanOneri {
    mekan_id: number;
    ad: string;
    aciklama: string;
    kategori: string;
    enlem: number;
    boylam: number;
    adres: string;
    benzerlik_skoru: number;
    gerekce: string;
}

export interface OneriRequest {
    kullanici_metni: string;
    enlem: number;
    boylam: number;
    kategori?: string;
}

export interface OneriResponse {
    oneriler: MekanOneri[];
    sorgu_analizi: string;
}

// Konum Tipleri
export interface Location {
    latitude: number;
    longitude: number;
}

// Navigation Tipleri
export type RootStackParamList = {
    Auth: undefined;
    Login: undefined;
    Register: undefined;
    Main: undefined;
    Home: undefined;
    Mekanlar: undefined;
    MekanDetail: { mekanId: number };
    Oneriler: undefined;
    Profile: undefined;
};

