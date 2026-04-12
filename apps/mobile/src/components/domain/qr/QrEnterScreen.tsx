import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import ParallaxScrollView from "@/src/components/parallax-scroll-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { Fonts } from "@/src/constants/theme";

import { usePresence } from "@/src/store/presence";
import { useTranslation } from "react-i18next";

function normalizePlaceId(input: string) {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower.startsWith("place:")) return raw.split(":").slice(1).join(":").trim();
  return raw;
}

export default function QrEnterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ placeId?: string }>();
  const { t } = useTranslation();

  const placeId = useMemo(() => normalizePlaceId(String(params.placeId ?? "")), [params.placeId]);

  const startSession = usePresence((s) => s.startSession);

  const [error, setError] = useState("");

  useEffect(() => {
    // ✅ Otomatik: kullanıcıya soru yok.
    if (!placeId) {
      setError(t("qr.invalid"));
      return;
    }

    startSession(placeId); // default 2 saat
    router.replace({ pathname: "/place/[id]", params: { id: placeId } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={<IconSymbol size={310} color="#808080" name="qrcode" style={styles.headerImage} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>
          {t("qr.title_enter")}
        </ThemedText>
      </ThemedView>

      {!error ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          <ThemedText style={{ opacity: 0.75 }}>{t("qr.verifying")}</ThemedText>
        </View>
      ) : (
        <View style={{ marginTop: 12, gap: 12 }}>
          <ThemedText style={{ opacity: 0.85 }}>{t("qr.error", { error })}</ThemedText>

          <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace("/(tabs)/explore")} style={styles.primaryBtn}>
            <ThemedText type="defaultSemiBold">{t("qr.return_explore")}</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { bottom: -90, left: -35, position: "absolute" },
  titleContainer: { flexDirection: "row", gap: 8 },
  title: { fontFamily: Fonts.rounded },
  primaryBtn: {
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
