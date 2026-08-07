import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

import { useTheme } from "@/src/hooks/useTheme";
import { getPlaceById, type Place } from "@/src/services/mekanService";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { getPlaceImageSource, hasPlaceImage } from "@/src/utils/placeImages";

export default function CompareScreen() {
  const { ids } = useLocalSearchParams<{ ids: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [place1, setPlace1] = useState<Place | null>(null);
  const [place2, setPlace2] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids) {
      router.back();
      return;
    }

    const idArray = ids.split(",");
    if (idArray.length !== 2) {
      router.back();
      return;
    }

    const fetchPlaces = async () => {
      try {
        const [p1, p2] = await Promise.all([
          getPlaceById(idArray[0]),
          getPlaceById(idArray[1]),
        ]);
        setPlace1(p1);
        setPlace2(p2);
      } catch (err) {
        console.error("Compare fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [ids, router]);

  const renderComparisonRow = (
    label: string,
    val1: React.ReactNode,
    val2: React.ReactNode,
    icon: any
  ) => (
    <Animated.View entering={SlideInDown.duration(400).springify()} style={styles.row}>
      <View style={styles.rowHeader}>
        <IconSymbol name={icon} size={16} color={colors.text.tertiary} />
        <Text style={[styles.rowLabel, { color: colors.text.tertiary }]}>{label}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.col}>
          {typeof val1 === "string" ? (
            <Text style={[styles.valText, { color: colors.text.primary }]} numberOfLines={2}>
              {val1}
            </Text>
          ) : (
            val1
          )}
        </View>
        <View style={[styles.divider, { backgroundColor: colors.surface.border }]} />
        <View style={styles.col}>
          {typeof val2 === "string" ? (
            <Text style={[styles.valText, { color: colors.text.primary }]} numberOfLines={2}>
              {val2}
            </Text>
          ) : (
            val2
          )}
        </View>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  if (!place1 || !place2) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background.primary }]}>
        <Text style={{ color: colors.text.primary }}>Mekanlar yüklenemedi.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accent.primary }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const p1Img = hasPlaceImage(place1) ? { uri: place1.photo_url } : getPlaceImageSource(place1.id);
  const p2Img = hasPlaceImage(place2) ? { uri: place2.photo_url } : getPlaceImageSource(place2.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Karşılaştırma</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Images Side by Side */}
        <View style={styles.imagesContainer}>
          <View style={styles.imageWrap}>
            <Image source={p1Img} style={styles.image} />
            <BlurView intensity={30} tint="dark" style={styles.imageTitleOverlay}>
              <Text style={styles.imageTitle} numberOfLines={1}>{place1.name}</Text>
            </BlurView>
          </View>
          <View style={{ width: 12 }} />
          <View style={styles.imageWrap}>
            <Image source={p2Img} style={styles.image} />
            <BlurView intensity={30} tint="dark" style={styles.imageTitleOverlay}>
              <Text style={styles.imageTitle} numberOfLines={1}>{place2.name}</Text>
            </BlurView>
          </View>
        </View>

        {/* VS Badge */}
        <Animated.View entering={FadeIn.delay(300)} style={[styles.vsBadge, { backgroundColor: colors.accent.primary, borderColor: colors.background.primary }]}>
          <Text style={styles.vsText}>VS</Text>
        </Animated.View>

        {/* Stats Content */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          {renderComparisonRow(
            "Kategori",
            place1.category || "-",
            place2.category || "-",
            "tag.fill"
          )}
          {renderComparisonRow(
            "Puan",
            <View style={styles.ratingWrap}>
              <IconSymbol name="star.fill" size={14} color={colors.semantic.warning} />
              <Text style={[styles.valText, { color: colors.text.primary, fontWeight: '700' }]}>{place1.average_rating?.toFixed(1) || "-"}</Text>
            </View>,
            <View style={styles.ratingWrap}>
              <IconSymbol name="star.fill" size={14} color={colors.semantic.warning} />
              <Text style={[styles.valText, { color: colors.text.primary, fontWeight: '700' }]}>{place2.average_rating?.toFixed(1) || "-"}</Text>
            </View>,
            "star.circle.fill"
          )}
          {renderComparisonRow(
            "Fiyat",
            <Text style={[styles.valText, { color: colors.semantic.success, fontWeight: '700' }]}>
              {"$".repeat(place1.price_range || 1)}
            </Text>,
            <Text style={[styles.valText, { color: colors.semantic.success, fontWeight: '700' }]}>
              {"$".repeat(place2.price_range || 1)}
            </Text>,
            "banknote.fill"
          )}
          {renderComparisonRow(
            "Adres",
            place1.address || place1.city || "-",
            place2.address || place2.city || "-",
            "mappin.circle.fill"
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]} 
            onPress={() => router.push(`/place/${place1.id}` as any)}
          >
            <Text style={[styles.actionText, { color: colors.text.primary }]} numberOfLines={1}>{place1.name}</Text>
            <IconSymbol name="arrow.right.circle.fill" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]} 
            onPress={() => router.push(`/place/${place2.id}` as any)}
          >
            <Text style={[styles.actionText, { color: colors.text.primary }]} numberOfLines={1}>{place2.name}</Text>
            <IconSymbol name="arrow.right.circle.fill" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 16 },
  imagesContainer: {
    flexDirection: "row",
    height: 200,
    marginBottom: 24,
  },
  imageWrap: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageTitleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 16,
  },
  imageTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  vsBadge: {
    position: "absolute",
    top: 100 + 16 - 20, // image height/2 + padding top - badge height/2
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  vsText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },
  statsCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingTop: 10,
    gap: 16,
  },
  row: {
    marginTop: 10,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  col: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: "100%",
    marginHorizontal: 12,
  },
  valText: {
    fontSize: 15,
    textAlign: "center",
  },
  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    textAlign: 'center'
  },
});
