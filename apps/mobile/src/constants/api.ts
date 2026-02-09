// apps/mobile/src/constants/api.ts

// ⚠️ ÖNEMLİ: Expo Go simulator kullanıyorsanız localhost, gerçek telefon için Mac'inizin IP'sini kullanın
// Mac IP'nizi bulmak için: System Preferences > Network veya terminal'de: ifconfig | grep "inet "

// Simulator/Emulator için (Expo Go iOS/Android simulator):
// export const API_BASE_URL = "http://localhost:8000";

// Gerçek telefon için (Mac'inizin IP'sini buraya yazın):
export const API_BASE_URL = "http://192.168.1.9:8000";

// Bazı eski servisler API_V1 kullanıyor olabilir.
// Backend'te /api/v1 yoksa kırılmaması için güvenli tutuyoruz.
export const API_V1 = API_BASE_URL;