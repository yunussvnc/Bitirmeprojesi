/**
 * Yardımcı Fonksiyonlar
 */

import { Location } from '../types';

/**
 * İki konum arasındaki mesafeyi hesaplar (kilometre cinsinden)
 */
export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // 1 ondalık basamak
};

const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};

/**
 * Mesafeyi formatlar (örn: "1.5 km", "500 m")
 */
export const formatDistance = (distanceInKm: number): string => {
    if (distanceInKm < 1) {
        return `${Math.round(distanceInKm * 1000)} m`;
    }
    return `${distanceInKm.toFixed(1)} km`;
};

/**
 * Tarihi formatlar (örn: "2 gün önce", "1 saat önce")
 */
export const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Az önce';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} dakika önce`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} saat önce`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} gün önce`;
    }

    return then.toLocaleDateString('tr-TR');
};

/**
 * Email formatını kontrol eder
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Güvenli şifre kontrolü
 */
export const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
};

