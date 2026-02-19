import type { RecommendRequest, RecommendResponse } from "../types/recommend";
import { apiPost } from "@/src/utils/apiClient";
import { logger } from "@/src/utils/logger";

export async function recommendPlaces(
  req: RecommendRequest
): Promise<RecommendResponse> {
  try {
    return await apiPost<RecommendResponse>("/recommend", req);
  } catch (error) {
    logger.error("[recommendPlaces] Error:", error);
    throw error;
  }
}
