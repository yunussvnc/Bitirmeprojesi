import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity, StyleSheet } from "react-native";

import ParallaxScrollView from "@/src/components/parallax-scroll-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";

import { API_V1 } from "@/src/constants/api";

export default function DebugApiScreen() {
  const [out, setOut] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const test = async () => {
    try {
      setOut("");
      setLoading(true);

      const res = await fetch(`${API_V1}/places/`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const text = await res.text();
      setOut(`STATUS: ${res.status}\n\n${text}`);
    } catch (e: any) {
      setOut(`HATA: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }} headerImage={<View style={styles.header} />}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">API Debug</ThemedText>
        <ThemedText style={{ opacity: 0.75, marginTop: 8 }}>
          Backend bağlantısını buradan test ediyoruz. Explore’a dokunmuyoruz.
        </ThemedText>

        <View style={styles.card}>
          <ThemedText type="defaultSemiBold">Base URL</ThemedText>
          <ThemedText style={{ opacity: 0.75, marginTop: 6 }}>{API_V1}</ThemedText>

          <TouchableOpacity activeOpacity={0.85} onPress={test} style={styles.btn} disabled={loading}>
            <ThemedText type="defaultSemiBold">{loading ? "Test ediliyor..." : "GET /api/v1/places/ test et"}</ThemedText>
          </TouchableOpacity>

          {!!out && (
            <ScrollView style={styles.outBox}>
              <ThemedText style={{ opacity: 0.9 }}>{out}</ThemedText>
            </ScrollView>
          )}
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 10,
  },
  btn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  outBox: {
    marginTop: 10,
    maxHeight: 320,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },
});
