import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, SlideInRight } from "react-native-reanimated";

import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { useAuthStore } from "@/src/store/useAuthStore";
import { lightImpact } from "@/src/utils/haptics";

const { width } = Dimensions.get("window");

export default function WeeklyReportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  // Mock data for the gamified report
  const reportData = {
    newPlaces: 12,
    topCategory: "Kahve & Tatlı",
    pointsEarned: 350,
    activeDays: 5,
  };

  useEffect(() => {
    lightImpact();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <LinearGradient
        colors={[colors.accent.primary + "40", colors.background.primary]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol name="xmark" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Haftalık Rapor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title Section */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.titleSection}>
          <Text style={[styles.greeting, { color: colors.text.secondary }]}>Harika bir hafta geçirdin,</Text>
          <Text style={[styles.name, { color: colors.text.primary }]}>{user?.first_name || "Kaşif"}! 🚀</Text>
        </Animated.View>

        {/* Big Stat Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} style={[styles.mainCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primary + "80"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainCardGradient}
          />
          <IconSymbol name="map.fill" size={40} color="#FFF" />
          <Text style={styles.mainCardNumber}>{reportData.newPlaces}</Text>
          <Text style={styles.mainCardLabel}>Yeni Mekan Keşfettin</Text>
        </Animated.View>

        {/* Grid Stats */}
        <View style={styles.grid}>
          {/* Top Category */}
          <Animated.View entering={SlideInRight.delay(300).duration(500).springify()} style={[styles.gridItem, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.semantic.warning + "20" }]}>
              <IconSymbol name="star.fill" size={24} color={colors.semantic.warning} />
            </View>
            <Text style={[styles.gridValue, { color: colors.text.primary }]} numberOfLines={1}>{reportData.topCategory}</Text>
            <Text style={[styles.gridLabel, { color: colors.text.tertiary }]}>Favori Kategori</Text>
          </Animated.View>

          {/* Points */}
          <Animated.View entering={SlideInRight.delay(400).duration(500).springify()} style={[styles.gridItem, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.semantic.success + "20" }]}>
              <IconSymbol name="flame.fill" size={24} color={colors.semantic.success} />
            </View>
            <Text style={[styles.gridValue, { color: colors.text.primary }]}>{reportData.pointsEarned}</Text>
            <Text style={[styles.gridLabel, { color: colors.text.tertiary }]}>Puan Kazandın</Text>
          </Animated.View>
        </View>

        {/* Gamification Badge */}
        <Animated.View entering={FadeInUp.delay(500).duration(600).springify()} style={[styles.badgeCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          <View style={styles.badgeIcon}>
            <Text style={{ fontSize: 40 }}>🏆</Text>
          </View>
          <View style={styles.badgeInfo}>
            <Text style={[styles.badgeTitle, { color: colors.text.primary }]}>Haftanın Gurmesi</Text>
            <Text style={[styles.badgeDesc, { color: colors.text.secondary }]}>
              Şehrin %4'lük dilimine girerek en çok gezenlerden biri oldun!
            </Text>
          </View>
        </Animated.View>

        {/* Share Button */}
        <Animated.View entering={FadeInUp.delay(600).duration(600).springify()}>
          <TouchableOpacity 
            style={[styles.shareBtn, { backgroundColor: colors.text.primary }]} 
            activeOpacity={0.8}
            onPress={() => lightImpact()}
          >
            <IconSymbol name="square.and.arrow.up" size={20} color={colors.background.primary} />
            <Text style={[styles.shareBtnText, { color: colors.background.primary }]}>Raporu Paylaş</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 20 },
  titleSection: {
    marginBottom: 32,
    marginTop: 10,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  mainCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    padding: 30,
    alignItems: "center",
    marginBottom: 16,
  },
  mainCardGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  mainCardNumber: {
    fontSize: 64,
    fontWeight: "900",
    color: "#FFF",
    marginTop: 12,
    letterSpacing: -2,
  },
  mainCardLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 32,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 100,
    gap: 12,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
