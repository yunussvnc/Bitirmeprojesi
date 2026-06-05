/**
 * Keşfet liste görünümü – harita yüklenemediğinde fallback.
 * react-native-maps mevcut olmadığında mekanları liste halinde gösterir.
 */

import { router } from 'expo-router';
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { Screen } from '@/src/components/layout';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { AnimatedPlaceCard } from '@/src/components/ui';
import { getPlaceImageSource, hasPlaceImage } from '@/src/utils/placeImages';
import type { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';
import { useTranslation } from 'react-i18next';

export interface ExploreListFallbackProps {
  places: Place[];
  loading: boolean;
  onRefresh: () => void;
  /** Kullanılmıyor – geriye dönük uyumluluk için bırakıldı */
  isSimulator?: boolean;
}

export function ExploreListFallback({ places, loading, onRefresh }: ExploreListFallbackProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const getLocationFromName = (name: string) => (name?.includes(' - ') ? name.split(' - ')[1]?.trim() : undefined);

  const renderItem = ({ item, index }: { item: Place; index: number }) => (
    <AnimatedPlaceCard
      index={index}
      image={getPlaceImageSource(item)}
      imagePlaceholder={!hasPlaceImage(item)}
      title={item.name}
      subtitle={item.subtitle}
      tags={item.tags}
      location={getLocationFromName(item.name)}
      address={item.address}
      hasMenu={!!(item.menu_items && item.menu_items.length > 0)}
      onPress={() => {
        lightImpact();
        router.push({
          pathname: '/place/[id]',
          params: {
            id: String(item.id),
            name: item.name || '',
            category: item.category || '',
            photo_url: item.photo_url || '',
            subtitle: item.subtitle || '',
            description: item.description || '',
            address: item.address || '',
          }
        } as any);
      }}
    />
  );

  const subtitle = t('explore.discover_subtitle');

  return (
    <Screen scrollable={false} withTabBar>
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{t('explore.title', { defaultValue: 'Keşfet' })}</Text>
          <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>{subtitle}</Text>
        </View>

        <FlatList
          data={places}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          initialNumToRender={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <IconSymbol name="mappin.and.ellipse" size={48} color={colors.text.tertiary} />
                <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>{t('explore.no_places')}</Text>
              </View>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.accent.primary} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 16, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  listContent: { padding: 16, gap: 16, paddingBottom: 100 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  emptyText: { marginTop: 12, fontSize: 15 },
});
