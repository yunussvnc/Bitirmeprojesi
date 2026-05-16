/**
 * CreateTypeSheet – Premium İçerik Türü Seçimi
 * 
 * Feed "+" butonuna basılınca: Gönderi | Hikaye | Reels
 * Glassmorphism bottom sheet with gradient icon backgrounds.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol, type IconSymbolName } from "@/src/components/ui/icon-symbol";
import { lightImpact, mediumImpact } from "@/src/utils/haptics";
import { spacing } from "@/src/constants/design";
import { useTranslation } from "react-i18next";

export type CreateType = "post" | "story" | "reels";

export interface CreateTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: CreateType) => void;
}
export function CreateTypeSheet({ visible, onClose, onSelect }: CreateTypeSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const OPTIONS: {
    type: CreateType;
    label: string;
    subtitle: string;
    icon: IconSymbolName;
  }[] = [
    {
      type: "post",
      label: t("create_sheet.post_label"),
      subtitle: t("create_sheet.post_sub"),
      icon: "photo",
    },
    {
      type: "story",
      label: t("create_sheet.story_label"),
      subtitle: t("create_sheet.story_sub"),
      icon: "circle.hexagongrid.fill",
    },
    {
      type: "reels",
      label: t("create_sheet.reels_label"),
      subtitle: t("create_sheet.reels_sub"),
      icon: "play.circle.fill",
    },
  ];

  const handleSelect = (type: CreateType) => {
    mediumImpact();
    onClose();
    onSelect(type);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface.elevated,
              borderColor: colors.surface.border,
              paddingBottom: insets.bottom + 20,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>{t("create_sheet.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
            {t("create_sheet.subtitle")}
          </Text>

          {/* Options */}
          <View style={styles.options}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.type}
                style={[
                  styles.option,
                  { backgroundColor: colors.background.tertiary + '80', borderColor: colors.surface.border + '40' },
                ]}
                onPress={() => handleSelect(opt.type)}
                activeOpacity={0.7}
              >
                {/* Tinted Icon Container */}
                <View style={[styles.optionIconContainer, { backgroundColor: colors.accent.primary + '15' }]}>
                  <IconSymbol name={opt.icon} size={28} color={colors.accent.primary} />
                </View>

                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>{opt.label}</Text>
                <Text style={[styles.optionSub, { color: colors.text.tertiary }]}>{opt.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  options: {
    flexDirection: "row",
    gap: 10,
  },
  option: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 2,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  optionSub: {
    fontSize: 11,
    fontWeight: "500",
  },
});
