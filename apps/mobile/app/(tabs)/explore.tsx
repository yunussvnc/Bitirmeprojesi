// apps/mobile/app/(tabs)/explore.tsx

import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

import { recommendPlaces } from "../../src/services/api";
import { usePreferences } from "../../src/state/preferences";
import type { PlaceCard, Preferences, RecommendResponse } from "../../src/types/recommend";

import { useSavedPlaces } from "@/src/state/savedPlaces";
import { getPlaceImageSource } from "@/src/utils/placeImages";

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <ThemedText style={styles.chipText}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View style={styles.badge}>
      <ThemedText type="defaultSemiBold" style={styles.badgeText}>
        {text}
      </ThemedText>
    </View>
  );
}

function prefsToBadges(p: Preferences) {
  const vibe = p.vibe === "quiet" ? "Sessiz" : "Canlı";
  const purpose =
    p.purpose === "work" ? "Çalışma" : p.purpose === "friends" ? "Arkadaş" : "Date";
  const budget =
    p.budget === "low" ? "₺ Düşük" : p.budget === "mid" ? "₺₺ Orta" : "₺₺₺ Yüksek";
  return [vibe, purpose, budget];
}

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const { prefs, patchPrefs, resetPrefs } = usePreferences();

  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string>("");
  const [items, setItems] = useState<PlaceCard[]>([]);
  const [error, setError] = useState<string>("");

  // ✅ ÖNEMLİ: Kaydet/Kaydedildi anında değişsin diye ids'e subscribe oluyoruz.
  const savedIds = useSavedPlaces((s) => s.ids);
  const toggle = useSavedPlaces((s) => s.toggle);

  const requestBody = useMemo(
    () => ({
      queryText: query,
      preferences: prefs,
    }),
    [query, prefs]
  );

  async function runRecommend() {
    try {
      setError("");
      setLoading(true);
      const res: RecommendResponse = await recommendPlaces(requestBody);
      setItems(res.items);
      setExplanation(res.explanation);
    } catch (e: any) {
      setError(e?.message ?? "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runRecommend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topBadges = useMemo(() => prefsToBadges(prefs), [prefs]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <View style={styles.headerWrap}>
          <IconSymbol
            size={310}
            color="#808080"
            name="sparkles"
            style={styles.headerIcon}
          />
          <View style={styles.headerOverlay} />
        </View>
      }
    >
      {/* Başlık */}
      <ThemedView style={styles.titleContainer}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={styles.title}>
            Explore
          </ThemedText>
          <ThemedText style={styles.subtitle}>Tercihlerine göre öneri listesi.</ThemedText>
        </View>

        <View style={styles.pill}>
          <ThemedText type="defaultSemiBold" style={styles.pillText}>
            {items.length} sonuç
          </ThemedText>
        </View>
      </ThemedView>

      {/* ✅ API Debug ekranına geçiş (typed-routes tip hatası yok) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/debug-api" as any)}
        style={styles.debugLink}
      >
        <ThemedText style={styles.debugLinkText}>API Debug ekranına git →</ThemedText>
      </TouchableOpacity>

      {/* Prompt input */}
      <View style={{ marginTop: 14 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ne arıyorsun? (örn: sessiz çalışmalık kafe)"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
        />
        <ThemedText style={styles.helper}>
          Yaz veya chip’lerle filtrele. Sonra “Öneri getir”e bas.
        </ThemedText>

        <View style={styles.badgeRowTop}>
          {topBadges.map((b) => (
            <Badge key={b} text={b} />
          ))}
        </View>
      </View>

      {/* Filtre kartı */}
      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            Filtreler
          </ThemedText>

          <TouchableOpacity
            onPress={() => {
              resetPrefs();
              setTimeout(() => runRecommend(), 0);
            }}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.resetText}>Temizle</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12, gap: 14 }}>
          <View style={{ gap: 10 }}>
            <ThemedText type="defaultSemiBold">Vibe</ThemedText>
            <View style={styles.rowWrap}>
              <Chip
                label="Sessiz"
                active={prefs.vibe === "quiet"}
                onPress={() => {
                  patchPrefs({ vibe: "quiet" });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Canlı"
                active={prefs.vibe === "lively"}
                onPress={() => {
                  patchPrefs({ vibe: "lively" });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <ThemedText type="defaultSemiBold">Amaç</ThemedText>
            <View style={styles.rowWrap}>
              <Chip
                label="Çalışma"
                active={prefs.purpose === "work"}
                onPress={() => {
                  patchPrefs({ purpose: "work" });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Arkadaş"
                active={prefs.purpose === "friends"}
                onPress={() => {
                  patchPrefs({ purpose: "friends" });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Date"
                active={prefs.purpose === "date"}
                onPress={() => {
                  patchPrefs({ purpose: "date" });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <ThemedText type="defaultSemiBold">Bütçe</ThemedText>
            <View style={styles.rowWrap}>
              <Chip
                label="Düşük"
                active={prefs.budget === "low"}
                onPress={() => {
                  patchPrefs({ budget: "low" });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Orta"
                active={prefs.budget === "mid"}
                onPress={() => {
                  patchPrefs({ budget: "mid" });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Yüksek"
                active={prefs.budget === "high"}
                onPress={() => {
                  patchPrefs({ budget: "high" });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={runRecommend}
          activeOpacity={0.85}
          style={styles.recommendBtn}
          disabled={loading}
        >
          <ThemedText type="defaultSemiBold">
            {loading ? "Öneriler hazırlanıyor..." : "Öneri getir"}
          </ThemedText>
        </TouchableOpacity>

        {loading && (
          <View style={{ marginTop: 10, alignItems: "flex-start" }}>
            <ActivityIndicator />
          </View>
        )}

        {!!error && (
          <ThemedText style={{ marginTop: 10, opacity: 0.85 }}>Hata: {error}</ThemedText>
        )}
      </View>

      {/* LLM açıklaması */}
      {!!explanation && (
        <View style={styles.explainCard}>
          <View style={styles.explainHeaderRow}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
              Neden bu öneriler?
            </ThemedText>
            <View style={styles.miniPill}>
              <ThemedText type="defaultSemiBold" style={styles.miniPillText}>
                Demo AI
              </ThemedText>
            </View>
          </View>

          <ThemedText style={{ opacity: 0.85, marginTop: 8, lineHeight: 22 }}>
            {explanation}
          </ThemedText>

          <View style={styles.aiMetaRow}>
            <View style={styles.aiMetaBox}>
              <ThemedText style={styles.aiMetaLabel}>Confidence</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.aiMetaValue}>
                Orta
              </ThemedText>
            </View>
            <View style={styles.aiMetaBox}>
              <ThemedText style={styles.aiMetaLabel}>Trade-off</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.aiMetaValue}>
                Ambiyans ↔ fiyat
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Sonuçlar */}
      <View style={{ marginTop: 18, gap: 12 }}>
        <View style={styles.resultsHeader}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            Sonuçlar
          </ThemedText>
          <ThemedText style={{ opacity: 0.6 }}>{items.length}</ThemedText>
        </View>

        {items.map((place, idx) => {
          const id = String((place as any).id);
          const saved = savedIds.includes(id);

          return (
            <View key={id} style={styles.cardWrap}>
              {/* Kart tıklanınca detay sayfasına git */}
              <TouchableOpacity
                activeOpacity={0.92}
                style={styles.card}
                onPress={() =>
                  router.push({ pathname: "/place/[id]", params: { id } } as any)
                }
              >
                <Image
                  source={getPlaceImageSource(id)}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.cardImageOverlay} />

                <View style={styles.cardTopRow}>
                  <View style={styles.rankPill}>
                    <ThemedText type="defaultSemiBold" style={styles.rankText}>
                      #{idx + 1}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                    {place.name}
                  </ThemedText>

                  <ThemedText style={styles.cardSubtitle}>{place.subtitle}</ThemedText>

                  {!!place.tags?.length && (
                    <View style={styles.badgeRow}>
                      {place.tags.slice(0, 3).map((t) => (
                        <View key={t} style={styles.tinyTag}>
                          <ThemedText style={styles.tinyTagText}>{t}</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardHintRow}>
                    <ThemedText style={styles.cardHint}>Detayı gör</ThemedText>
                    <ThemedText style={styles.cardHint}>›</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Save butonu */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  toggle({
                    id,
                    name: place.name,
                    subtitle: place.subtitle,
                  })
                }
                style={[styles.saveBtn, saved ? styles.saveBtnActive : styles.saveBtnInactive]}
              >
                <ThemedText type="defaultSemiBold" style={{ fontSize: 12 }}>
                  {saved ? "Kaydedildi" : "Kaydet"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          );
        })}

        {!loading && items.length === 0 && (
          <ThemedText style={{ opacity: 0.7 }}>
            Uygun sonuç yok. Chip’leri değiştirip tekrar dene.
          </ThemedText>
        )}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerWrap: { flex: 1, justifyContent: "flex-end" },
  headerIcon: { bottom: -90, left: -35, position: "absolute", opacity: 0.9 },
  headerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  titleContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: { fontFamily: Fonts.rounded },
  subtitle: { opacity: 0.7, marginTop: 6 },

  pill: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  pillText: { fontSize: 12 },

  debugLink: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  debugLinkText: { opacity: 0.75, fontSize: 13 },

  helper: { opacity: 0.5, marginTop: 8, fontSize: 13 },

  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    color: "white",
    fontSize: 15,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  badgeRowTop: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  badgeText: { fontSize: 12 },

  filterCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resetText: { opacity: 0.65, fontSize: 13 },

  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.08)",
    opacity: 1,
  },
  chipInactive: {
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.02)",
    opacity: 0.8,
  },
  chipText: { fontFamily: Fonts.rounded, fontSize: 13 },

  recommendBtn: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },

  explainCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  explainHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  miniPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  miniPillText: { fontSize: 12, opacity: 0.85 },

  aiMetaRow: { marginTop: 12, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  aiMetaBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.03)",
    minWidth: 150,
  },
  aiMetaLabel: { opacity: 0.55, fontSize: 12 },
  aiMetaValue: { marginTop: 4, fontSize: 13 },

  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardWrap: { position: "relative" },

  card: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    minHeight: 172,
  },

  cardImage: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.98,
  },
  cardImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  cardTopRow: {
    padding: 14,
    paddingBottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rankPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  rankText: { fontSize: 12, opacity: 0.9 },

  cardContent: {
    padding: 16,
    paddingTop: 12,
    justifyContent: "flex-end",
    minHeight: 172,
  },
  cardTitle: { fontSize: 18 },
  cardSubtitle: { opacity: 0.84, marginTop: 6, lineHeight: 18 },

  badgeRow: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tinyTag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  tinyTagText: { fontSize: 12, opacity: 0.85 },

  saveBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 50,
    elevation: 50,
  },
  saveBtnActive: {
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.12)",
    opacity: 1,
  },
  saveBtnInactive: {
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.26)",
    opacity: 0.95,
  },

  cardHintRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    opacity: 0.75,
  },
  cardHint: { fontSize: 13 },
});