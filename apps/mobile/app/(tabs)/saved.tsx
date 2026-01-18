import { Link } from "expo-router";
import { useMemo } from "react";
import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

import { useSavedPlaces } from "@/src/state/savedPlaces";
import { getPlaceImageSource } from "@/src/utils/placeImages";

function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <ThemedText type="defaultSemiBold" style={styles.pillText}>
        {text}
      </ThemedText>
    </View>
  );
}

export default function SavedScreen() {
  const ids = useSavedPlaces((s) => s.ids);
  const byId = useSavedPlaces((s) => s.byId);
  const clear = useSavedPlaces((s) => s.clear);
  const remove = useSavedPlaces((s) => s.remove);

  const items = useMemo(
    () => ids.map((id) => byId[id]).filter(Boolean),
    [ids, byId]
  );

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
          <IconSymbol
            size={310}
            color="rgba(255, 107, 157, 0.2)"
            name="bookmark.fill"
            style={styles.headerIcon}
          />
        </View>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={styles.title}>
            Saved
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Kaydettiğin mekanlar burada.
          </ThemedText>
        </View>

        <View style={{ alignItems: "flex-end", gap: 8 }}>
          <Pill text={`${items.length} kayıt`} />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (!items.length) return;
              Alert.alert("Temizle?", "Tüm kaydedilen mekanlar silinsin mi?", [
                { text: "Vazgeç", style: "cancel" },
                { text: "Sil", style: "destructive", onPress: clear },
              ]);
            }}
            style={[styles.clearBtn, !items.length && { opacity: 0.45 }]}
            disabled={!items.length}
          >
            <LinearGradient
              colors={!items.length ? ["#D1D5DB", "#9CA3AF"] : ["#FF6B9D", "#C44569"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.clearBtnGradient}
            >
              <ThemedText type="defaultSemiBold" style={styles.clearBtnText}>
                Temizle
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {!items.length ? (
        <View style={styles.emptyWrap}>
          <BlurView intensity={20} style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <LinearGradient
                colors={["#FF6B9D", "#C44569"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconGradient}
              >
                <IconSymbol size={32} color="#fff" name="bookmark" />
              </LinearGradient>
            </View>

            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              Henüz kayıt yok
            </ThemedText>

            <ThemedText style={styles.emptyText}>
              Explore'dan beğendiğin mekanları "Kaydet" diyerek buraya ekleyebilirsin.
            </ThemedText>

            <Link href="/(tabs)/explore" asChild>
              <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnGradient}
                >
                  <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>
                    Explore'a git
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </Link>
          </BlurView>

          <ThemedText style={styles.emptyHint}>
            İpucu: Kaydettiğin mekanlar uygulama kapanınca da kalır (persist).
          </ThemedText>
        </View>
      ) : (
        <View style={{ marginTop: 14, gap: 12 }}>
          <View style={styles.resultsHeader}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
              Kaydedilenler
            </ThemedText>
            <ThemedText style={{ opacity: 0.6 }}>{items.length}</ThemedText>
          </View>

          {items.map((p, idx) => (
            <View key={p.id} style={styles.cardWrap}>
              <Link
                href={{ pathname: "/place/[id]", params: { id: String(p.id) } }}
                asChild
              >
                <TouchableOpacity activeOpacity={0.92} style={styles.card}>
                  <Image
                    source={getPlaceImageSource(p.id)}
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

                    <View style={styles.savedPill}>
                      <ThemedText type="defaultSemiBold" style={styles.savedText}>
                        Saved
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                      {p.name}
                    </ThemedText>

                    {!!p.subtitle && (
                      <ThemedText style={styles.cardSubtitle}>{p.subtitle}</ThemedText>
                    )}

                    <View style={styles.cardHintRow}>
                      <ThemedText style={styles.cardHint}>Detayı gör</ThemedText>
                      <ThemedText style={styles.cardHint}>›</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              </Link>

              {/* ✅ Kaldır butonu da üstte kalsın (çifte yazı/üst üste binme hissini çözer) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => remove(p.id)}
                style={styles.removeBtn}
              >
                <ThemedText type="defaultSemiBold" style={{ fontSize: 12 }}>
                  Kaldır
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerWrap: { flex: 1, justifyContent: "flex-end", position: "relative" },
  headerGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  headerIcon: { bottom: -90, left: -35, position: "absolute", opacity: 0.9 },

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

  clearBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#f093fb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  clearBtnGradient: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    fontSize: 13,
    color: "#fff",
  },

  emptyWrap: { marginTop: 14, gap: 12 },
  emptyCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, color: "#1A1A1A", fontWeight: "700", marginBottom: 8 },
  emptyText: { color: "#666", marginTop: 8, lineHeight: 20, fontSize: 14 },
  emptyHint: { color: "#888", fontSize: 12, lineHeight: 16 },

  primaryBtn: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "flex-start",
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
  },

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

  savedPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  savedText: { fontSize: 12, opacity: 0.9 },

  cardContent: {
    padding: 16,
    paddingTop: 12,
    justifyContent: "flex-end",
    minHeight: 172,
  },
  cardTitle: { fontSize: 18 },
  cardSubtitle: { opacity: 0.84, marginTop: 6, lineHeight: 18 },

  removeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.26)",
    opacity: 0.95,

    // ✅ üstte kalsın
    zIndex: 50,
    elevation: 50,
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