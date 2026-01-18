// apps/mobile/src/services/mekanService.ts
import { API_BASE_URL } from "@/src/constants/api";

export type Place = {
  id: number | string;
  name: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
};

function normalizePlace(p: any): Place {
  const id = p?.id ?? p?._id ?? p?.place_id ?? String(Math.random());
  const name = String(p?.name ?? p?.title ?? p?.mekan_adi ?? "Mekan");
  const description = p?.description ?? p?.aciklama ?? "";
  const subtitle =
    p?.subtitle ??
    (description ? String(description).slice(0, 80) : undefined);

  const tags = Array.isArray(p?.tags) ? p.tags : undefined;

  return { id, name, subtitle, description, tags };
}

export async function getPlaces(): Promise<Place[]> {
  const urls = [`${API_BASE_URL}/places`, `${API_BASE_URL}/places/`];

  let lastErr: any = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error: ${res.status} ${text}`);
      }

      const data = await res.json();

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];

      return arr.map(normalizePlace);
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr ?? new Error("Places alınamadı");
}