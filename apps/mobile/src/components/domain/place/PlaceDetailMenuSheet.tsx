import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { IconSymbol } from '@/src/components/ui/icon-symbol';

export function PlaceDetailMenuSheet({
  place,
  t,
  colors,
  spacing,
  h2Style,
  bodyStyle,
  captionStyle,
  bodySmallStyle,
  SCREEN_WIDTH,
}: {
  place: any;
  t: (key: string, options?: any) => string;
  colors: any;
  spacing: any;
  h2Style: any;
  bodyStyle: any;
  captionStyle: any;
  bodySmallStyle: any;
  SCREEN_WIDTH: number;
}) {

  // Kategori gruplama fonksiyonu (Aynı mantık)
  const groupMenuByCategory = (items: any[], tFunc: (key: string) => string) => {
    if (!items || !items.length) return [];
    const grouped: Record<string, any[]> = {};
    items.forEach(item => {
      const cat = item.category || tFunc("place_detail.other_category") || "Diğer";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return Object.entries(grouped).map(([category, catItems]) => ({ category, items: catItems }));
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.reviewScrollContent, { paddingHorizontal: spacing.sm }]}
      showsVerticalScrollIndicator={false}
    >
      {place?.menu_items && place.menu_items.length > 0 ? (
        place.menu_items[0]?.type === 'image' ? (
          /* ===== IMAGE MENU ===== */
          <View style={{ gap: spacing.lg }}>
            {place.menu_items.map((imgItem: any, idx: number) => (
              <View key={idx} style={{
                width: SCREEN_WIDTH - 40,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
                elevation: 12,
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: colors.surface.elevated,
              }}>
                <Image
                  source={{ uri: imgItem.uri }}
                  style={{ width: '100%', height: (SCREEN_WIDTH - 40) * 1.4 }}
                  resizeMode="cover"
                />
                <View style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  paddingVertical: 10, paddingHorizontal: 16,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                    {t('place_detail.page_x_of_y', { current: idx + 1, total: place.menu_items.length })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* ===== TEXT MENU — PREMIUM CATEGORIZED ===== */
          <View style={{ paddingBottom: spacing.lg }}>
            {groupMenuByCategory(place.menu_items, t).map((group, gIdx) => (
              <View key={gIdx} style={{ marginBottom: spacing.xl }}>
                {/* Category Header */}
                <View style={{
                  paddingVertical: 12,
                  borderBottomWidth: 2, borderBottomColor: '#10b98130',
                  flexDirection: 'row', alignItems: 'center', marginBottom: 12
                }}>
                  <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: '#10b981', marginRight: 10 }} />
                  <Text style={[h2Style, { fontSize: 18, color: '#10b981', letterSpacing: 0.3 }]}>
                    {group.category}
                  </Text>
                  <Text style={[captionStyle, { marginLeft: 8 }]}>{group.items.length} ürün</Text>
                </View>
                {/* Menu Items */}
                <View style={{ gap: 10 }}>
                  {group.items.map((item: any, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.surface.elevated,
                        padding: 14,
                        borderRadius: 18,
                        borderWidth: 0.5,
                        borderColor: colors.surface.border,
                      }}
                    >
                      {item.img ? (
                        <Image
                          source={{ uri: item.img }}
                          style={{ width: 56, height: 56, borderRadius: 14, marginRight: 14, backgroundColor: colors.surface.default }}
                        />
                      ) : (
                        <View style={{
                          width: 56, height: 56, borderRadius: 14, marginRight: 14,
                          backgroundColor: colors.surface.default,
                          justifyContent: 'center', alignItems: 'center',
                        }}>
                          <IconSymbol name="fork.knife" size={22} color={colors.text.tertiary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[bodyStyle, { fontWeight: '700', fontSize: 16, marginBottom: 2 }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        {item.desc ? (
                          <Text style={{ fontSize: 13, color: colors.text.tertiary, lineHeight: 18 }} numberOfLines={2}>
                            {item.desc}
                          </Text>
                        ) : null}
                      </View>
                      {item.price ? (
                        <View style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 12,
                          marginLeft: 10,
                        }}>
                          {item.price && (
                            <Text style={{ fontWeight: '800', color: '#10b981', fontSize: 15 }}>
                              {item.price}
                            </Text>
                          )}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )
      ) : (
        /* ===== EMPTY STATE ===== */
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <IconSymbol name="list.bullet.clipboard" size={48} color={colors.text.tertiary} />
          <Text style={[bodySmallStyle, { textAlign: 'center', marginTop: spacing.base }]}>
            {t("place_detail.no_menu", "Bu mekan henüz menü eklememiş.")}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  reviewScrollContent: {
    paddingBottom: 40,
  },
});
