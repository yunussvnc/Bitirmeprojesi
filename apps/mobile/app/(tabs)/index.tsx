import { Link } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

const PLACES = [
  { id: 1, name: "Cafe Luna", subtitle: "Sessiz, çalışmalık" },
  { id: 2, name: "Bar 212", subtitle: "Akşam canlı, arkadaşlarla" },
  { id: 3, name: "Kahve Durağı", subtitle: "Uygun fiyatlı" },
];

export default function TabOneScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="house.fill"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Home</ThemedText>
      </ThemedView>

      <ThemedText style={{ opacity: 0.75 }}>
        Home’daki karttan da detaya gidebilmelisin.
      </ThemedText>

      <View style={{ marginTop: 16, gap: 12 }}>
        {PLACES.map((place) => (
          <Link
            key={place.id}
            href={{ pathname: "/place/[id]", params: { id: String(place.id) } }}
            asChild
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.card}
            >
              <ThemedText type="defaultSemiBold">{place.name}</ThemedText>
              <ThemedText style={{ opacity: 0.7, marginTop: 4 }}>
                {place.subtitle}
              </ThemedText>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
});
