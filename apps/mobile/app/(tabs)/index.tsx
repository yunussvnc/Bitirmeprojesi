import { Link, router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useSavedPlaces } from "@/src/state/savedPlaces";

const PLACES = [
  { id: 1, name: "Cafe Luna", subtitle: "Sessiz, çalışmalık", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80" },
  { id: 2, name: "Bar 212", subtitle: "Akşam canlı, arkadaşlarla", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80" },
  { id: 3, name: "Kahve Durağı", subtitle: "Uygun fiyatlı", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80" },
];

export default function TabOneScreen() {
  const savedCount = useSavedPlaces((s) => s.ids.length);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  const getDateText = () => {
    const date = new Date();
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

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
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <ThemedText style={styles.greeting}>{getGreeting()} 👋</ThemedText>
              <ThemedText style={styles.dateText}>{getDateText()}</ThemedText>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{PLACES.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Mekan</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{savedCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Kayıtlı</ThemedText>
              </View>
            </View>
          </View>
          <IconSymbol
            size={310}
            color="rgba(255, 107, 157, 0.15)"
            name="house.fill"
            style={styles.headerImage}
          />
        </View>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>Keşfet 🎯</ThemedText>
        <ThemedText style={styles.subtitle}>
          Öne çıkan mekanları keşfet
        </ThemedText>
      </ThemedView>

      {/* Hızlı Arama */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)/explore")}
        style={styles.searchContainer}
      >
        <BlurView intensity={20} style={styles.searchBox}>
          <IconSymbol size={20} color="#888" name="magnifyingglass" />
          <ThemedText style={styles.searchPlaceholder}>
            Mekan ara...
          </ThemedText>
        </BlurView>
      </TouchableOpacity>

      <View style={styles.placesContainer}>
        {PLACES.map((place) => (
          <Link
            key={place.id}
            href={{ pathname: "/place/[id]", params: { id: String(place.id) } }}
            asChild
          >
            <TouchableOpacity activeOpacity={0.9} style={styles.card}>
              <BlurView intensity={20} style={styles.cardBlur}>
                <View style={styles.cardContent}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: place.image }}
                      style={styles.cardImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.7)"]}
                      style={styles.imageGradient}
                    />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                      {place.name}
                    </ThemedText>
                    <ThemedText style={styles.cardSubtitle}>
                      {place.subtitle}
                    </ThemedText>
                  </View>
                  <View style={styles.cardBadge}>
                    <ThemedText style={styles.badgeText}>📍</ThemedText>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
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
  headerImage: {
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  headerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 60,
    zIndex: 10,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#888",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF6B9D",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  searchContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: "#888",
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 4,
  },
  placesContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardBlur: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardContent: {
    position: "relative",
  },
  imageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  cardTextContainer: {
    padding: 20,
    paddingTop: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    color: "#1A1A1A",
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 2,
  },
  cardBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FF6B9D",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    fontSize: 20,
  },
});
