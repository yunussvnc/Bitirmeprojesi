// apps/mobile/src/constants/api.ts

// Expo Go telefondan erişim için: Mac'in LAN IP'si
export const API_BASE_URL = "http://192.168.1.103:8000";

// Bazı eski servisler API_V1 kullanıyor olabilir.
// Backend'te /api/v1 yoksa kırılmaması için güvenli tutuyoruz.
export const API_V1 = API_BASE_URL;