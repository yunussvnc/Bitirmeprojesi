/**
 * Mekan Service
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { Mekan, OneriRequest, OneriResponse } from '../types';

export const mekanService = {
    /**
     * Tüm mekanları listele
     */
    async getMekanlar(skip: number = 0, limit: number = 100, kategori?: string): Promise<Mekan[]> {
        const params: any = { skip, limit };
        if (kategori) {
            params.kategori = kategori;
        }

        const response = await apiClient.get<Mekan[]>(API_ENDPOINTS.MEKANLAR.LIST, { params });
        return response.data;
    },

    /**
     * Belirli bir mekanı getir
     */
    async getMekanById(id: number): Promise<Mekan> {
        const response = await apiClient.get<Mekan>(API_ENDPOINTS.MEKANLAR.DETAIL(id));
        return response.data;
    },

    /**
     * Yeni mekan oluştur
     */
    async createMekan(mekan: Partial<Mekan>): Promise<Mekan> {
        const response = await apiClient.post<Mekan>(API_ENDPOINTS.MEKANLAR.CREATE, mekan);
        return response.data;
    },

    /**
     * Mekan güncelle
     */
    async updateMekan(id: number, mekan: Partial<Mekan>): Promise<Mekan> {
        const response = await apiClient.put<Mekan>(API_ENDPOINTS.MEKANLAR.UPDATE(id), mekan);
        return response.data;
    },

    /**
     * Mekan sil
     */
    async deleteMekan(id: number): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.MEKANLAR.DELETE(id));
    },

    /**
     * Kişiselleştirilmiş mekan önerileri al
     */
    async getOneriler(request: OneriRequest): Promise<OneriResponse> {
        const response = await apiClient.post<OneriResponse>(
            API_ENDPOINTS.ONERILER.GET,
            request
        );
        return response.data;
    },
};

