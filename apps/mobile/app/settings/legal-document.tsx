/**
 * In-app legal document viewer (terms, privacy, cookies).
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { createTextStyle, spacing } from '@/src/constants/design';
import { lightImpact } from '@/src/utils/haptics';

type DocType = 'terms' | 'privacy' | 'cookies';

const TITLE_KEYS: Record<DocType, string> = {
  terms: 'legal_documents.terms_title',
  privacy: 'legal_documents.privacy_title',
  cookies: 'legal_documents.cookies_title',
};

const BODY_KEYS: Record<DocType, string> = {
  terms: 'legal_documents.terms_body',
  privacy: 'legal_documents.privacy_body',
  cookies: 'legal_documents.cookies_body',
};

export default function LegalDocumentScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { type } = useLocalSearchParams<{ type?: string }>();

  const docType: DocType =
    type === 'privacy' || type === 'cookies' ? type : 'terms';

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle('title', colors.text.primary), styles.title]}>
          {t(TITLE_KEYS[docType])}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lead, { color: colors.text.primary }]}>
          {t('legal_documents.updated_notice')}
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          {t(BODY_KEYS[docType])}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  lead: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, marginBottom: 16, opacity: 0.85 },
  body: { fontSize: 15, lineHeight: 26, letterSpacing: 0.15 },
});
