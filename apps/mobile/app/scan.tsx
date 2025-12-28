import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

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
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  return session;
}

async function readActiveSession(): Promise<ActiveSession | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
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

function formatActiveText(s: ActiveSession | null) {
  if (!s || s.activeUntil <= Date.now()) return "Aktif oturum yok.";
  const mins = Math.max(0, Math.floor((s.activeUntil - Date.now()) / 60000));
  return mins >= 1
    ? `Aktif: Mekan #${s.placeId} • ${mins} dk`
    : `Aktif: Mekan #${s.placeId}`;
}

export default function ScanScreen() {
  const params = useLocalSearchParams();
  const placeIdParam = useMemo(() => normalizePlaceId(params?.placeId), [params]);

  const [status, setStatus] = useState<string>("Hazırlanıyor...");
  const [manualInput, setManualInput] = useState<string>(placeIdParam ?? "1");

  const handlingRef = useRef(false);

  async function refreshStatus() {
    const s = await readActiveSession();
    setStatus(formatActiveText(s));
  }

  async function activateAndGo(placeId: string) {
    if (handlingRef.current) return;
    handlingRef.current = true;
    try {
      setStatus("Aktif ediliyor...");
      await setActiveSession(placeId, 2);
      // ✅ soru yok: direkt detaya
      router.replace({ pathname: "/place/[id]", params: { id: String(placeId) } });
    } finally {
      handlingRef.current = false;
    }
  }

  // ✅ Deep link ile geldiyse: hiç UI göstermeden akışı çalıştır
  useEffect(() => {
    if (!placeIdParam) {
      refreshStatus();
      return;
    }
    activateAndGo(placeIdParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeIdParam]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="qrcode.viewfinder"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>
          scan
        </ThemedText>
      </ThemedView>

      {/* Minimal durum kartı */}
      <View style={styles.card}>
        <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
          QR Durumu
        </ThemedText>
        <ThemedText style={styles.desc}>{status}</ThemedText>

        <ThemedText style={styles.hint}>
          QR formatı: <ThemedText type="defaultSemiBold">mobile://scan?placeId=1</ThemedText>
        </ThemedText>
      </View>

      {/* Manuel test (küçük) */}
      <View style={styles.card}>
        <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
          Manuel Test (Demo)
        </ThemedText>

        <TextInput
          value={manualInput}
          onChangeText={setManualInput}
          placeholder="örn: 1"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            const pid = normalizePlaceId(manualInput);
            if (!pid) return;
            activateAndGo(pid);
          }}
          style={styles.primaryBtn}
        >
          <ThemedText type="defaultSemiBold">Aktif Et → Detaya Git</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/explore")}
          style={styles.secondaryBtn}
        >
          <ThemedText type="defaultSemiBold">Keşfet’e dön</ThemedText>
        </TouchableOpacity>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { bottom: -90, left: -35, position: "absolute" },
  titleContainer: { flexDirection: "row", gap: 8 },
  title: { fontFamily: Fonts.rounded },

  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  desc: { opacity: 0.8, marginTop: 8, lineHeight: 18 },
  hint: { opacity: 0.55, marginTop: 10, fontSize: 12, lineHeight: 16 },

  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    color: "white",
    fontSize: 15,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

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

  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    alignSelf: "flex-start",
  },
});