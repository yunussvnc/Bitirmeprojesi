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
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { smartSearch, checkAIHealth } from '@/src/services/aiService';
import type { Place, SmartSearchResponse } from '@/src/types/ai';

// ─── Sabit lokasyonlar ───────────────────────────────────────
const LOCATIONS = [
  { label: 'Kadıköy',   lat: 40.9839, lng: 29.0267 },
  { label: 'Taksim',    lat: 41.0370, lng: 28.9850 },
  { label: 'Beşiktaş',  lat: 41.0427, lng: 29.0089 },
  { label: 'Ortaköy',   lat: 41.0478, lng: 29.0260 },
  { label: 'Şişli',     lat: 41.0613, lng: 28.9877 },
  { label: 'Üsküdar',   lat: 41.0256, lng: 29.0163 },
  { label: 'Moda',      lat: 40.9785, lng: 29.0242 },
  { label: 'Karaköy',   lat: 41.0227, lng: 28.9760 },
];

const EXAMPLE_QUERIES = [
  '🌊 Deniz manzaralı sessiz kafe',
  '👨‍👩‍👧 Ailecek bahçeli restoran',
  '💑 Romantik akşam yemeği',
  '💼 Çalışmak için kafe',
  '🍔 İyi hamburger',
  '☕ Nargile mekan',
];

// ─── Mesaj tipleri ────────────────────────────────────────────
type UserMessage  = { id: string; type: 'user';    text: string };
type BotMessage   = { id: string; type: 'bot';     text: string };
type PlacesMessage = { id: string; type: 'places'; places: Place[]; cached: boolean };
type ErrorMessage  = { id: string; type: 'error';  text: string };
type LoadingMessage = { id: string; type: 'loading' };
type Message = UserMessage | BotMessage | PlacesMessage | ErrorMessage | LoadingMessage;

// ─── Mekan Kartı ──────────────────────────────────────────────
function PlaceCard({ place, colors }: { place: Place; colors: any }) {
  const stars = '★'.repeat(Math.round(place.rating)) + '☆'.repeat(5 - Math.round(place.rating));
  const priceSymbol = '₺'.repeat(place.price_level || 1);
  const score = place.rerank_score ? Math.round(place.rerank_score * 100) : null;

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

        {/* Haritada aç */}
        {place.latitude ? (
          <TouchableOpacity
            style={[styles.mapsBtn, { borderColor: colors.surface.border }]}
            onPress={openMaps}
            accessibilityLabel="Haritada aç"
          >
            <Ionicons name="map-outline" size={14} color={colors.text.secondary} />
            <Text style={[styles.mapsBtnText, { color: colors.text.secondary }]}>Haritada Aç</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────
export default function AISearchScreen() {
  const { colors } = useTheme();
  const [messages, setMessages]         = useState<Message[]>([]);
  const [inputText, setInputText]       = useState('');
  const [selectedLoc, setSelectedLoc]  = useState(LOCATIONS[0]);
  const [isLoading, setIsLoading]      = useState(false);
  const [modelReady, setModelReady]    = useState<boolean | null>(null);
  const flatRef = useRef<FlatList>(null);

  // Backend health check
  useEffect(() => {
    checkAIHealth().then(({ ok, modelLoaded }) => {
      setModelReady(ok && modelLoaded);
      if (!ok) {
        setMessages([{
          id: 'sys-err',
          type: 'error',
          text: '⚠️ AI backend bağlantısı kurulamadı. Lütfen backend\'in çalıştığından emin olun (localhost:8080).',
        }]);
      }
    });
  }, []);

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
      const finalQuery = selectedLoc
        ? `${selectedLoc.label} ${text}`
        : text;

      const res: SmartSearchResponse = await smartSearch({
        query: finalQuery,
        location: selectedLoc.label,
        user_lat: selectedLoc.lat,
        user_lng: selectedLoc.lng,
        limit: 5,
        max_distance_km: 10,
        analyze_reviews: false,
      });

      removeLoading();

      if (res.is_conversational && res.message) {
        addMessage({ id: Date.now().toString(), type: 'bot', text: res.message });
      } else if (!res.recommendations || res.recommendations.length === 0) {
        addMessage({
          id: Date.now().toString(),
          type: 'bot',
          text: '😔 Bu kriterlere uygun bir mekan bulamadım. Biraz daha genel bir arama dene.',
        });
      } else {
        addMessage({
          id: Date.now().toString(),
          type: 'places',
          places: res.recommendations,
          cached: res._cache?.hit ?? false,
        });
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
  }, [inputText, isLoading, selectedLoc, addMessage, removeLoading]);

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.background.secondary, borderBottomColor: colors.surface.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.accent.primary }]}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>AI Mekan Önerisi</Text>
            <Text style={[styles.headerStatus, {
              color: modelReady === null ? colors.text.tertiary
                   : modelReady ? '#10b981'
                   : '#ef4444',
            }]}>
              {modelReady === null ? 'Bağlanıyor...' : modelReady ? '● Çevrimiçi' : '● Bağlantı yok'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Lokasyon seçici ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.locBar, { backgroundColor: colors.background.secondary }]}
        contentContainerStyle={styles.locBarContent}
      >
        {LOCATIONS.map(loc => (
          <TouchableOpacity
            key={loc.label}
            style={[
              styles.locChip,
              {
                backgroundColor: selectedLoc.label === loc.label
                  ? colors.accent.primary
                  : colors.surface.elevated,
                borderColor: selectedLoc.label === loc.label
                  ? colors.accent.primary
                  : colors.surface.border,
              },
            ]}
            onPress={() => setSelectedLoc(loc)}
            accessibilityLabel={`Konum seç: ${loc.label}`}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '500',
              color: selectedLoc.label === loc.label ? '#fff' : colors.text.secondary,
            }}>
              {loc.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Mesaj listesi ── */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              AI Mekan Asistanı
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.text.secondary }]}>
              Doğal dil ile mekan arayın:{'\n'}konumu, atmosferi, özelliği yazın — AI bulur.
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

      {/* ── Input ── */}
      <View style={[styles.inputBar, { backgroundColor: colors.background.secondary, borderTopColor: colors.surface.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface.elevated, color: colors.text.primary, borderColor: colors.surface.border }]}
          placeholder="Nasıl bir mekan arıyorsun?..."
          placeholderTextColor={colors.text.tertiary}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          editable={!isLoading}
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: isLoading || !inputText.trim() ? colors.surface.border : colors.accent.primary }]}
          onPress={() => handleSend()}
          disabled={isLoading || !inputText.trim()}
          accessibilityLabel="Gönder"
        >
          <Ionicons name="paper-plane" size={18} color="#fff" />
        </TouchableOpacity>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerStatus: { fontSize: 12, marginTop: 2 },

  // Lokasyon bar
  locBar: { maxHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth },
  locBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  locChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },

  // Chat
  chatContent: { padding: 12, gap: 10, flexGrow: 1 },

  // User bubble
  userBubbleWrap: { alignSelf: 'flex-end', maxWidth: '80%' },
  userBubble: { borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  userBubbleText: { color: '#fff', fontSize: 14, lineHeight: 20 },

  // Bot bubble
  botBubbleWrap: { alignSelf: 'flex-start', maxWidth: '95%' },
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
  },
  cardImage: { width: '100%', height: 160 },
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

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1, borderRadius: 24, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, maxHeight: 80,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
