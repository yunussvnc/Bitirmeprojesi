/**
 * Keşfet liste görünümü – harita yüklenemediğinde fallback.
 * react-native-maps mevcut olmadığında mekanları liste halinde gösterir.
 */

import { router } from 'expo-router';
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/layout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AnimatedPlaceCard } from '@/components/ui';
import { getPlaceImageSource, hasPlaceImage } from '@/src/utils/placeImages';
import type { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';

export interface ExploreListFallbackProps {
  places: Place[];
  loading: boolean;
  onRefresh: () => void;
  /** Kullanılmıyor – geriye dönük uyumluluk için bırakıldı */
  isSimulator?: boolean;
}

export function ExploreListFallback({ places, loading, onRefresh }: ExploreListFallbackProps) {
  const { colors } = useTheme();

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
      onPress={() => { lightImpact(); router.push({ pathname: '/place/[id]', params: { id: String(item.id) } } as any); }}
    />
  );

  const subtitle = 'Yakınındaki mekanları keşfet';

  return (
    <Screen scrollable={false} withTabBar>
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Keşfet</Text>
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
                <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>Henüz mekan yok</Text>
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
