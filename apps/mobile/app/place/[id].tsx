import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

import { useSavedPlaces } from "@/src/state/savedPlaces";
import { getPlaceImageSource } from "@/src/utils/placeImages";

type ActiveSession = {
  placeId: string;
  activeUntil: number; // epoch ms
};

const ACTIVE_SESSION_KEY = "active-session-v1"; // sadece okumaya çalışıyoruz (yoksa sıkıntı değil)

function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <ThemedText type="defaultSemiBold" style={styles.pillText}>
        {text}
      </ThemedText>
    </View>
  );
}

export default function PlaceDetailScreen() {
  const params = useLocalSearchParams();
  const id = String(params?.id ?? "");

  // ✅ Save toggle anında güncellensin diye ids'e subscribe
  const savedIds = useSavedPlaces((s) => s.ids);
  const toggleSaved = useSavedPlaces((s) => s.toggle);
  const saved = savedIds.includes(id);

  // ✅ QR aktiflik: varsa storage’dan oku, yoksa “aktif değil”
  const [active, setActive] = useState(false);
  const [activeUntil, setActiveUntil] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw) as Partial<ActiveSession>;
        const placeId = String(parsed.placeId ?? "");
        const until = Number(parsed.activeUntil ?? 0);

        const isActive = placeId === id && until > Date.now();

        if (mounted) {
          setActive(isActive);
          setActiveUntil(until > 0 ? until : null);
        }
      } catch {
        // sessiz geç
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const heroSource = useMemo(() => getPlaceImageSource(id), [id]);

  // Demo alternatifler: 1..6 arasından mevcut id hariç
  const alternatives = useMemo(() => {
    const current = Number(id);
    const candidates = [1, 2, 3, 4, 5, 6].filter(
      (x) => String(x) !== id && (!Number.isFinite(current) || x !== current)
    );
    return candidates.slice(0, 3).map(String);
  }, [id]);

  const activeText = useMemo(() => {
    if (!active) return "Aktif değil";
    if (!activeUntil) return "Aktif";
    const mins = Math.max(0, Math.floor((activeUntil - Date.now()) / 60000));
    return mins >= 1 ? `Aktif • ${mins} dk` : "Aktif";
  }, [active, activeUntil]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <View style={styles.heroWrap}>
          <Image source={heroSource} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroLeftPill}>
              <IconSymbol size={14} color="#fff" name="mappin.and.ellipse" />
              <ThemedText type="defaultSemiBold" style={styles.heroLeftText}>
                Mekan #{id}
              </ThemedText>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                toggleSaved({
                  id,
                  name: `Mekan #${id}`,
                  subtitle: "Detay ekranı (demo) — backend gelince zenginleşecek.",
                })
              }
              style={[
                styles.saveBtn,
                saved ? styles.saveBtnActive : styles.saveBtnInactive,
              ]}
            >
              <ThemedText type="defaultSemiBold" style={{ fontSize: 12 }}>
                {saved ? "Kaydedildi" : "Kaydet"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      }
    >
      {/* Başlık */}
      <ThemedView style={styles.titleContainer}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={styles.title}>
            Mekan #{id}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Detay ekranı (demo) — backend gelince zenginleşecek.
          </ThemedText>
        </View>
      </ThemedView>

      {/* Hızlı aksiyonlar */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/explore")}
          style={styles.actionBtn}
        >
          <ThemedText type="defaultSemiBold">Keşfet’e dön</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/saved")}
          style={styles.actionBtn}
        >
          <ThemedText type="defaultSemiBold">Saved’e git</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/scan")}
          style={styles.actionBtn}
        >
          <ThemedText type="defaultSemiBold">Scan’e git</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Mekânda Aktiflik */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            Mekânda Aktiflik
          </ThemedText>

          <View style={[styles.statusPill, active ? styles.statusOn : styles.statusOff]}>
            <ThemedText type="defaultSemiBold" style={styles.statusText}>
              {activeText}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.sectionDesc}>
          Yorum/puan/feedback vermek için masadaki QR’ı okutman gerekiyor (2 saat aktif).
        </ThemedText>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/scan")}
          style={styles.primaryBtn}
        >
          <ThemedText type="defaultSemiBold">QR Okut (Scan’e git)</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.tinyHint}>
          Not: Gerçekte telefon kamerasından okutunca uygulama otomatik açılacak (deep link).
        </ThemedText>
      </View>

      {/* Feedback */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            Feedback
          </ThemedText>
          {!active && <Pill text="Kilitli" />}
        </View>

        <ThemedText style={styles.sectionDesc}>
          {active
            ? "Aktifsin. Geri bildirim verebilirsin."
            : "Bu mekânda aktif değilsin. Feedback vermek için QR okutmalısın."}
        </ThemedText>

        <View style={styles.feedbackRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!active}
            style={[styles.fbBtn, !active && styles.disabled]}
          >
            <ThemedText type="defaultSemiBold">👍 Beğendim</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!active}
            style={[styles.fbBtn, !active && styles.disabled]}
          >
            <ThemedText type="defaultSemiBold">👎 Beğenmedim</ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.tinyHint}>
          (Demo) Bu aksiyonlar backend gelince gerçek puan/yorum olarak yazılacak.
        </ThemedText>
      </View>

      {/* Alternatif öneriler */}
      <View style={{ marginTop: 14, gap: 12 }}>
        <View style={styles.resultsHeader}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            Alternatif öneriler
          </ThemedText>
          <ThemedText style={{ opacity: 0.6 }}>{alternatives.length}</ThemedText>
        </View>

        {alternatives.map((altId) => (
          <View key={altId} style={styles.altCardWrap}>
            <Link href={{ pathname: "/place/[id]", params: { id: altId } }} asChild>
              <TouchableOpacity activeOpacity={0.92} style={styles.altCard}>
                <Image
                  source={getPlaceImageSource(altId)}
                  style={styles.altImage}
                  resizeMode="cover"
                />
                <View style={styles.altOverlay} />

                <View style={styles.altContent}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
                    Mekan #{altId}
                  </ThemedText>
                  <ThemedText style={{ opacity: 0.75, marginTop: 6 }}>
                    Benzer vibe/purpose/budget (demo).
                  </ThemedText>

                  <View style={styles.altHintRow}>
                    <ThemedText style={styles.altHint}>İncele</ThemedText>
                    <ThemedText style={styles.altHint}>›</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          </View>
        ))}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  heroWrap: { flex: 1, justifyContent: "flex-end" },
  heroImage: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroTopRow: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  heroLeftPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  heroLeftText: { fontSize: 12, opacity: 0.92 },

  saveBtn: {
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

  titleContainer: { flexDirection: "row", gap: 8 },
  title: { fontFamily: Fonts.rounded },
  subtitle: { opacity: 0.75, marginTop: 8, lineHeight: 18 },

  actionRow: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },

  sectionCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionDesc: { opacity: 0.75, marginTop: 10, lineHeight: 18 },

  primaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    alignSelf: "flex-start",
  },

  tinyHint: { opacity: 0.55, marginTop: 10, fontSize: 12, lineHeight: 16 },

  pill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  pillText: { fontSize: 12 },

  statusPill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusOn: {
    borderColor: "rgba(255,255,255,0.30)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  statusOff: {
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  statusText: { fontSize: 12, opacity: 0.9 },

  feedbackRow: { marginTop: 12, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  fbBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  disabled: { opacity: 0.45 },

  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  altCardWrap: { position: "relative" },
  altCard: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    minHeight: 136,
  },
  altImage: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  altOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  altContent: { padding: 16, minHeight: 136, justifyContent: "flex-end" },
  altHintRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    opacity: 0.75,
  },
  altHint: { fontSize: 13 },
});