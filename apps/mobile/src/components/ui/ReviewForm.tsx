/**
 * Review Form Component
 * 
 * Form for submitting reviews with rating and comment.
 * 
 * @module components/ui/ReviewForm
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ViewStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { Button } from '@/src/components/ui/Button';
import { RatingStars } from '@/src/components/ui/RatingStars';
import { createTextStyle } from '@/src/constants/design';
import { lightImpact, success } from '@/src/utils/haptics';
import { useTranslation } from 'react-i18next';

export interface ReviewFormProps {
  /**
   * Submit handler
   */
  onSubmit: (rating: number, comment: string) => void | Promise<void>;
  
  /**
   * Cancel handler
   */
  onCancel?: () => void;
  
  /**
   * Loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * Review Form Component
 * 
 * Form for submitting place reviews with 1-5 star rating.
 */
export function ReviewForm({
  onSubmit,
  onCancel,
  loading = false,
  style,
}: ReviewFormProps) {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const titleStyle = createTextStyle('heading', colors.text.primary);
  const labelStyle = createTextStyle('bodySmall', colors.text.secondary);

  const handleSubmit = async () => {
    if (rating === 0) {
      return; // Rating is required
    }
    
    lightImpact();
    await onSubmit(rating, comment);
    success();
    
    // Reset form
    setRating(0);
    setComment('');
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[titleStyle, styles.title, { marginBottom: spacing.base }]}>
        Yorum Yap
      </Text>

      {/* Rating */}
      <View style={styles.ratingSection}>
        <Text style={[labelStyle, { marginBottom: spacing.sm }]}>
          Puan Verin
        </Text>
        <RatingStars
          value={rating}
          onChange={(value) => {
            lightImpact();
            setRating(value);
          }}
        />
      </View>

      {/* Comment */}
      <View style={styles.commentSection}>
        <Text style={[labelStyle, { marginBottom: spacing.sm }]}>
          Yorumunuz (Opsiyonel)
        </Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={t('review.comment_ph')}
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

      {/* Actions */}
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
          Gönder
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    marginBottom: 16,
  },
  ratingSection: {
    marginBottom: 20,
  },
  commentSection: {
    marginBottom: 20,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
