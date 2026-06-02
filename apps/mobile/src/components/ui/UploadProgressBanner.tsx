/**
 * UploadProgressBanner – Novu-inspired In-App Notification
 *
 * A floating banner that shows upload progress while the user browses the feed.
 * Appears when a background upload is active, disappears on completion.
 *
 * Architecture reference: Novu's in-app Inbox notification component.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useUploadPipelineStore } from '@/src/store/useUploadPipelineStore';
import { useTranslation } from 'react-i18next';
import type { UploadStage } from '@/src/contentCreation/types';
import type { TFunction } from 'i18next';

// ── Stage Labels ────────────────────────────────────────────

function getStageInfo(
  stage: UploadStage,
  t: TFunction
): { label: string; icon: string; color: string } {
  switch (stage) {
    case 'validating':
      return { label: t('upload.validating', 'Checking media...'), icon: 'checkmark.shield', color: '#FFB347' };
    case 'compressing':
      return { label: t('upload.compressing', 'Optimizing...'), icon: 'arrow.down.right.and.arrow.up.left', color: '#5B9BD5' };
    case 'uploading':
      return { label: t('upload.uploading', 'Uploading...'), icon: 'icloud.and.arrow.up', color: '#1DB954' };
    case 'creating_post':
      return { label: t('upload.creating', 'Publishing...'), icon: 'sparkles', color: '#AF52DE' };
    case 'done':
      return { label: t('upload.done', 'Published!'), icon: 'checkmark.circle.fill', color: '#4ECE8D' };
    case 'error':
      return { label: t('upload.error', 'Upload failed'), icon: 'exclamationmark.triangle', color: '#FF4757' };
    default:
      return { label: t('upload.preparing', 'Preparing...'), icon: 'hourglass', color: '#999' };
  }
}

// ── Component ───────────────────────────────────────────────

export function UploadProgressBanner() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const jobs = useUploadPipelineStore((s) => s.jobs);
  const retry = useUploadPipelineStore((s) => s.retry);
  const cancel = useUploadPipelineStore((s) => s.cancel);
  const clearCompleted = useUploadPipelineStore((s) => s.clearCompleted);

  // Find active or recently completed job
  const activeJob = jobs.find(
    (j) => j.stage !== 'idle' && j.stage !== 'done'
  );
  const recentDone = jobs.find((j) => j.stage === 'done');
  const currentJob = activeJob || recentDone;

  // Auto-dismiss completed jobs after 3 seconds
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (recentDone && !activeJob) {
      autoDismissTimer.current = setTimeout(() => {
        clearCompleted();
      }, 3000);
    }
    return () => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    };
  }, [recentDone, activeJob, clearCompleted]);

  // Progress bar animation
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (currentJob) {
      progressWidth.value = withSpring(currentJob.progress / 100, {
        damping: 20,
        stiffness: 120,
      });
    } else {
      progressWidth.value = 0;
    }
  }, [currentJob?.progress, currentJob?.stage]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progressWidth.value * 100)}%`,
  }));

  if (!currentJob) return null;

  const stageInfo = getStageInfo(currentJob.stage, t);
  const isError = currentJob.stage === 'error';
  const isDone = currentJob.stage === 'done';

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(18).stiffness(150)}
      exiting={SlideOutUp.duration(250)}
      style={[
        styles.container,
        {
          top: insets.top + 4,
          backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.97)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      {/* Progress Bar Track */}
      <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: stageInfo.color },
            progressStyle,
          ]}
        />
      </View>

      {/* Content Row */}
      <View style={styles.contentRow}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: stageInfo.color + '20' }]}>
          <IconSymbol name={stageInfo.icon as any} size={18} color={stageInfo.color} />
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={[styles.stageLabel, { color: colors.text.primary }]} numberOfLines={1}>
            {stageInfo.label}
          </Text>
          {!isDone && !isError && (
            <Text style={[styles.progressText, { color: colors.text.tertiary }]}>
              {currentJob.progress}%
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        {isError && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: stageInfo.color + '20' }]}
              onPress={() => retry(currentJob.id)}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.clockwise" size={14} color={stageInfo.color} />
              <Text style={[styles.retryText, { color: stageInfo.color }]}>
                {t('upload.retry', 'Retry')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => cancel(currentJob.id)}
              hitSlop={8}
            >
              <IconSymbol name="xmark" size={14} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        )}

        {isDone && (
          <Animated.View entering={FadeIn.delay(200)}>
            <IconSymbol name="checkmark.circle.fill" size={24} color="#4ECE8D" />
          </Animated.View>
        )}

        {!isError && !isDone && (
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => cancel(currentJob.id)}
            hitSlop={8}
          >
            <IconSymbol name="xmark" size={14} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  progressTrack: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  stageLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
