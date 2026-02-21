/**
 * CreateTypeSheet – Paylaş butonuna tıklanınca: Gönderi | Hikaye | Reels seçimi
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { createTextStyle } from "@/constants/design";

export type CreateType = "post" | "story" | "reels";

export interface CreateTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: CreateType) => void;
}

const OPTIONS: { type: CreateType; label: string; icon: IconSymbolName }[] = [
  { type: "post", label: "Gönderi", icon: "photo" },
  { type: "story", label: "Hikaye", icon: "circle.hexagongrid.fill" },
  { type: "reels", label: "Reels", icon: "play.circle.fill" },
];

export function CreateTypeSheet({ visible, onClose, onSelect }: CreateTypeSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSelect = (type: CreateType) => {
    lightImpact();
    onClose();
    onSelect(type);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface.elevated,
              borderColor: colors.surface.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: colors.text.tertiary }]} />
          <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>
            Paylaş
          </Text>
          <View style={styles.options}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.type}
                style={[
                  styles.option,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderColor: colors.surface.border,
                  },
                ]}
                onPress={() => handleSelect(opt.type)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: colors.surface.elevated },
                  ]}
                >
                  <IconSymbol name={opt.icon} size={28} color={colors.accent.primary} />
                </View>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  {opt.label}
                </Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  options: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  option: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
