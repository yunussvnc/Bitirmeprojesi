import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from './icon-symbol';
import { spacing } from '@/src/constants/design';

export interface LegalModalProps {
  visible: boolean;
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export function LegalModal({ visible, type, onClose }: LegalModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!visible || !type) return null;

  const title = type === 'terms' ? t('auth.terms') : t('auth.privacy');
  const bodyText = type === 'terms' ? t('terms_body') : t('privacy_body');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { borderBottomColor: colors.surface.border }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <IconSymbol name="xmark.circle.fill" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.bodyText, { color: colors.text.secondary }]}>
            {bodyText}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
  },
});
