/**
 * Profile Screen
 * 
 * User profile, settings, and preferences screen.
 * Professional design with comprehensive settings.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Screen, type ScreenRef } from '@/components/layout/Screen';
import { Section } from '@/components/layout/Section';
import { Avatar, SettingsRow } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { createTextStyle } from '@/constants/design';
import { spacing } from '@/constants/design';
import { lightImpact, success } from '@/src/utils/haptics';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme, themeMode } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const screenRef = useRef<ScreenRef>(null);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Listen for tab press to scroll to top
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, (e: any) => {
      screenRef.current?.scrollToTop();
    });
    return unsubscribe;
  }, [navigation]);

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

  const handleNotifications = () => {
    lightImpact();
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleHelp = () => {
    lightImpact();
    Alert.alert('Yardım & Destek', 'Yardım merkezi yakında eklenecek', [{ text: 'Tamam' }]);
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

  const handleTheme = () => {
    lightImpact();
    toggleTheme();
    success();
  };
  
  const getThemeLabel = () => {
    if (themeMode === 'system') return 'Sistem';
    return isDark ? 'Koyu' : 'Açık';
  };

  return (
    <Screen ref={screenRef} withTabBar>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profil</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          <Avatar
            source={user.avatar}
            name={user.name}
            size={72}
          />
          <Text style={[styles.profileName, { color: colors.text.primary }]}>{user.name}</Text>
          <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
            {user.email}
          </Text>
          
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/saved')} activeOpacity={0.7}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>{stats.savedPlaces}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Kayıtlı</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>{stats.reviews}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Yorum</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <Section title="Ayarlar" style={styles.section}>
          <SettingsRow
            label="Bildirimler"
            value={notificationsEnabled ? 'Açık' : 'Kapalı'}
            onPress={handleNotifications}
            showArrow
            icon="bell.fill"
          />
          <SettingsRow
            label="Tema"
            value={getThemeLabel()}
            onPress={handleTheme}
            showArrow
            icon={isDark ? "moon.fill" : "sun.max.fill"}
          />
          <SettingsRow
            label="Yardım & Destek"
            onPress={handleHelp}
            showArrow
            icon="questionmark.circle.fill"
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.base,
  },
  signOutContainer: {
    marginTop: spacing.base,
    marginBottom: spacing.base,
  },
  signOutButton: {
    // Button styles applied via component
  },
});
