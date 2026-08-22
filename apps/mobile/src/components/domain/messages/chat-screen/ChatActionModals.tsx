import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';

import { styles } from './styles';

interface ChatActionModalsProps {
  contactName: string;
  optionsVisible: boolean;
  onCloseOptions: () => void;
  onBlock: () => void;
  onOpenReport: () => void;
  reportVisible: boolean;
  onCloseReport: () => void;
  reportText: string;
  onReportTextChange: (text: string) => void;
  onSubmitReport: () => void;
  previewUri: string | null;
  onClosePreview: () => void;
  onSendPreview: (uri: string) => void;
  caption: string;
  onCaptionChange: (text: string) => void;
}

export function ChatActionModals({
  contactName,
  optionsVisible,
  onCloseOptions,
  onBlock,
  onOpenReport,
  reportVisible,
  onCloseReport,
  reportText,
  onReportTextChange,
  onSubmitReport,
  previewUri,
  onClosePreview,
  onSendPreview,
  caption,
  onCaptionChange,
}: ChatActionModalsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Modal
        visible={optionsVisible}
        transparent
        animationType="fade"
        onRequestClose={onCloseOptions}
      >
        <TouchableWithoutFeedback onPress={onCloseOptions}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.optionsModal, { backgroundColor: colors.surface.elevated }]}>
                <TouchableOpacity style={styles.optionBtn} onPress={onBlock}>
                  <Text style={[styles.optionText, { color: '#e74c3c' }]}>{t('chat.block')}</Text>
                </TouchableOpacity>
                <View style={[styles.separator, { backgroundColor: colors.surface.border }]} />
                <TouchableOpacity style={styles.optionBtn} onPress={onOpenReport}>
                  <Text style={[styles.optionText, { color: '#e74c3c' }]}>{t('chat.report')}</Text>
                </TouchableOpacity>
                <View style={[styles.separator, { backgroundColor: colors.surface.border }]} />
                <TouchableOpacity style={styles.optionBtn} onPress={onCloseOptions}>
                  <Text style={[styles.optionText, { color: colors.text.primary, fontWeight: '500' }]}>
                    {t('chat.cancel')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={reportVisible}
        transparent
        animationType="slide"
        onRequestClose={onCloseReport}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.reportModalContainer}>
            <View style={[styles.reportModalContent, { backgroundColor: colors.surface.elevated }]}>
              <View style={[styles.reportHeader, { borderBottomColor: colors.surface.border }]}>
                <Text style={[styles.reportTitle, { color: colors.text.primary }]}>
                  {t('chat.report_user')}
                </Text>
                <TouchableOpacity onPress={onCloseReport}>
                  <IconSymbol name="xmark" size={24} color={colors.text.tertiary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.reportDesc, { color: colors.text.secondary }]}>
                {t('chat.report_desc', { name: contactName })}
              </Text>
              <View
                style={[
                  styles.reportInputWrapper,
                  {
                    borderColor: colors.surface.border,
                    backgroundColor: colors.background.primary,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.reportInput,
                    { backgroundColor: colors.background.secondary, color: colors.text.primary },
                  ]}
                  placeholder={t('chat.report_ph')}
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  value={reportText}
                  onChangeText={onReportTextChange}
                  textAlignVertical="top"
                  cursorColor={colors.accent.primary}
                />
              </View>
              <Text
                style={[
                  styles.wordCount,
                  {
                    color:
                      reportText.length > 500
                        ? colors.semantic.error
                        : colors.text.tertiary,
                  },
                ]}
              >
                {t('chat.char_left')} {500 - reportText.length}
              </Text>

              <TouchableOpacity
                style={[
                  styles.submitReportBtn,
                  {
                    backgroundColor:
                      reportText.trim().length === 0
                        ? colors.surface.border
                        : colors.accent.primary,
                  },
                ]}
                activeOpacity={0.8}
                onPress={onSubmitReport}
                disabled={reportText.trim().length === 0}
              >
                <Text
                  style={[
                    styles.submitReportText,
                    {
                      color:
                        reportText.trim().length === 0
                          ? colors.text.tertiary
                          : '#FFFFFF',
                    },
                  ]}
                >
                  {t('chat.send')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!previewUri}
        transparent
        animationType="slide"
        onRequestClose={onClosePreview}
      >
        <View style={styles.previewModalOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.previewTopBar}>
              <TouchableOpacity onPress={onClosePreview} hitSlop={12}>
                <Text style={styles.previewCancel}>İptal</Text>
              </TouchableOpacity>
              <Text style={styles.previewTitle}>Fotoğraf Gönder</Text>
              <TouchableOpacity
                onPress={() => previewUri && onSendPreview(previewUri)}
                hitSlop={12}
                style={styles.previewSendBtn}
              >
                <Text style={styles.previewSendText}>Gönder</Text>
              </TouchableOpacity>
            </View>

            {previewUri && (
              <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="contain" />
            )}

            <View
              style={[
                styles.previewCaptionBar,
                {
                  backgroundColor: colors.surface.elevated,
                  borderTopColor: colors.surface.border,
                },
              ]}
            >
              <TextInput
                style={[styles.previewCaptionInput, { color: colors.text.primary }]}
                placeholder="Açıklama ekle..."
                placeholderTextColor={colors.text.tertiary}
                value={caption}
                onChangeText={onCaptionChange}
                multiline
                maxLength={500}
                cursorColor={colors.accent.primary}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
