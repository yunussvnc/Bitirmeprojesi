/**
 * Authentication Service
 */

import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_ENDPOINTS } from '../utils/constants';
import { LoginCredentials, RegisterData, User, AuthResponse } from '../types';

export const authService = {
    /**
     * Kullanıcı girişi
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await apiClient.post<AuthResponse>(
            API_ENDPOINTS.AUTH.LOGIN,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        // Token'ı sakla
        if (response.data.access_token) {
            await AsyncStorage.setItem(
                STORAGE_KEYS.ACCESS_TOKEN,
                response.data.access_token
            );
        }

        return response.data;
    },

    /**
     * Kullanıcı kaydı
     */
    async register(data: RegisterData): Promise<User> {
        const response = await apiClient.post<User>(API_ENDPOINTS.AUTH.REGISTER, data);
        return response.data;
    },

    /**
     * Kullanıcı çıkışı
     */
    async logout(): Promise<void> {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.ACCESS_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_DATA,
        ]);
    },

    /**
     * Mevcut token'ı kontrol et
     */
    async getStoredToken(): Promise<string | null> {
        return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    },

    /**
     * Kullanıcı bilgilerini sakla
     */
    async saveUserData(user: User): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    },

    /**
     * Saklanan kullanıcı bilgilerini getir
     */
    async getUserData(): Promise<User | null> {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    },
};

