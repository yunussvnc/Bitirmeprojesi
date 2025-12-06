/**
 * Uygulama Sabitleri
 */

// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
export const API_V1_URL = `${API_BASE_URL}/api/v1`;

// Storage Keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: '@mekan_onerisi:access_token',
    REFRESH_TOKEN: '@mekan_onerisi:refresh_token',
    USER_DATA: '@mekan_onerisi:user_data',
};

// Mekan Kategorileri
export const MEKAN_KATEGORILERI = [
    'Restoran',
    'Kafe',
    'Bar',
    'Park',
    'Müze',
    'Sinema',
    'Tiyatro',
    'Alışveriş',
    'Otel',
    'Diğer',
];

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
    },
    MEKANLAR: {
        LIST: '/mekanlar',
        DETAIL: (id: number) => `/mekanlar/${id}`,
        CREATE: '/mekanlar',
        UPDATE: (id: number) => `/mekanlar/${id}`,
        DELETE: (id: number) => `/mekanlar/${id}`,
    },
    ONERILER: {
        GET: '/oneriler',
    },
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'İnternet bağlantınızı kontrol edin',
    UNAUTHORIZED: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın',
    NOT_FOUND: 'İstenen kayıt bulunamadı',
    SERVER_ERROR: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin',
    UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu',
};

