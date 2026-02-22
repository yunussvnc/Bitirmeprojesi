/**
 * Enhanced Review Form Component - Google Reviews Style (Development Version)
 * 
 * Simplified version without native modules for Expo Go compatibility.
 * Full version with image picker will be available in production build.
 * 
 * @module components/ui/EnhancedReviewForm
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { Button } from '@/src/components/ui/Button';
import { RatingStars } from '@/src/components/ui/RatingStars';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { createTextStyle, spacing } from '@/src/constants/design';
import { lightImpact, success } from '@/src/utils/haptics';

export interface EnhancedReviewData {
  rating: number;
  comment: string;
  
  // Detaylı puanlar
  foodRating?: number;
  serviceRating?: number;
  atmosphereRating?: number;
  valueRating?: number;
  cleanlinessRating?: number;
  
  // Ziyaret detayları
  visitType?: 'solo' | 'friends' | 'family' | 'business' | 'couple';
  spentAmount?: number;
  waitTimeMinutes?: number;
  orderedItems?: string;
  
  // Medya (placeholder for future)
  photos?: string[];
  videos?: string[];
}

export interface EnhancedReviewFormProps {
  onSubmit: (data: EnhancedReviewData) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

const VISIT_TYPES = [
  { id: 'solo', label: 'Yalnız', icon: 'person.fill' },
  { id: 'friends', label: 'Arkadaşlar', icon: 'person.2.fill' },
  { id: 'family', label: 'Aile', icon: 'person.3.fill' },
  { id: 'business', label: 'İş', icon: 'briefcase.fill' },
  { id: 'couple', label: 'Çift', icon: 'heart.fill' },
];

const RATING_CATEGORIES = [
  { id: 'food', label: 'Yemek', icon: 'fork.knife' },
  { id: 'service', label: 'Servis', icon: 'star.fill' },
  { id: 'atmosphere', label: 'Atmosfer', icon: 'music.note' },
  { id: 'value', label: 'Fiyat/Performans', icon: 'dollarsign.circle' },
  { id: 'cleanliness', label: 'Temizlik', icon: 'sparkles' },
];

export function EnhancedReviewForm({
  onSubmit,
  onCancel,
  loading = false,
}: EnhancedReviewFormProps) {
  const { colors } = useTheme();
  
  // Temel bilgiler
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  // Detaylı puanlar
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [atmosphereRating, setAtmosphereRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  
  // Ziyaret detayları
  const [visitType, setVisitType] = useState<string>();
  const [spentAmount, setSpentAmount] = useState('');
  const [waitTime, setWaitTime] = useState('');
  const [orderedItems, setOrderedItems] = useState('');
  
  // UI state
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);
  const [showSpendingInfo, setShowSpendingInfo] = useState(false);

  const titleStyle = createTextStyle('heading', colors.text.primary);
  const labelStyle = createTextStyle('bodySmall', colors.text.secondary);
  const bodyStyle = createTextStyle('body', colors.text.primary);

  const handleAddPhotos = () => {
    lightImpact();
    Alert.alert(
      'Fotoğraf Ekleme',
      'Fotoğraf ekleme özelliği production build\'de aktif olacak.',
      [{ text: 'Tamam' }]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Uyarı', 'Lütfen bir puan verin.');
      return;
    }

    const data: EnhancedReviewData = {
      rating,
      comment,
      foodRating: foodRating || undefined,
      serviceRating: serviceRating || undefined,
      atmosphereRating: atmosphereRating || undefined,
      valueRating: valueRating || undefined,
      cleanlinessRating: cleanlinessRating || undefined,
      visitType: visitType as any,
      spentAmount: spentAmount ? parseFloat(spentAmount) : undefined,
      waitTimeMinutes: waitTime ? parseInt(waitTime) : undefined,
      orderedItems: orderedItems || undefined,
    };

    lightImpact();
    await onSubmit(data);
    success();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Ana Puan */}
      <View style={styles.section}>
        <Text style={[titleStyle, { fontSize: 20, marginBottom: spacing.base }]}>
          Deneyiminizi Paylaşın
        </Text>
        <Text style={[labelStyle, { marginBottom: spacing.sm }]}>
          Genel Puanınız *
        </Text>
        <RatingStars
          value={rating}
          onChange={(value) => {
            lightImpact();
            setRating(value);
          }}
          size={32}
        />
      </View>

      {/* Fotoğraf Ekleme (Placeholder) */}
      <View style={styles.section}>
        <Text style={[labelStyle, { marginBottom: spacing.sm }]}>
          Fotoğraf Ekleyin (Yakında)
        </Text>
        <TouchableOpacity
          onPress={handleAddPhotos}
          style={[
            styles.addPhotoButton,
            {
              backgroundColor: colors.surface.elevated,
              borderColor: colors.surface.border,
            },
          ]}
        >
          <IconSymbol name="camera.fill" size={24} color={colors.text.secondary} />
          <Text style={[labelStyle, { marginTop: 4 }]}>Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Yorum Metni */}
      <View style={styles.section}>
        <Text style={[labelStyle, { marginBottom: spacing.sm }]}>
          Yorumunuz (Opsiyonel)
        </Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Deneyiminiz hakkında daha fazla bilgi verin..."
          placeholderTextColor={colors.text.tertiary}
          multiline
          numberOfLines={4}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surface.default,
              borderColor: colors.surface.border,
              color: colors.text.primary,
            },
          ]}
          textAlignVertical="top"
        />
      </View>

      {/* Kimlerle Geldiniz */}
      <View style={styles.section}>
        <Text style={[labelStyle, { marginBottom: spacing.sm }]}>
          Kimlerle Geldiniz?
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {VISIT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => {
                lightImpact();
                setVisitType(type.id);
              }}
              style={[
                styles.visitTypeButton,
                {
                  backgroundColor:
                    visitType === type.id
                      ? colors.accent.primary + '20'
                      : colors.surface.elevated,
                  borderColor:
                    visitType === type.id ? colors.accent.primary : colors.surface.border,
                },
              ]}
            >
              <IconSymbol
                name={type.icon as any}
                size={20}
                color={visitType === type.id ? colors.accent.primary : colors.text.secondary}
              />
              <Text
                style={[
                  bodyStyle,
                  {
                    marginTop: 4,
                    fontSize: 12,
                    color: visitType === type.id ? colors.accent.primary : colors.text.secondary,
                  },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Detaylı Puanlar (Genişletilebilir) */}
      <View style={styles.section}>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            setShowDetailedRatings(!showDetailedRatings);
          }}
          style={styles.expandHeader}
        >
          <Text style={[labelStyle]}>Detaylı Puanlar (Opsiyonel)</Text>
          <IconSymbol
            name={showDetailedRatings ? 'chevron.up' : 'chevron.down'}
            size={16}
            color={colors.text.secondary}
          />
        </TouchableOpacity>

        {showDetailedRatings && (
          <View style={{ marginTop: spacing.base }}>
            {RATING_CATEGORIES.map((category) => {
              const ratingValue =
                category.id === 'food'
                  ? foodRating
                  : category.id === 'service'
                  ? serviceRating
                  : category.id === 'atmosphere'
                  ? atmosphereRating
                  : category.id === 'value'
                  ? valueRating
                  : cleanlinessRating;

              const setRatingValue =
                category.id === 'food'
                  ? setFoodRating
                  : category.id === 'service'
                  ? setServiceRating
                  : category.id === 'atmosphere'
                  ? setAtmosphereRating
                  : category.id === 'value'
                  ? setValueRating
                  : setCleanlinessRating;

              return (
                <View key={category.id} style={styles.ratingRow}>
                  <View style={styles.ratingLabel}>
                    <IconSymbol name={category.icon as any} size={16} color={colors.text.secondary} />
                    <Text style={[bodyStyle, { marginLeft: 8, fontSize: 14 }]}>
                      {category.label}
                    </Text>
                  </View>
                  <RatingStars
                    value={ratingValue}
                    onChange={(value) => {
                      lightImpact();
                      setRatingValue(value);
                    }}
                    size={20}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Harcama ve Bekleme (Genişletilebilir) */}
      <View style={styles.section}>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            setShowSpendingInfo(!showSpendingInfo);
          }}
          style={styles.expandHeader}
        >
          <Text style={[labelStyle]}>Harcama & Bekleme (Opsiyonel)</Text>
          <IconSymbol
            name={showSpendingInfo ? 'chevron.up' : 'chevron.down'}
            size={16}
            color={colors.text.secondary}
          />
        </TouchableOpacity>

        {showSpendingInfo && (
          <View style={{ marginTop: spacing.base }}>
            <TextInput
              value={spentAmount}
              onChangeText={setSpentAmount}
              placeholder="Kişi başı harcama (TL)"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              style={[
                styles.smallInput,
                {
                  backgroundColor: colors.surface.default,
                  borderColor: colors.surface.border,
                  color: colors.text.primary,
                },
              ]}
            />
            <TextInput
              value={waitTime}
              onChangeText={setWaitTime}
              placeholder="Bekleme süresi (dakika)"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              style={[
                styles.smallInput,
                {
                  backgroundColor: colors.surface.default,
                  borderColor: colors.surface.border,
                  color: colors.text.primary,
                },
              ]}
            />
            <TextInput
              value={orderedItems}
              onChangeText={setOrderedItems}
              placeholder="Ne sipariş ettiniz?"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={2}
              style={[
                styles.smallInput,
                {
                  backgroundColor: colors.surface.default,
                  borderColor: colors.surface.border,
                  color: colors.text.primary,
                },
              ]}
              textAlignVertical="top"
            />
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {onCancel && (
          <Button
            variant="secondary"
            onPress={onCancel}
            disabled={loading}
            style={styles.cancelButton}
          >
            İptal
          </Button>
        )}
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={loading}
          disabled={rating === 0 || loading}
          style={styles.submitButton}
        >
          Yayınla
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  smallInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitTypeButton: {
    width: 80,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  ratingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
    marginBottom: spacing.xl * 2,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
