import type { RecommendRequest, RecommendResponse } from "../types/recommend";

const MOCK_MODE = true;

// Utku backend’i hazır olunca burayı değiştir:
// örn: http://192.168.1.50:8000
const BASE_URL = "http://localhost:8000";

const MOCK_PLACES = [
  { id: 1, name: "Cafe Luna", subtitle: "Sessiz, çalışmalık", tags: ["quiet", "work", "mid"] },
  { id: 2, name: "Bar 212", subtitle: "Akşam canlı, arkadaşlarla", tags: ["lively", "friends", "high"] },
  { id: 3, name: "Kahve Durağı", subtitle: "Uygun fiyatlı", tags: ["cheap", "low"] },
  { id: 4, name: "Study Hub", subtitle: "Laptop dostu, sakin", tags: ["quiet", "work", "mid"] },
  { id: 5, name: "Date Corner", subtitle: "Romantik, sakin", tags: ["quiet", "date", "high"] },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mockRecommend(req: RecommendRequest): RecommendResponse {
  const q = req.queryText.trim().toLowerCase();

  const items = MOCK_PLACES.filter((p) => {
    const text = `${p.name} ${p.subtitle}`.toLowerCase();
    const matchesQuery = !q || text.includes(q);

    const matchesVibe = p.tags.includes(req.preferences.vibe);

    const matchesPurpose =
      p.tags.includes(req.preferences.purpose) ||
      (req.preferences.purpose === "friends" && p.tags.includes("friends"));

    const matchesBudget =
      req.preferences.budget === "low"
        ? p.tags.includes("low") || p.tags.includes("cheap")
        : req.preferences.budget === "mid"
        ? p.tags.includes("mid")
        : p.tags.includes("high");

    return matchesQuery && matchesVibe && matchesPurpose && matchesBudget;
  });

  const explanation = `“${req.queryText || "Genel arama"}” isteğin için ${
    req.preferences.vibe === "quiet" ? "sessiz" : "canlı"
  } ortam, ${
    req.preferences.purpose === "work"
      ? "çalışma"
      : req.preferences.purpose === "friends"
      ? "arkadaş buluşması"
      : "date"
  } amacı ve ${
    req.preferences.budget === "low"
      ? "düşük"
      : req.preferences.budget === "mid"
      ? "orta"
      : "yüksek"
  } bütçeye göre filtreledim.`;

  return { items, explanation };
}

export async function recommendPlaces(req: RecommendRequest): Promise<RecommendResponse> {
  if (MOCK_MODE) {
    await sleep(450); // demo “yükleniyor” hissi
    return mockRecommend(req);
  }

  const res = await fetch(`${BASE_URL}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error: ${res.status} ${text}`);
  }

  return (await res.json()) as RecommendResponse;
}
