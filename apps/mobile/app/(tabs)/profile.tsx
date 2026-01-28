/**
 * Profile Screen
 * 
 * User profile, settings, and preferences screen.
 * Professional design with comprehensive settings.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Section } from '@/components/layout/Section';
import { Avatar, SettingsRow, StatCard } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/useTheme';
import { createTextStyle } from '@/constants/design';
import { spacing } from '@/constants/design';
import { usePreferences } from '@/src/state/preferences';
import { lightImpact, success } from '@/src/utils/haptics';

export default function ProfileScreen() {
  const { colors, typography, spacing: spacingTokens } = useTheme();
  const router = useRouter();
  const { prefs, patchPrefs } = usePreferences();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // Mock user data - replace with actual user data from store/context
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: undefined,
    memberSince: '2024',
    role: 'Öğrenci',
  };

  // Mock stats - replace with actual data
  const stats = {
    savedPlaces: 12,
    reviews: 8,
    verifiedVisits: 5,
    totalPlaces: 121,
    favoriteCategory: 'Café',
    memberLevel: 'Bronz',
    points: 245,
  };

  const titleStyle = createTextStyle('heading', colors.text.primary);
  const subtitleStyle = createTextStyle('body', colors.text.secondary);
  const bodyStyle = createTextStyle('body', colors.text.primary);
  const statValueStyle = createTextStyle('heading', colors.text.primary);
  const statLabelStyle = createTextStyle('bodySmall', colors.text.secondary);

  const handleNotifications = () => {
    lightImpact();
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleLocation = () => {
    lightImpact();
    setLocationEnabled(!locationEnabled);
  };

  const handleLanguage = () => {
    lightImpact();
    Alert.alert('Dil Seçimi', 'Dil seçimi yakında eklenecek', [{ text: 'Tamam' }]);
  };

  const handleHelp = () => {
    lightImpact();
    Alert.alert('Yardım & Destek', 'Yardım merkezi yakında eklenecek', [{ text: 'Tamam' }]);
  };

  const handleTerms = () => {
    lightImpact();
    Alert.alert('Kullanım Koşulları', 'Kullanım koşulları yakında eklenecek', [{ text: 'Tamam' }]);
  };

  const handlePrivacy = () => {
    lightImpact();
    Alert.alert('Gizlilik Politikası', 'Gizlilik politikası yakında eklenecek', [{ text: 'Tamam' }]);
  };

  const handleSignOut = () => {
    lightImpact();
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            // TODO: Clear auth tokens and user data
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    lightImpact();
    Alert.alert('Profil Düzenle', 'Profil düzenleme özelliği yakında eklenecek', [{ text: 'Tamam' }]);
  };

  const handleTheme = () => {
    lightImpact();
    setDarkMode(!darkMode);
    Alert.alert('Tema', darkMode ? 'Açık tema yakında eklenecek' : 'Koyu tema aktif', [{ text: 'Tamam' }]);
  };

  const handleDataSaver = () => {
    lightImpact();
    setDataSaver(!dataSaver);
  };

  const handleAutoPlay = () => {
    lightImpact();
    setAutoPlay(!autoPlay);
  };

  const handleClearCache = () => {
    lightImpact();
    Alert.alert(
      'Önbelleği Temizle',
      'Tüm önbellek verileri silinecek. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: () => {
            success();
            Alert.alert('Başarılı', 'Önbellek temizlendi');
          },
        },
      ]
    );
  };

  const handlePreferenceChange = (key: 'vibe' | 'purpose' | 'budget', value: any) => {
    lightImpact();
    patchPrefs({ [key]: value });
  };

  const getPreferenceLabel = (key: 'vibe' | 'purpose' | 'budget'): string => {
    const labels: Record<string, Record<string, string>> = {
      vibe: { quiet: 'Sessiz', lively: 'Canlı' },
      purpose: { work: 'Çalışma', friends: 'Arkadaş', date: 'Date' },
      budget: { low: 'Düşük (₺)', mid: 'Orta (₺₺)', high: 'Yüksek (₺₺₺)' },
    };
    return labels[key]?.[prefs[key]] || String(prefs[key]);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacingTokens.screenPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header with Gradient */}
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryHover]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.profileHeaderGradient, { marginBottom: spacing.xl }]}
        >
          <View style={styles.profileHeader}>
            <Avatar
              source={user.avatar}
              name={user.name}
              size={120}
              style={[styles.avatar, { borderWidth: 4, borderColor: colors.text.inverse }]}
            />
            <Text style={[titleStyle, styles.profileName, { color: colors.text.inverse }] as any}>
              {user.name}
            </Text>
            <Text style={[subtitleStyle, styles.profileEmail, { color: colors.text.inverse + 'CC' }] as any}>
              {user.email}
            </Text>
            <View style={styles.userInfo}>
              <View style={[styles.badge, { backgroundColor: colors.text.inverse + '20' }]}>
                <Text style={[subtitleStyle, styles.badgeText, { color: colors.text.inverse }] as any}>
                  {stats.memberLevel} Üye
                </Text>
              </View>
              <Text style={[subtitleStyle, styles.userInfoText, { color: colors.text.inverse + 'AA' }] as any}>
                {user.role} • Üye olma: {user.memberSince}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleEditProfile}
              style={[styles.editButton, { backgroundColor: colors.text.inverse, borderColor: colors.text.inverse }]}
            >
              <Text style={[bodyStyle, { color: colors.accent.primary, fontWeight: '600' }] as any}>
                Profili Düzenle
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Main Stats - Large Cards */}
        <View style={styles.mainStatsContainer}>
          <StatCard
            label="Kaydedilen Mekanlar"
            value={stats.savedPlaces}
            icon="bookmark.fill"
            gradientColors={[colors.accent.primary, colors.accent.primaryHover]}
            onPress={() => router.push('/(tabs)/saved')}
            style={{ flex: 1, marginRight: 8 }}
          />
          <StatCard
            label="Yorumlar"
            value={stats.reviews}
            icon="star.fill"
            gradientColors={['#FF6B6B', '#FF8E8E']}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        {/* Secondary Stats */}
        <View style={styles.secondaryStatsContainer}>
          <StatCard
            label="Doğrulanmış Ziyaretler"
            value={stats.verifiedVisits}
            icon="checkmark"
            style={{ flex: 1, marginRight: 8 }}
          />
          <StatCard
            label="Toplam Mekan"
            value={stats.totalPlaces}
            icon="map.fill"
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        {/* Points & Level Card */}
        <Card style={styles.pointsCard}>
          <View style={styles.pointsContainer}>
            <View style={styles.pointsLeft}>
              <View style={[styles.pointsIcon, { backgroundColor: colors.accent.primary + '20' }]}>
                <IconSymbol
                  name="trophy.fill"
                  size={32}
                  color={colors.accent.primary}
                />
              </View>
              <View style={styles.pointsText}>
                <Text style={[statValueStyle, { color: colors.text.primary, fontSize: 24 }] as any}>
                  {stats.points} Puan
                </Text>
                <Text style={[statLabelStyle, { marginTop: 4 }] as any}>
                  {stats.memberLevel} Seviye
                </Text>
              </View>
            </View>
            <View style={styles.pointsRight}>
              <Text style={[statLabelStyle, { textAlign: 'right' }] as any}>
                Favori Kategori
              </Text>
              <Text style={[statValueStyle, { color: colors.accent.primary, fontSize: 18, marginTop: 4 }] as any}>
                {stats.favoriteCategory}
              </Text>
            </View>
          </View>
        </Card>

        {/* AI Recommendation Preferences */}
        <Section title="AI Öneri Tercihleri" style={styles.section}>
          <Card style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <IconSymbol name="slider.horizontal.3" size={20} color={colors.text.secondary} />
                <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>Ortam</Text>
              </View>
              <View style={styles.preferenceOptions}>
                <TouchableOpacity
                  onPress={() => handlePreferenceChange('vibe', 'quiet')}
                  style={[
                    styles.preferenceOption,
                    {
                      backgroundColor: prefs.vibe === 'quiet' ? colors.accent.primary : colors.surface.default,
                      borderColor: prefs.vibe === 'quiet' ? colors.accent.primary : colors.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceOptionText,
                      {
                        color: prefs.vibe === 'quiet' ? colors.text.inverse : colors.text.secondary,
                        fontWeight: (prefs.vibe === 'quiet' ? '600' : '400') as any,
                      },
                    ]}
                  >
                    Sessiz
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePreferenceChange('vibe', 'lively')}
                  style={[
                    styles.preferenceOption,
                    {
                      backgroundColor: prefs.vibe === 'lively' ? colors.accent.primary : colors.surface.default,
                      borderColor: prefs.vibe === 'lively' ? colors.accent.primary : colors.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceOptionText,
                      {
                        color: prefs.vibe === 'lively' ? colors.text.inverse : colors.text.secondary,
                        fontWeight: (prefs.vibe === 'lively' ? '600' : '400') as any,
                      },
                    ]}
                  >
                    Canlı
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.preferenceRow, styles.preferenceRowSpacing, { borderTopColor: colors.surface.border }]}>
              <View style={styles.preferenceLeft}>
                <IconSymbol name="person.fill" size={20} color={colors.text.secondary} />
                <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>Amaç</Text>
              </View>
              <View style={styles.preferenceOptions}>
                <TouchableOpacity
                  onPress={() => handlePreferenceChange('purpose', 'work')}
                  style={[
                    styles.preferenceOption,
                    {
                      backgroundColor: prefs.purpose === 'work' ? colors.accent.primary : colors.surface.default,
                      borderColor: prefs.purpose === 'work' ? colors.accent.primary : colors.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceOptionText,
                      {
                        color: prefs.purpose === 'work' ? colors.text.inverse : colors.text.secondary,
                        fontWeight: (prefs.purpose === 'work' ? '600' : '400') as any,
                      },
                    ]}
                  >
                    Çalışma
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePreferenceChange('purpose', 'friends')}
                  style={[
                    styles.preferenceOption,
                    {
                      backgroundColor: prefs.purpose === 'friends' ? colors.accent.primary : colors.surface.default,
                      borderColor: prefs.purpose === 'friends' ? colors.accent.primary : colors.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceOptionText,
                      {
                        color: prefs.purpose === 'friends' ? colors.text.inverse : colors.text.secondary,
                        fontWeight: (prefs.purpose === 'friends' ? '600' : '400') as any,
                      },
                    ]}
                  >
                    Arkadaş
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePreferenceChange('purpose', 'date')}
                  style={[
                    styles.preferenceOption,
                    {
                      backgroundColor: prefs.purpose === 'date' ? colors.accent.primary : colors.surface.default,
                      borderColor: prefs.purpose === 'date' ? colors.accent.primary : colors.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceOptionText,
                      {
                        color: prefs.purpose === 'date' ? colors.text.inverse : colors.text.secondary,
                        fontWeight: (prefs.purpose === 'date' ? '600' : '400') as any,
                      },
                    ]}
                  >
                    Date
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.preferenceRow, { borderTopWidth: 1, borderTopColor: colors.surface.border, marginTop: spacing.base, paddingTop: spacing.base }]}>
              <View style={styles.preferenceLeft}>
                <IconSymbol name="chart.bar.fill" size={20} color={colors.text.secondary} />
                <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>Bütçe</Text>
              </View>
              <View style={styles.preferenceOptions}>
                <TouchableOpacity
                  onPress={() => handlePreferenceChange('budget', 'low')}
                  style={[
                    styles.preferenceOption,
                    {
                      backgroundColor: prefs.budget === 'low' ? colors.accent.primary : colors.surface.default,
                      borderColor: prefs.budget === 'low' ? colors.accent.primary : colors.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceOptionText,
                      {
                        color: prefs.budget === 'low' ? colors.text.inverse : colors.text.secondary,
                        fontWeight: (prefs.budget === 'low' ? '600' : '400') as any,
                      },
                    ]}
                  >
                    ₺ Düşük
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePreferenceChange('budget', 'mid')}
                  style={[
                    styles.preferenceOption,
                    {
                      backgroundColor: prefs.budget === 'mid' ? colors.accent.primary : colors.surface.default,
                      borderColor: prefs.budget === 'mid' ? colors.accent.primary : colors.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceOptionText,
                      {
                        color: prefs.budget === 'mid' ? colors.text.inverse : colors.text.secondary,
                        fontWeight: (prefs.budget === 'mid' ? '600' : '400') as any,
                      },
                    ]}
                  >
                    ₺₺ Orta
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePreferenceChange('budget', 'high')}
                  style={[
                    styles.preferenceOption,
                    {
                      backgroundColor: prefs.budget === 'high' ? colors.accent.primary : colors.surface.default,
                      borderColor: prefs.budget === 'high' ? colors.accent.primary : colors.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceOptionText,
                      {
                        color: prefs.budget === 'high' ? colors.text.inverse : colors.text.secondary,
                        fontWeight: (prefs.budget === 'high' ? '600' : '400') as any,
                      },
                    ]}
                  >
                    ₺₺₺ Yüksek
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </Section>

        {/* Preferences Section */}
        <Section title="Tercihler" style={styles.section}>
          <SettingsRow
            label="Bildirimler"
            value={notificationsEnabled ? 'Açık' : 'Kapalı'}
            onPress={handleNotifications}
            showArrow
            icon="bell.fill"
          />
          <SettingsRow
            label="Konum Servisleri"
            value={locationEnabled ? 'Açık' : 'Kapalı'}
            onPress={handleLocation}
            showArrow
            icon="location.fill"
          />
          <SettingsRow
            label="Tema"
            value={darkMode ? 'Koyu' : 'Açık'}
            onPress={handleTheme}
            showArrow
            icon="gear"
          />
          <SettingsRow
            label="Dil"
            value="Türkçe"
            onPress={handleLanguage}
            showArrow
            icon="globe"
          />
        </Section>

        {/* App Settings Section */}
        <Section title="Uygulama Ayarları" style={styles.section}>
          <SettingsRow
            label="Veri Tasarrufu"
            value={dataSaver ? 'Açık' : 'Kapalı'}
            onPress={handleDataSaver}
            showArrow
            icon="chart.bar.fill"
          />
          <SettingsRow
            label="Otomatik Oynatma"
            value={autoPlay ? 'Açık' : 'Kapalı'}
            onPress={handleAutoPlay}
            showArrow
            icon="play.fill"
          />
          <SettingsRow
            label="Önbelleği Temizle"
            value="~12.5 MB"
            onPress={handleClearCache}
            showArrow
            icon="trash"
          />
        </Section>

        {/* About Section */}
        <Section title="Hakkında" style={styles.section}>
          <SettingsRow
            label="Yardım & Destek"
            onPress={handleHelp}
            showArrow
            icon="questionmark.circle.fill"
          />
          <SettingsRow
            label="Kullanım Koşulları"
            onPress={handleTerms}
            showArrow
            icon="doc.text.fill"
          />
          <SettingsRow
            label="Gizlilik Politikası"
            onPress={handlePrivacy}
            showArrow
            icon="lock.fill"
          />
          <SettingsRow
            label="Uygulama Versiyonu"
            value="1.0.0"
            showArrow={false}
            icon="info.circle.fill"
          />
        </Section>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            variant="secondary"
            size="large"
            onPress={handleSignOut}
            style={styles.signOutButton}
          >
            Çıkış Yap
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  profileHeaderGradient: {
    borderRadius: 20,
    padding: spacing.xl,
    marginHorizontal: spacing.screenPadding * -1,
    marginTop: spacing.screenPadding * -1,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: spacing.md,
  },
  profileName: {
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
  },
  profileEmail: {
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontSize: 14,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userInfoText: {
    textAlign: 'center',
    fontSize: 13,
  },
  editButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 24,
    borderWidth: 0,
    marginTop: spacing.sm,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  secondaryStatsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  pointsCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pointsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pointsText: {
    flex: 1,
  },
  pointsRight: {
    alignItems: 'flex-end',
  },
  section: {
    marginBottom: spacing.xl,
  },
  preferenceCard: {
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  preferenceRowSpacing: {
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  preferenceOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'flex-end',
  },
  preferenceOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  preferenceOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  signOutContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  signOutButton: {
    // Button styles applied via component
  },
});
