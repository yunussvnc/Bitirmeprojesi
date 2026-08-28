/**
 * WebView tabanlı harita görünümü – MapLibre GL JS + OpenFreeMap.
 * WebGL ile hardware-accelerated vector tile rendering.
 * Expo Go, Simulator ve gerçek cihazda çalışır (native modül gerektirmez).
 */

import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import {
  getIstanbulDistrictsForPicker,
} from '@/src/constants/aiDistricts';
import { CATEGORY_KEYS, STATUS_KEYS } from '@/src/utils/categories';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { SearchInput } from '@/src/components/ui/Input';
import type { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';
import { PlaceMediaPanel } from './PlaceMediaPanel';
import { getPlaceStatus } from '@/src/utils/placeStatus';
import { useTranslation } from 'react-i18next';
import { styles } from './explore-map/webStyles';
import { useExploreWebMap } from './explore-map/useExploreWebMap';

export interface ExploreWebMapViewProps {
  places: Place[];
  loading: boolean;
  onLoadPlaces: () => void;
}

export function ExploreWebMapView({ places, loading }: ExploreWebMapViewProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const {
    webViewRef,
    html,
    mapReady,
    handleMessage,
    onWebViewTouchStart,

    // Search & results
    query,
    setQuery,
    showResults,
    setShowResults,

    // Filters
    showFilter,
    setShowFilter,
    selectedCategories,
    selectedStatuses,
    activeFilterCount,
    toggleCategory,
    toggleStatus,
    clearFilters,

    // District
    selectedDistrict,
    setSelectedDistrict,
    districtModalOpen,
    setDistrictModalOpen,

    // Data
    filteredPlaces,

    // Map actions
    goToUserLocation,
    goToIstanbul,
    handleSelectPlace,

    // Panel
    selectedPlace,
    onCloseSelectedPlace,
  } = useExploreWebMap({ places, isDark, accentColor: colors.accent.primary, t });

  // HTML sabit – WebView tek sefer yüklenir, reload olmaz (kaydırınca loading ekranı gelmez)
  const source = useMemo(() => ({ html }), [html]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={isDark ? 'dark' : 'light'}
        source={source}
        style={[styles.map, { backgroundColor: colors.background.tertiary }]}
        scrollEnabled
        bounces={false}
        overScrollMode="never"
        onContentProcessDidTerminate={() => webViewRef.current?.reload()}
        onRenderProcessGone={() => webViewRef.current?.reload()}
        onMessage={(e: WebViewMessageEvent) => handleMessage(e)}
        onTouchStart={() => {
          onWebViewTouchStart();
        }}
        javaScriptEnabled
        originWhitelist={['*']}
        cacheEnabled
        domStorageEnabled
        startInLoadingState={false}
        setBuiltInZoomControls={false}
        {...(Platform.OS === 'android' && {
          cacheMode: 'LOAD_CACHE_ELSE_NETWORK' as const,
          androidLayerType: 'hardware' as const,
          mixedContentMode: 'always' as const,
          thirdPartyCookiesEnabled: false,
        })}
        renderLoading={() => <></>}
      />

      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.background.secondary + 'CC' },
        ]}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchInputFlex}>
            <SearchInput
              placeholder={t('explore.search_placeholder')}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setShowResults(true);
                onCloseSelectedPlace(false);
              }}
              onFocus={() => {
                setShowResults(true);
                onCloseSelectedPlace(false);
              }}
              onBlur={() => setShowResults(false)}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              rightIcon={query ? 'xmark' : undefined}
              onRightIconPress={() => {
                setQuery('');
                setShowResults(false);
              }}
              containerStyle={styles.searchContainer}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setShowFilter((v) => !v);
              Keyboard.dismiss();
            }}
            style={[
              styles.filterBtn,
              {
                backgroundColor: activeFilterCount > 0 ? colors.accent.primary : colors.surface.elevated,
              },
            ]}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="line.3.horizontal.decrease.circle"
              size={20}
              color={activeFilterCount > 0 ? '#fff' : colors.text.secondary}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* İlçe Seçici */}
        <TouchableOpacity
          style={[
            styles.districtSelector,
            {
              backgroundColor: selectedDistrict ? colors.accent.primary + '1A' : colors.surface.elevated,
              borderColor: selectedDistrict ? colors.accent.primary : colors.surface.border,
            },
          ]}
          onPress={() => {
            lightImpact();
            setDistrictModalOpen(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.districtSelectorLeft}>
            <IconSymbol
              name="mappin.and.ellipse"
              size={14}
              color={selectedDistrict ? colors.accent.primary : colors.text.secondary}
            />
            <Text
              style={[
                styles.districtSelectorText,
                { color: selectedDistrict ? colors.accent.primary : colors.text.primary },
              ]}
            >
              {selectedDistrict 
                ? `${t('explore.district_label', 'İlçe')}: ${selectedDistrict.apiLocation}` 
                : t('explore.select_district', 'İlçe Seçin')}
            </Text>
          </View>
          <View style={styles.districtSelectorRight}>
            {selectedDistrict && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  lightImpact();
                  setSelectedDistrict(null);
                }}
                style={styles.clearDistrictBtn}
              >
                <IconSymbol name="xmark.circle.fill" size={16} color={colors.accent.primary} />
              </TouchableOpacity>
            )}
            <IconSymbol
              name="chevron.down"
              size={12}
              color={selectedDistrict ? colors.accent.primary : colors.text.secondary}
            />
          </View>
        </TouchableOpacity>

        {/* Filtre Paneli */}
        {showFilter && (
          <View style={[styles.filterPanel, { backgroundColor: colors.surface.elevated }]}>
            {/* Kategori */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text.secondary }]}>{t('explore.filter_category')}</Text>
              <View style={styles.chipRow}>
                {CATEGORY_KEYS.map(({ value, tKey }) => {
                  const active = selectedCategories.includes(value);
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.accent.primary : colors.background.secondary,
                          borderColor: active ? colors.accent.primary : colors.surface.border,
                        },
                      ]}
                      onPress={() => toggleCategory(value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? '#fff' : colors.text.primary },
                        ]}
                      >
                        {t(tKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Durum */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text.secondary }]}>{t('explore.filter_status')}</Text>
              <View style={styles.chipRow}>
                {STATUS_KEYS.map((s) => {
                  const active = selectedStatuses.includes(s.key);
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? s.color : colors.background.secondary,
                          borderColor: active ? s.color : colors.surface.border,
                        },
                      ]}
                      onPress={() => toggleStatus(s.key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.chipDot, { backgroundColor: active ? '#fff' : s.color }]} />
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? '#fff' : colors.text.primary },
                        ]}
                      >
                        {t(s.tKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Temizle */}
            {activeFilterCount > 0 && (
              <TouchableOpacity
                onPress={clearFilters}
                style={styles.clearBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.clearBtnText, { color: colors.accent.primary }]}>{t('explore.filter_clear')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {showResults && query.trim().length > 0 && (
          <View style={[styles.resultsCard, { backgroundColor: colors.surface.elevated }]}>
            {filteredPlaces.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                {t('explore.no_results')}
              </Text>
            ) : (
              <ScrollView
                style={styles.resultsScroll}
                contentContainerStyle={styles.resultsScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {filteredPlaces.map((place) => {
                  const placeStatus = getPlaceStatus(place.opening_time, place.closing_time);
                  return (
                    <TouchableOpacity
                      key={String(place.id)}
                      style={styles.resultRow}
                      onPress={() => handleSelectPlace(place)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.statusDot, { backgroundColor: placeStatus.color }]} />
                      <View style={styles.resultText}>
                        <Text style={[styles.resultTitle, { color: colors.text.primary }]} numberOfLines={1}>
                          {place.name}
                        </Text>
                        {!!(place.category || place.city) && (
                          <Text style={[styles.resultMeta, { color: colors.text.tertiary }]} numberOfLines={1}>
                            {[place.category, place.city].filter(Boolean).join(' • ')}
                            {placeStatus.hoursText ? ` · ${placeStatus.label}` : ''}
                          </Text>
                        )}
                      </View>
                      <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={goToUserLocation}
          style={[styles.controlBtn, { backgroundColor: colors.surface.elevated }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="location.fill" size={22} color={colors.accent.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goToIstanbul}
          style={[styles.controlBtn, { backgroundColor: colors.surface.elevated }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="mappin.and.ellipse" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {(loading || !mapReady) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            {mapReady ? t('explore.loading_places') : t('explore.loading_map')}
          </Text>
        </View>
      )}

      <Modal
        visible={districtModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDistrictModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setDistrictModalOpen(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface.elevated }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {t('explore.select_district_title', 'İlçe Seçin')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  setDistrictModalOpen(false);
                }}
                style={styles.modalCloseBtn}
              >
                <IconSymbol name="xmark.circle.fill" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* "Tümü" seçeneği */}
              <TouchableOpacity
                style={[
                  styles.districtItem,
                  !selectedDistrict && [
                    styles.districtItemActive,
                    { backgroundColor: colors.accent.primary + '1F' }
                  ],
                  { borderBottomColor: colors.surface.border }
                ]}
                onPress={() => {
                  lightImpact();
                  setSelectedDistrict(null);
                  setDistrictModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.districtItemText,
                    { color: !selectedDistrict ? colors.accent.primary : colors.text.primary },
                    !selectedDistrict && styles.districtItemTextActive
                  ]}
                >
                  {t('explore.all_districts', 'Tüm İlçeler')}
                </Text>
                {!selectedDistrict && (
                  <IconSymbol name="checkmark" size={18} color={colors.accent.primary} />
                )}
              </TouchableOpacity>

              {/* İlçeler listesi */}
              {getIstanbulDistrictsForPicker().map((district) => {
                const isActive = selectedDistrict?.id === district.id;
                return (
                  <TouchableOpacity
                    key={district.id}
                    style={[
                      styles.districtItem,
                      isActive && [
                        styles.districtItemActive,
                        { backgroundColor: colors.accent.primary + '1F' }
                      ],
                      { borderBottomColor: colors.surface.border }
                    ]}
                    onPress={() => {
                      lightImpact();
                      setSelectedDistrict(district);
                      setDistrictModalOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.districtItemText,
                        { color: isActive ? colors.accent.primary : colors.text.primary },
                        isActive && styles.districtItemTextActive
                      ]}
                    >
                      {district.apiLocation}
                    </Text>
                    {isActive && (
                      <IconSymbol name="checkmark" size={18} color={colors.accent.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {selectedPlace && (
        <PlaceMediaPanel
          place={selectedPlace}
          onClose={() => onCloseSelectedPlace(true)}
        />
      )}
    </View>
  );
}
