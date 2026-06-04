/**
 * AI Mekan Öneri Ekranı
 *
 * Kullanıcı doğal dil ile mekan arar:
 *   "Kadıköy'de romantik sessiz kafe"
 *   "Ailecek gidebileceğimiz bahçeli restoran"
 *
 * Backend: demo_backend_v2.py (localhost:8080)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  ScrollView,
  Keyboard,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';
import { smartSearch, checkAIHealth, getAIBaseUrl, imageSearch } from '@/src/services/aiService';
import type { Place, SmartSearchResponse } from '@/src/types/ai';
import { filterCompleteAiRecommendations } from '@/src/utils/aiPlaceValidation';
import { AI_SEARCH_CITIES, getAiCityById, type AiSearchCity, type AiSearchCityId } from '@/src/constants/aiCities';
import { useSettingsStore } from '@/src/store/useSettingsStore';

const EXAMPLE_QUERIES = [
  '🌊 Deniz manzaralı sessiz kafe',
  '👨‍👩‍👧 Ailecek bahçeli restoran',
  '💑 Romantik akşam yemeği',
  '💼 Çalışmak için kafe',
  '🍔 İyi hamburger',
  '☕ Nargile mekan',
];

// ─── Mesaj tipleri ────────────────────────────────────────────
type UserMessage    = { id: string; type: 'user';    text: string };
type ImageMessage   = { id: string; type: 'image';   uri: string; detectedQuery?: string };
type BotMessage     = { id: string; type: 'bot';     text: string };
type PlacesMessage  = { id: string; type: 'places';  places: Place[]; cached: boolean };
type ErrorMessage   = { id: string; type: 'error';   text: string };
type LoadingMessage = { id: string; type: 'loading' };
type Message = UserMessage | ImageMessage | BotMessage | PlacesMessage | ErrorMessage | LoadingMessage;

// ─── Mekan Kartı ──────────────────────────────────────────────
function PlaceCard({ place, colors }: { place: Place; colors: any }) {
  const stars = '★'.repeat(Math.round(place.rating)) + '☆'.repeat(5 - Math.round(place.rating));
  const priceSymbol = '₺'.repeat(place.price_level || 1);
  const score = place.rerank_score ? Math.round(place.rerank_score * 100) : null;

  const [reviewModal, setReviewModal] = useState(false);
  const [reviewData, setReviewData]   = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const openMaps = () => {
    if (place.latitude && place.longitude) {
      const url = Platform.OS === 'ios'
        ? `maps:?q=${place.name}&ll=${place.latitude},${place.longitude}`
        : `geo:${place.latitude},${place.longitude}?q=${encodeURIComponent(place.name)}`;
      Linking.openURL(url).catch(() =>
        Linking.openURL(`https://maps.google.com/?q=${place.latitude},${place.longitude}`)
      );
    }
  };

  const analyzeReviews = async () => {
    setReviewModal(true);
    if (reviewData) return;
    setReviewLoading(true);
    try {
      const base = getAIBaseUrl();
      const res = await fetch(`${base}/api/analyze-place-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_id: place.data_id || '',
          place_name: place.name,
        }),
      });
      const json = await res.json();
      setReviewData(json);
    } catch (e) {
      setReviewData({ success: false, analysis_text: 'Yorumlar yüklenemedi.' });
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
      {place.photo_url ? (
        <Image
          source={{ uri: place.photo_url }}
          style={styles.cardImage}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.surface.default }]}>
          <Ionicons name="restaurant-outline" size={32} color={colors.text.tertiary} />
        </View>
      )}

      <View style={styles.cardBody}>
        {/* Başlık satırı */}
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardName, { color: colors.text.primary }]} numberOfLines={1}>
            {place.name}
          </Text>
          {score !== null && (
            <View style={[styles.scoreBadge, { backgroundColor: colors.accent.primary + '22' }]}>
              <Text style={[styles.scoreText, { color: colors.accent.primary }]}>{score}%</Text>
            </View>
          )}
        </View>

        {/* Kategori & fiyat */}
        <Text style={[styles.cardMeta, { color: colors.text.secondary }]}>
          {place.category}  ·  {priceSymbol}
        </Text>

        {/* Rating */}
        <Text style={[styles.cardStars, { color: '#f59e0b' }]}>
          {stars}  <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>({place.review_count} yorum)</Text>
        </Text>

        {/* Adres */}
        {place.address ? (
          <Text style={[styles.cardAddress, { color: colors.text.tertiary }]} numberOfLines={2}>
            <Ionicons name="location-outline" size={12} /> {place.address}
          </Text>
        ) : null}

        {/* Mesafe */}
        {place.distance_km ? (
          <Text style={[styles.cardDistance, { color: colors.accent.primary }]}>
            <Ionicons name="navigate-outline" size={12} /> {place.distance_km} km uzaklıkta
          </Text>
        ) : null}

        {/* Öneri nedeni */}
        {place.recommendation_reason ? (
          <View style={[styles.reasonBox, { backgroundColor: colors.accent.primary + '15' }]}>
            <Text style={[styles.reasonText, { color: colors.accent.primary }]}>
              💡 {place.recommendation_reason}
            </Text>
          </View>
        ) : null}

        {/* Aksiyon butonları */}
        <View style={styles.cardActions}>
          {/* Haritada Aç */}
          {place.latitude ? (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.surface.border }]}
              onPress={openMaps}
              accessibilityLabel="Haritada aç"
            >
              <Ionicons name="map-outline" size={14} color={colors.text.secondary} />
              <Text style={[styles.actionBtnText, { color: colors.text.secondary }]}>Haritada Aç</Text>
            </TouchableOpacity>
          ) : null}

          {/* Yorum Analiz Et */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.reviewBtn, { borderColor: colors.accent.primary + '60', backgroundColor: colors.accent.primary + '12' }]}
            onPress={analyzeReviews}
            accessibilityLabel="Yorumları AI ile analiz et"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.accent.primary} />
            <Text style={[styles.actionBtnText, { color: colors.accent.primary, fontWeight: '600' }]}>
              🤖 Yorumları Analiz Et
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Yorum Analiz Modalı ── */}
      {reviewModal && (
        <View style={[styles.reviewOverlay, { backgroundColor: colors.background.primary + 'f5' }]}>
          {/* Kapat */}
          <TouchableOpacity style={styles.reviewClose} onPress={() => setReviewModal(false)}>
            <Ionicons name="close-circle" size={28} color={colors.text.secondary} />
          </TouchableOpacity>

          <Text style={[styles.reviewTitle, { color: colors.text.primary }]}>
            🤖 AI Yorum Analizi
          </Text>
          <Text style={[styles.reviewPlaceName, { color: colors.accent.primary }]}>
            {place.name}
          </Text>

          {reviewLoading ? (
            <View style={styles.reviewLoadingWrap}>
              <ActivityIndicator size="large" color={colors.accent.primary} />
              <Text style={[styles.reviewLoadingText, { color: colors.text.secondary }]}>
                Yorumlar analiz ediliyor...
              </Text>
            </View>
          ) : reviewData ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {/* Analiz metni */}
              <View style={[styles.reviewAnalysisBox, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
                <Text style={[styles.reviewAnalysisText, { color: colors.text.primary }]}>
                  {reviewData.analysis_text || 'Analiz metni bulunamadı.'}
                </Text>
              </View>

              {/* Specialties */}
              {reviewData.specialties && reviewData.specialties.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.reviewSectionTitle, { color: colors.text.secondary }]}>
                    ÖNE ÇIKAN ÖZELLİKLER
                  </Text>
                  {reviewData.specialties.slice(0, 5).map((s: any, i: number) => (
                    <View key={i} style={[styles.specialtyRow, { borderColor: colors.surface.border }]}>
                      <Text style={styles.specialtyEmoji}>{s.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.specialtyLabel, { color: colors.text.primary }]}>{s.label}</Text>
                        <Text style={[styles.specialtyCount, { color: colors.text.tertiary }]}>
                          {s.mention_count} yorumda geçiyor
                        </Text>
                      </View>
                      {/* Bar */}
                      <View style={[styles.specialtyBarBg, { backgroundColor: colors.surface.border }]}>
                        <View style={[styles.specialtyBar, {
                          backgroundColor: colors.accent.primary,
                          width: `${Math.min(100, (s.mention_count / 10) * 100)}%`,
                        }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Highlight tags */}
              {reviewData.highlight_tags && reviewData.highlight_tags.length > 0 && (
                <View style={styles.tagWrap}>
                  {reviewData.highlight_tags.map((tag: string, i: number) => (
                    <View key={i} style={[styles.tag, { backgroundColor: colors.accent.primary + '20', borderColor: colors.accent.primary + '40' }]}>
                      <Text style={[styles.tagText, { color: colors.accent.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Yorum sayısı */}
              {reviewData.review_count > 0 && (
                <Text style={[styles.reviewCountText, { color: colors.text.tertiary }]}>
                  Toplam {reviewData.review_count} yorum analiz edildi
                </Text>
              )}
            </ScrollView>
          ) : null}
        </View>
      )}
    </View>
  );
}


// ─── Ana Ekran ────────────────────────────────────────────────
export default function AISearchScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const aiSearchCityId = useSettingsStore((s) => s.aiSearchCityId);
  const setAiSearchCityId = useSettingsStore((s) => s.setAiSearchCityId);
  const selectedCity: AiSearchCity = getAiCityById(aiSearchCityId);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [inputText, setInputText]       = useState('');
  const [isLoading, setIsLoading]      = useState(false);
  const [modelReady, setModelReady]    = useState<boolean | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Klavye aç/kapa — lokasyon barı gizle
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setInputText('');
  }, []);

  const flatRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
  }, [scrollToBottom]);

  const removeLoading = useCallback(() => {
    setMessages(prev => prev.filter(m => m.type !== 'loading'));
  }, []);

  // ─── Görsel arama ───────────────────────────────────────────────
  const handleImageSearch = useCallback(async () => {
    if (isLoading) return;

    // Kamera izni iste
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri iznine ihtiyaç var.');
      return;
    }

    // Fotoğraf seç: galeri veya kamera
    Alert.alert(
      'Görsel Ara 📸',
      'Bir yemek, içecek veya ortam fotoğrafı seç — AI mekan bulsun!',
      [
        {
          text: 'Kamerayı Aç',
          onPress: async () => {
            const camStatus = await ExpoImagePicker.requestCameraPermissionsAsync();
            if (camStatus.status !== 'granted') {
              Alert.alert('İzin Gerekli', 'Kamera izni gerekli.');
              return;
            }
            const result = await ExpoImagePicker.launchCameraAsync({
              mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
              quality: 0.6,
              base64: true,
            });
            if (!result.canceled && result.assets[0]) {
              await _processPickedImage(result.assets[0]);
            }
          },
        },
        {
          text: 'Galeriden Seç',
          onPress: async () => {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
              mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
              quality: 0.6,
              base64: true,
            });
            if (!result.canceled && result.assets[0]) {
              await _processPickedImage(result.assets[0]);
            }
          },
        },
        { text: 'İptal', style: 'cancel' },
      ],
    );
  }, [isLoading]);

  const _processPickedImage = useCallback(async (asset: ExpoImagePicker.ImagePickerAsset) => {
    if (!asset.base64) {
      Alert.alert('Hata', 'Görsel alınamadı.');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    // Görseli sohbete ekle
    const imgMsg: ImageMessage = {
      id: Date.now().toString(),
      type: 'image',
      uri: asset.uri,
    };
    addMessage(imgMsg);
    addMessage({ id: `loading-${Date.now()}`, type: 'loading' });

    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const res = await imageSearch(asset.base64, mimeType, {
        location: selectedCity.apiLocation,
        userLat: selectedCity.lat,
        userLng: selectedCity.lng,
      });

      removeLoading();

      // Görsel analiz sonucunu göster
      const analysis = (res as any).image_analysis;
      if (analysis?.description) {
        // İmage msg'i güncelle — detected query'yi ekle
        setMessages(prev => prev.map(m =>
          m.id === imgMsg.id
            ? { ...m, detectedQuery: analysis.detected_query }
            : m
        ));
      }

      if (!res.recommendations || res.recommendations.length === 0) {
        addMessage({
          id: Date.now().toString(),
          type: 'bot',
          text: '😔 Bu görsel için uygun mekan bulamadım. Daha net bir fotoğraf dene.',
        });
      } else {
        const places = filterCompleteAiRecommendations(res.recommendations ?? []);
        if (places.length === 0) {
          addMessage({
            id: Date.now().toString(),
            type: 'bot',
            text: '😔 Bu görsel için tam bilgili mekan bulamadım. Daha net bir fotoğraf dene.',
          });
        } else {
          addMessage({
            id: Date.now().toString(),
            type: 'places',
            places,
            cached: res._cache?.hit ?? false,
          });
        }
      }
    } catch (err: any) {
      removeLoading();
      addMessage({
        id: Date.now().toString(),
        type: 'error',
        text: `❌ Görsel analiz hatası: ${err?.message ?? 'Bilinmeyen hata'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity, addMessage, removeLoading]);


  // Backend health check (non-blocking — aramayı geciktirmez)
  useEffect(() => {
    let cancelled = false;
    checkAIHealth()
      .then(({ ok }) => {
        if (!cancelled) setModelReady(ok);
      })
      .catch(() => {
        if (!cancelled) setModelReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);


  const handleSend = useCallback(async (queryOverride?: string) => {
    const text = (queryOverride ?? inputText).trim();
    if (!text || isLoading) return;

    Keyboard.dismiss();
    setInputText('');
    setIsLoading(true);

    const userMsg: UserMessage = { id: Date.now().toString(), type: 'user', text };
    addMessage(userMsg);
    addMessage({ id: `loading-${Date.now()}`, type: 'loading' });

    try {
      const res: SmartSearchResponse = await smartSearch({
        query: text,
        location: selectedCity.apiLocation,
        user_lat: selectedCity.lat,
        user_lng: selectedCity.lng,
        limit: 5,
        max_distance_km: 10,
        analyze_reviews: false,
      });

      removeLoading();

      const emptyMsg = !selectedCity.hasFullData
        ? t('ai_search.no_results_other_city', { city: t(`ai_search.cities.${selectedCity.id}`) })
        : t('ai_search.no_results');

      if (res.is_conversational && res.message) {
        addMessage({ id: Date.now().toString(), type: 'bot', text: res.message });
      } else if (!res.recommendations || res.recommendations.length === 0) {
        addMessage({
          id: Date.now().toString(),
          type: 'bot',
          text: emptyMsg,
        });
      } else {
        const places = filterCompleteAiRecommendations(res.recommendations ?? []);
        if (places.length === 0) {
          addMessage({
            id: Date.now().toString(),
            type: 'bot',
            text: emptyMsg,
          });
        } else {
          addMessage({
            id: Date.now().toString(),
            type: 'places',
            places,
            cached: res._cache?.hit ?? false,
          });
        }
      }
    } catch (err: any) {
      removeLoading();
      addMessage({
        id: Date.now().toString(),
        type: 'error',
        text: `❌ Hata: ${err?.message ?? 'Bilinmeyen hata'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, selectedCity, addMessage, removeLoading, t]);

  // ─── Render item ────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: Message }) => {
    if (item.type === 'loading') {
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accent.primary} />
          <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>
            AI mekanları analiz ediyor...
          </Text>
        </View>
      );
    }

    if (item.type === 'user') {
      return (
        <View style={styles.userBubbleWrap}>
          <View style={[styles.userBubble, { backgroundColor: colors.accent.primary }]}>
            <Text style={styles.userBubbleText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'image') {
      return (
        <View style={styles.userBubbleWrap}>
          <View style={[styles.imageBubble, { borderColor: colors.accent.primary + '60', backgroundColor: colors.background.secondary }]}>
            <Image
              source={{ uri: item.uri }}
              style={styles.imageBubbleImg}
              contentFit="cover"
              transition={200}
            />
            {item.detectedQuery && (
              <View style={[styles.detectedTag, { backgroundColor: colors.accent.primary }]}>
                <Ionicons name="sparkles" size={10} color="#fff" />
                <Text style={styles.detectedTagText}>{item.detectedQuery}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    if (item.type === 'bot') {
      return (
        <View style={styles.botBubbleWrap}>
          <View style={[styles.botBubble, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
            <Text style={[styles.botBubbleText, { color: colors.text.primary }]}>{item.text}</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'error') {
      return (
        <View style={styles.botBubbleWrap}>
          <View style={[styles.botBubble, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={{ color: '#dc2626', fontSize: 13 }}>{item.text}</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'places') {
      return (
        <View style={styles.botBubbleWrap}>
          <Text style={[styles.botIntro, { color: colors.text.secondary }]}>
            {item.places.length} mekan bulundu:{item.cached ? '  ⚡ önbellekten' : ''}
          </Text>
          {item.places.map(p => (
            <PlaceCard key={p.data_id || p.name} place={p} colors={colors} />
          ))}
        </View>
      );
    }

    return null;
  }, [colors]);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.background.secondary, borderBottomColor: colors.surface.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.accent.primary }]}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('ai_search.title')}</Text>
            <Text style={[styles.headerStatus, {
              color: modelReady === null ? colors.text.tertiary
                   : modelReady ? '#10b981'
                   : '#ef4444',
            }]}>
              {modelReady === null
                ? t('ai_search.status_connecting')
                : modelReady
                  ? t('ai_search.status_online')
                  : t('ai_search.status_offline')}
            </Text>
          </View>
        </View>
      </View>

      {/* ── İl seçici — klavye açıkken gizle ── */}
      {!keyboardVisible && (
        <View style={[styles.cityBarWrap, { backgroundColor: colors.background.secondary, borderBottomColor: colors.surface.border }]}>
          <Text style={[styles.cityBarLabel, { color: colors.text.tertiary }]}>{t('ai_search.city_label')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locBarContent}
          >
            {AI_SEARCH_CITIES.map((city) => (
              <TouchableOpacity
                key={city.id}
                style={[
                  styles.locChip,
                  {
                    backgroundColor: selectedCity.id === city.id
                      ? colors.accent.primary
                      : colors.surface.elevated,
                    borderColor: selectedCity.id === city.id
                      ? colors.accent.primary
                      : colors.surface.border,
                  },
                ]}
                onPress={() => setAiSearchCityId(city.id as AiSearchCityId)}
                accessibilityLabel={t('ai_search.city_select_a11y', { city: t(`ai_search.cities.${city.id}`) })}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: selectedCity.id === city.id ? '#fff' : colors.text.secondary,
                }}>
                  {t(`ai_search.cities.${city.id}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {!selectedCity.hasFullData && (
            <Text style={[styles.cityHint, { color: colors.text.tertiary }]}>
              {t('ai_search.city_limited_data')}
            </Text>
          )}
        </View>
      )}

      {/* ── Mesaj listesi ── */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.chatContent,
          { paddingBottom: Platform.OS === 'ios' ? 120 : 80 },
        ]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {t('ai_search.empty_title')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.text.secondary }]}>
              {t('ai_search.empty_desc')}
            </Text>
            {/* Örnek chip'ler */}
            <View style={styles.examplesWrap}>
              {EXAMPLE_QUERIES.map(q => (
                <TouchableOpacity
                  key={q}
                  style={[styles.exampleChip, { borderColor: colors.accent.primary, backgroundColor: colors.accent.primary + '12' }]}
                  onPress={() => handleSend(q.replace(/^[^\w\s]+\s*/, '').trim())}
                  accessibilityLabel={`Örnek sorgu: ${q}`}
                >
                  <Text style={{ fontSize: 12, color: colors.accent.primary }}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        onContentSizeChange={scrollToBottom}
      />

      {/* ── Input Bar ── */}
      <View style={[
        styles.inputBar,
        {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.surface.border,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
      ]}>
        {/* Üst satır: metin + kamera */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface.elevated, color: colors.text.primary, borderColor: colors.surface.border }]}
            placeholder={t('ai_search.input_placeholder')}
            placeholderTextColor={colors.text.tertiary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            editable={!isLoading}
            multiline={false}
          />
          {/* Kamera — input içinde sağda */}
          <TouchableOpacity
            style={[styles.cameraBtn, { backgroundColor: isLoading ? colors.surface.border : colors.accent.primary + '20', borderColor: colors.accent.primary + '40' }]}
            onPress={handleImageSearch}
            disabled={isLoading}
            accessibilityLabel="Fotoğrafla ara"
          >
            <Ionicons name="camera" size={18} color={isLoading ? colors.text.tertiary : colors.accent.primary} />
          </TouchableOpacity>
        </View>

        {/* Alt satır: Temizle (varsa) + Mekan Ara */}
        <View style={styles.actionRow}>
          {messages.length > 0 && (
            <TouchableOpacity
              style={[styles.clearBtnBottom, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
              onPress={clearChat}
              accessibilityLabel="Sohbeti temizle"
            >
              <Ionicons name="trash-outline" size={16} color={colors.text.tertiary} />
              <Text style={[styles.clearBtnText, { color: colors.text.tertiary }]}>Temizle</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: isLoading || !inputText.trim()
                  ? colors.surface.border
                  : colors.accent.primary,
                flex: 1,
              },
            ]}
            onPress={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            accessibilityLabel="Mekan Ara"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>Mekan Ara</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  clearBtnText: { fontSize: 12, fontWeight: '500' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerStatus: { fontSize: 12, marginTop: 2 },

  // İl seçici
  cityBarWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    paddingBottom: 8,
  },
  cityBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    paddingHorizontal: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cityHint: {
    fontSize: 11,
    lineHeight: 15,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  locBarContent: { paddingHorizontal: 10, paddingVertical: 2, gap: 8, flexDirection: 'row' },
  locChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
  },

  // Chat
  chatContent: { padding: 12, gap: 10, flexGrow: 1 },

  // User bubble
  userBubbleWrap: { alignSelf: 'flex-end', maxWidth: '80%' },
  userBubble: { borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  userBubbleText: { color: '#fff', fontSize: 14, lineHeight: 20 },

  // Bot bubble
  botBubbleWrap: { alignSelf: 'stretch', width: '100%' },
  botBubble: { borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  botBubbleText: { fontSize: 14, lineHeight: 20 },
  botIntro: { fontSize: 13, marginBottom: 8, marginLeft: 2 },

  // Loading
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13 },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  examplesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  exampleChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },

  // Mekan kartı
  card: {
    borderRadius: 16, borderWidth: 1,
    overflow: 'hidden', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    width: '100%',
  },
  cardImage: { width: '100%', aspectRatio: 16 / 9 },
  cardImagePlaceholder: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14, gap: 4 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', flex: 1 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 8 },
  scoreText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { fontSize: 13 },
  cardStars: { fontSize: 13 },
  cardAddress: { fontSize: 12, marginTop: 2 },
  cardDistance: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  reasonBox: { borderRadius: 8, padding: 8, marginTop: 6 },
  reasonText: { fontSize: 12, lineHeight: 16 },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 6, marginTop: 8, alignSelf: 'flex-start',
  },
  mapsBtnText: { fontSize: 12 },

  // Aksiyon butonları (yeni)
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 6, alignSelf: 'flex-start',
  },
  actionBtnText: { fontSize: 12 },
  reviewBtn: { flex: 1 },

  // Yorum Analiz Modalı
  reviewOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16, padding: 16, zIndex: 10,
  },
  reviewClose: { alignSelf: 'flex-end', marginBottom: 4 },
  reviewTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  reviewPlaceName: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  reviewLoadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  reviewLoadingText: { fontSize: 13 },
  reviewAnalysisBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  reviewAnalysisText: { fontSize: 13, lineHeight: 20 },
  reviewSectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  specialtyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  specialtyEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  specialtyLabel: { fontSize: 13, fontWeight: '600' },
  specialtyCount: { fontSize: 11, marginTop: 1 },
  specialtyBarBg: { width: 60, height: 4, borderRadius: 2, overflow: 'hidden' },
  specialtyBar: { height: 4, borderRadius: 2 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '500' },
  reviewCountText: { fontSize: 11, textAlign: 'center', marginTop: 12 },

  // Input bar
  inputBar: {
    flexDirection: 'column',
    paddingHorizontal: 12, paddingTop: 10, gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  input: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 12,
  },
  sendBtnText: {
    color: '#fff', fontSize: 15, fontWeight: '700',
  },
  cameraBtn: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
  },
  clearBtnBottom: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  clearBtnText: { fontSize: 13, fontWeight: '600' },

  // Görsel mesaj balonu
  imageBubble: {
    borderWidth: 2, borderRadius: 16, overflow: 'hidden',
    maxWidth: 220, alignSelf: 'flex-end',
  },
  imageBubbleImg: {
    width: 220, height: 165,
  },
  detectedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  detectedTagText: {
    color: '#fff', fontSize: 11, fontWeight: '600', flex: 1, flexWrap: 'wrap',
  },
});
