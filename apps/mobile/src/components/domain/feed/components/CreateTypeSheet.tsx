/**
 * CreateTypeSheet – Premium İçerik Türü Seçimi
 * 
 * Feed "+" butonuna basılınca: Gönderi | Hikaye | Reels
 * Glassmorphism bottom sheet with gradient icon backgrounds.
 */

import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated, PanResponder, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol, type IconSymbolName } from "@/src/components/ui/icon-symbol";
import { lightImpact, mediumImpact } from "@/src/utils/haptics";
import { spacing } from "@/src/constants/design";
import { useTranslation } from "react-i18next";
import { FEATURE_FLAGS } from "@/src/constants/featureFlags";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

export type CreateType = "post" | "story";

export interface CreateTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: CreateType) => void;
}
export function CreateTypeSheet({ visible, onClose, onSelect }: CreateTypeSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const panY = useRef(new Animated.Value(Dimensions.get("window").height)).current;
  const isAnimating = useRef(false);

  useEffect(() => {
    if (visible) {
      panY.setValue(Dimensions.get("window").height);
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  }, [visible, panY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 1) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    Animated.timing(panY, {
      toValue: Dimensions.get("window").height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      isAnimating.current = false;
      onClose();
    });
  };

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
  ];

  const handleSelect = (type: CreateType) => {
    mediumImpact();
    if (type === "post" && !FEATURE_FLAGS.ENABLE_POST_SHARING) {
      Alert.alert(t("create_sheet.coming_soon", "Yakında"), "Gönderi paylaşımı yakında aktif olacaktır.");
      return;
    }
    if (type === "story" && !FEATURE_FLAGS.ENABLE_STORIES) {
      Alert.alert(t("create_sheet.coming_soon", "Yakında"), "Hikaye paylaşımı yakında aktif olacaktır.");
      return;
    }
    handleClose();
    onSelect(type);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose} android_disableSound>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface.elevated,
              borderColor: colors.surface.border,
              paddingBottom: insets.bottom + 20,
              transform: [{ translateY: panY }]
            },
          ]}
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
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
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
