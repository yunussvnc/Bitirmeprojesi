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
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
} from "react-native-reanimated";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
      style={[styles.chip, active && styles.chipActive]}
    >
      {active ? (
        <LinearGradient
          colors={["#FF6B9D", "#C44569"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chipGradient}
        >
          <ThemedText style={styles.chipTextActive}>{label}</ThemedText>
        </LinearGradient>
      ) : (
        <ThemedText style={styles.chipText}>{label}</ThemedText>
      )}
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

  // 3D Animation values
  const rotateY = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotateY.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      false
    );
    rotateX.value = withRepeat(
      withSpring(15, { damping: 10 }),
      -1,
      true
    );
    translateY.value = withRepeat(
      withSpring(10, { damping: 8 }),
      -1,
      true
    );
    scale.value = withRepeat(
      withSpring(1.1, { damping: 6 }),
      -1,
      true
    );
  }, [rotateY, rotateX, translateY, scale]);

  const animated3DStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY.value}deg` },
        { rotateX: `${rotateX.value}deg` },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#FFFFFF", dark: "#1A1A1A" }}
      headerImage={
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={["#FFF5F7", "#F8F9FA", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          />
          {/* 3D Chatbot Icon */}
          <Animated.View style={[styles.chatbot3DContainer, animated3DStyle]}>
            <View style={styles.chatbot3D}>
              <LinearGradient
                colors={["#FF6B9D", "#C44569", "#FF6B9D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chatbot3DGradient}
              >
                <View style={styles.chatbot3DFace}>
                  <View style={styles.chatbot3DEye} />
                  <View style={styles.chatbot3DEye} />
                  <View style={styles.chatbot3DMouth} />
                </View>
                {/* 3D Depth Effect */}
                <View style={styles.chatbot3DShadow} />
              </LinearGradient>
            </View>
          </Animated.View>
        </View>
      }
    >
      {/* Başlık */}
      <ThemedView style={styles.titleContainer}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={styles.title}>
            Chatbot
          </ThemedText>
          <ThemedText style={styles.subtitle}>AI destekli mekan önerisi chatbot.</ThemedText>
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
        <BlurView intensity={20} style={styles.inputContainer}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ne arıyorsun? (örn: sessiz çalışmalık kafe)"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </BlurView>
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
      <BlurView intensity={20} style={styles.filterCard}>
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
      </BlurView>

      <TouchableOpacity
        onPress={runRecommend}
        activeOpacity={0.85}
        style={styles.recommendBtn}
        disabled={loading}
      >
        <LinearGradient
          colors={loading ? ["#D1D5DB", "#9CA3AF"] : ["#FF6B9D", "#C44569"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.recommendBtnGradient}
        >
          <ThemedText type="defaultSemiBold" style={styles.recommendBtnText}>
            {loading ? "Öneriler hazırlanıyor..." : "Öneri getir"}
          </ThemedText>
        </LinearGradient>
      </TouchableOpacity>

      {loading && (
        <View style={{ marginTop: 10, alignItems: "flex-start" }}>
          <ActivityIndicator />
        </View>
      )}

      {!!error && (
        <ThemedText style={{ marginTop: 10, opacity: 0.85 }}>Hata: {error}</ThemedText>
      )}

      {/* LLM açıklaması */}
      {
        !!explanation && (
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
        )
      }

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
    </ParallaxScrollView >
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  headerGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  chatbot3DContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 120,
    height: 120,
    marginLeft: -60,
    marginTop: -60,
    zIndex: 10,
  },
  chatbot3D: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  chatbot3DGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  chatbot3DFace: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  chatbot3DEye: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chatbot3DMouth: {
    width: 24,
    height: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chatbot3DShadow: {
    position: "absolute",
    bottom: -10,
    left: "20%",
    right: "20%",
    height: 20,
    borderRadius: 50,
    backgroundColor: "rgba(255, 107, 157, 0.2)",
    transform: [{ scaleY: 0.5 }],
  },

  titleContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: { fontFamily: Fonts.rounded, color: "#1A1A1A" },
  subtitle: { color: "#888", marginTop: 6 },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  pillText: { fontSize: 12, color: "#666" },

  debugLink: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  },
  debugLinkText: { color: "#888", fontSize: 13 },

  helper: { opacity: 0.5, marginTop: 8, fontSize: 13 },

  inputContainer: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    color: "#1A1A1A",
    fontSize: 15,
    backgroundColor: "transparent",
  },

  badgeRowTop: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
  },
  badgeText: { fontSize: 12, color: "#666" },

  filterCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resetText: { opacity: 0.65, fontSize: 13 },

  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    borderRadius: 20,
    overflow: "hidden",
  },
  chipActive: {
    borderWidth: 0,
  },
  chipGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipText: {
    fontFamily: Fonts.rounded,
    fontSize: 13,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    color: "#666",
  },
  chipTextActive: {
    fontFamily: Fonts.rounded,
    fontSize: 13,
    color: "#fff",
  },

  recommendBtn: {
    marginTop: 14,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendBtnGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  recommendBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  miniPillText: { fontSize: 12, color: "#666" },

  aiMetaRow: { marginTop: 12, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  aiMetaBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8F9FA",
    minWidth: 150,
  },
  aiMetaLabel: { color: "#888", fontSize: 12 },
  aiMetaValue: { marginTop: 4, fontSize: 13, color: "#1A1A1A" },

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