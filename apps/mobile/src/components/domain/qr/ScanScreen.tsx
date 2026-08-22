import { mmkv } from "@/src/utils/mmkvStorage";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import ParallaxScrollView from "@/src/components/parallax-scroll-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { Fonts } from "@/src/constants/theme";
import { usePresence } from "@/src/store/presence";
import { getPlaceById } from "@/src/services/mekanService";
import { useTranslation } from "react-i18next";

type ActiveSession = {
  placeId: string;
  activeUntil: number; // epoch ms
};

const ACTIVE_SESSION_KEY = "active-session-v1";

function normalizePlaceId(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const match = s.match(/(\d+)/);
  if (!match) return null;
  return match[1];
}

async function setActiveSession(placeId: string, hours = 2) {
  const activeUntil = Date.now() + hours * 60 * 60 * 1000;
  const session: ActiveSession = { placeId: String(placeId), activeUntil };
  mmkv.set(ACTIVE_SESSION_KEY, JSON.stringify(session));
  return session;
}

async function readActiveSession(): Promise<ActiveSession | null> {
  try {
    const raw = mmkv.getString(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveSession>;
    if (!parsed.placeId || !parsed.activeUntil) return null;
    return {
      placeId: String(parsed.placeId),
      activeUntil: Number(parsed.activeUntil),
    };
  } catch {
    return null;
  }
}

function formatActiveText(s: ActiveSession | null, t: any) {
  if (!s || s.activeUntil <= Date.now()) return t("qr.no_session");
  const mins = Math.max(0, Math.floor((s.activeUntil - Date.now()) / 60000));
  return mins >= 1 ? t("qr.active_mins", { placeId: s.placeId, mins }) : t("qr.active", { placeId: s.placeId });
}

export default function ScanScreen() {
  const params = useLocalSearchParams();
  const placeIdParam = useMemo(() => normalizePlaceId(params?.placeId), [params]);
  const { t } = useTranslation();

  const [status, setStatus] = useState<string>(t("qr.preparing"));
  const [manualInput, setManualInput] = useState<string>(placeIdParam ?? "1");

  const handlingRef = useRef(false);

  const refreshStatus = useCallback(async () => {
    const s = await readActiveSession();
    setStatus(formatActiveText(s, t));
  }, [t]);

  const activateAndGo = useCallback(async (placeId: string) => {
    if (handlingRef.current) return;
    handlingRef.current = true;
    try {
      setStatus(t("qr.activating"));
      await setActiveSession(placeId, 2);

      // Presence store + QR doğrulama
      const presence = usePresence.getState();
      presence.startSession(placeId);
      try {
        const placeInfo = await getPlaceById(placeId);
        if (placeInfo) {
          presence.setQrVerified(true);
          presence.setActivePlaceName(placeInfo.name);
        } else {
          presence.setQrVerified(false);
        }
      } catch {
        // QR doğrulama başarısız olsa bile oturumu başlat
        presence.setQrVerified(false);
      }

      // ✅ soru yok: direkt detaya
      router.replace({ pathname: "/place/[id]", params: { id: String(placeId) } });
    } finally {
      handlingRef.current = false;
    }
  }, [t]);

  // ✅ Deep link ile geldiyse: hiç UI göstermeden akışı çalıştır
  useEffect(() => {
    if (!placeIdParam) {
      refreshStatus();
      return;
    }
    activateAndGo(placeIdParam);
  }, [placeIdParam, refreshStatus, activateAndGo]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#FFFFFF", dark: "#1A1A1A" }}
      headerImage={
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["#FFF5F7", "#F8F9FA", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          />
          <IconSymbol size={310} color="rgba(255,255,255,0.3)" name="qrcode.viewfinder" style={styles.headerImage} />
        </View>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>
          {t("qr.title_scan")}
        </ThemedText>
      </ThemedView>

      {/* Minimal durum kartı */}
      <BlurView intensity={20} style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          {t("qr.status")}
        </ThemedText>
        <ThemedText style={styles.desc}>{status}</ThemedText>

        <ThemedText style={styles.hint}>
          QR formatı: <ThemedText type="defaultSemiBold">mobile://scan?placeId=1</ThemedText>
        </ThemedText>
      </BlurView>

      {/* Manuel test (küçük) */}
      <BlurView intensity={20} style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          {t("qr.manual_test")}
        </ThemedText>

        <BlurView intensity={20} style={styles.inputContainer}>
          <TextInput
            value={manualInput}
            onChangeText={setManualInput}
            placeholder={t("qr.placeholder")}
            placeholderTextColor="#999"
            style={styles.input}
          />
        </BlurView>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            const pid = normalizePlaceId(manualInput);
            if (!pid) return;
            activateAndGo(pid);
          }}
          style={styles.primaryBtn}
        >
          <LinearGradient colors={["#667eea", "#764ba2"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGradient}>
            <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>
              {t("qr.activate_go")}
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/(tabs)/explore")} style={styles.secondaryBtn}>
          <LinearGradient colors={["#FF6B9D", "#C44569"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.secondaryBtnGradient}>
            <ThemedText type="defaultSemiBold" style={styles.secondaryBtnText}>
              {t("qr.return_explore")}
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  headerGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  headerImage: { bottom: -90, left: -35, position: "absolute" },
  titleContainer: { flexDirection: "row", gap: 8 },
  title: { fontFamily: Fonts.rounded },

  card: {
    marginTop: 12,
    padding: 20,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  desc: {
    color: "#666",
    marginTop: 8,
    lineHeight: 20,
    fontSize: 15,
  },
  hint: {
    color: "#888",
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
  },

  inputContainer: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    color: "#1A1A1A",
    fontSize: 15,
    backgroundColor: "transparent",
  },

  primaryBtn: {
    marginTop: 16,
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
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryBtn: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "flex-start",
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryBtnGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
