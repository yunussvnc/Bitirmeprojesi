// apps/mobile/src/services/mekanService.ts
import { API_V1 } from "@/constants/api";

export type Mekan = {
  id: number;
  name: string;
  description?: string;
};

export async function getMekanlar(): Promise<Mekan[]> {
  const response = await fetch(`${API_V1}/mekanlar`);

  if (!response.ok) {
    throw new Error("Mekanlar alınamadı");
  }

  return response.json();
}