import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getIstanbulDistrictsForPicker,
  type AiSearchDistrict,
} from '@/src/constants/aiDistricts';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { SearchInput } from '@/src/components/ui/Input';
import { useTheme } from '@/src/hooks/useTheme';
import type { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';
import { CATEGORY_KEYS, STATUS_KEYS } from '@/src/utils/categories';
import { getPlaceStatus, type PlaceStatusType } from '@/src/utils/placeStatus';

import { styles } from './styles';

interface ExploreMapControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearQuery: () => void;
  showFilter: boolean;
  onCloseFilter: () => void;
  onToggleFilter: () => void;
  activeFilterCount: number;
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  selectedStatuses: PlaceStatusType[];
  onToggleStatus: (status: PlaceStatusType) => void;
  onClearFilters: () => void;
  selectedDistrict: AiSearchDistrict | null;
  onClearDistrict: () => void;
  districtModalOpen: boolean;
  onOpenDistrictModal: () => void;
  onCloseDistrictModal: () => void;
  onSelectDistrict: (district: AiSearchDistrict | null) => void;
  showResults: boolean;
  filteredPlaces: Place[];
  onSelectPlace: (place: Place) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

export function ExploreMapControls({
  query,
  onQueryChange,
  onSearchFocus,
  onSearchBlur,
  onClearQuery,
  showFilter,
  onCloseFilter,
  onToggleFilter,
  activeFilterCount,
  selectedCategories,
  onToggleCategory,
  selectedStatuses,
  onToggleStatus,
  onClearFilters,
  selectedDistrict,
  onClearDistrict,
  districtModalOpen,
  onOpenDistrictModal,
  onCloseDistrictModal,
  onSelectDistrict,
  showResults,
  filteredPlaces,
  onSelectPlace,
  userLocation,
}: ExploreMapControlsProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      {showFilter && <Pressable style={styles.filterBackdrop} onPressIn={onCloseFilter} />}

      <View style={[styles.searchWrap, { backgroundColor: 'transparent' }]}>
        <GlassCard
          tint={isDark ? 'dark' : 'light'}
          intensity={40}
          borderRadius={0}
          style={styles.absoluteFill}
        />
        <View style={styles.searchRow}>
          <View style={styles.searchInputFlex}>
            <SearchInput
              placeholder={t('explore.search_placeholder')}
              value={query}
              onChangeText={onQueryChange}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              rightIcon={query ? 'xmark' : undefined}
              onRightIconPress={onClearQuery}
              containerStyle={styles.searchContainer}
            />
          </View>
          <TouchableOpacity
            onPress={onToggleFilter}
            style={[
              styles.filterBtn,
              {
                backgroundColor:
                  activeFilterCount > 0
                    ? colors.accent.primary
                    : colors.surface.elevated,
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

        <View style={styles.districtActions}>
          <TouchableOpacity
            style={[
              styles.districtSelector,
              styles.districtSelectorExpanded,
              {
                backgroundColor: selectedDistrict
                  ? `${colors.accent.primary}1A`
                  : colors.surface.elevated,
                borderColor: selectedDistrict
                  ? colors.accent.primary
                  : colors.surface.border,
              },
            ]}
            onPress={onOpenDistrictModal}
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
                  {
                    color: selectedDistrict
                      ? colors.accent.primary
                      : colors.text.primary,
                  },
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
                  onPress={(event) => {
                    event.stopPropagation();
                    lightImpact();
                    onClearDistrict();
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

          <TouchableOpacity
            style={[
              styles.districtSelector,
              styles.globalListButton,
              {
                backgroundColor: colors.surface.elevated,
                borderColor: colors.surface.border,
              },
            ]}
            onPress={() => {
              lightImpact();
              router.push({
                pathname: '/cluster-places',
                params: {
                  isGlobal: 'true',
                  lat: userLocation?.latitude || 0,
                  lng: userLocation?.longitude || 0,
                },
              });
            }}
            activeOpacity={0.7}
          >
            <IconSymbol name="list.bullet" size={18} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {showFilter && (
          <Pressable
            style={[styles.filterPanel, { backgroundColor: colors.surface.elevated }]}
            onPress={() => {}}
          >
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text.secondary }]}>
                {t('explore.filter_category')}
              </Text>
              <View style={styles.chipRow}>
                {CATEGORY_KEYS.map(({ value, tKey }) => {
                  const active = selectedCategories.includes(value);
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active
                            ? colors.accent.primary
                            : colors.background.secondary,
                          borderColor: active
                            ? colors.accent.primary
                            : colors.surface.border,
                        },
                      ]}
                      onPress={() => onToggleCategory(value)}
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

            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text.secondary }]}>
                {t('explore.filter_status')}
              </Text>
              <View style={styles.chipRow}>
                {STATUS_KEYS.map((status) => {
                  const active = selectedStatuses.includes(status.key);
                  return (
                    <TouchableOpacity
                      key={status.key}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active
                            ? status.color
                            : colors.background.secondary,
                          borderColor: active ? status.color : colors.surface.border,
                        },
                      ]}
                      onPress={() => onToggleStatus(status.key)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.chipDot,
                          { backgroundColor: active ? '#fff' : status.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? '#fff' : colors.text.primary },
                        ]}
                      >
                        {t(status.tKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={onClearFilters} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={[styles.clearBtnText, { color: colors.accent.primary }]}>
                  {t('explore.filter_clear')}
                </Text>
              </TouchableOpacity>
            )}
          </Pressable>
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
                {filteredPlaces.slice(0, 50).map((place) => {
                  const placeStatus = getPlaceStatus(place.opening_time, place.closing_time);
                  return (
                    <TouchableOpacity
                      key={String(place.id)}
                      style={styles.resultRow}
                      onPress={() => onSelectPlace(place)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.statusDot, { backgroundColor: placeStatus.color }]} />
                      <View style={styles.resultText}>
                        <Text
                          style={[styles.resultTitle, { color: colors.text.primary }]}
                          numberOfLines={1}
                        >
                          {place.name}
                        </Text>
                        {!!(place.category || place.city) && (
                          <Text
                            style={[styles.resultMeta, { color: colors.text.tertiary }]}
                            numberOfLines={1}
                          >
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

      <Modal
        visible={districtModalOpen}
        animationType="slide"
        transparent
        onRequestClose={onCloseDistrictModal}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={onCloseDistrictModal}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface.elevated }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {t('explore.select_district_title', 'İlçe Seçin')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  onCloseDistrictModal();
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
              <TouchableOpacity
                style={[
                  styles.districtItem,
                  !selectedDistrict && [
                    styles.districtItemActive,
                    { backgroundColor: `${colors.accent.primary}1F` },
                  ],
                  { borderBottomColor: colors.surface.border },
                ]}
                onPress={() => onSelectDistrict(null)}
              >
                <Text
                  style={[
                    styles.districtItemText,
                    {
                      color: !selectedDistrict
                        ? colors.accent.primary
                        : colors.text.primary,
                    },
                    !selectedDistrict && styles.districtItemTextActive,
                  ]}
                >
                  {t('explore.all_districts', 'Tüm İlçeler')}
                </Text>
                {!selectedDistrict && (
                  <IconSymbol name="checkmark" size={18} color={colors.accent.primary} />
                )}
              </TouchableOpacity>

              {getIstanbulDistrictsForPicker().map((district) => {
                const isActive = selectedDistrict?.id === district.id;
                return (
                  <TouchableOpacity
                    key={district.id}
                    style={[
                      styles.districtItem,
                      isActive && [
                        styles.districtItemActive,
                        { backgroundColor: `${colors.accent.primary}1F` },
                      ],
                      { borderBottomColor: colors.surface.border },
                    ]}
                    onPress={() => onSelectDistrict(district)}
                  >
                    <Text
                      style={[
                        styles.districtItemText,
                        {
                          color: isActive
                            ? colors.accent.primary
                            : colors.text.primary,
                        },
                        isActive && styles.districtItemTextActive,
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
    </>
  );
}
