/**
 * API Service
 * 
 * Centralized API client for recommendation endpoints.
 * Uses the apiClient utility for consistent error handling and retry logic.
 * 
 * @module services/api
 */

import type { RecommendRequest, RecommendResponse } from "../types/recommend";
import { apiPost } from "@/src/utils/apiClient";
import { logger } from "@/src/utils/logger";

/**
 * Get AI-powered place recommendations
 * 
 * @param req - Recommendation request with query and preferences
 * @returns Recommendation response with items and explanation
 */
export async function recommendPlaces(
  req: RecommendRequest
): Promise<RecommendResponse> {
  try {
    return await apiPost<RecommendResponse>('/recommend', req);
  } catch (error) {
    logger.error('[recommendPlaces] Error:', error);
    throw error;
  }
}
