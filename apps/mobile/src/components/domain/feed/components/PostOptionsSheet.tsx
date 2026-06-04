/**
 * PostOptionsSheet – Gönderi seçenekleri bottom sheet
 */

import React, { useMemo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated, PanResponder, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol, type IconSymbolName } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { useTranslation } from "react-i18next";

type PostOptionKey = "save" | "share" | "hide" | "report" | "unfollow" | "mute";

export interface PostOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  showFollowActions?: boolean;
  onSelect: (key: PostOptionKey) => void;
}

type Option = {
  key: PostOptionKey;
  label: string;
  icon: IconSymbolName;
  destructive?: boolean;
};

export function PostOptionsSheet({ visible, onClose, showFollowActions = false, onSelect }: PostOptionsSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) {
          Animated.timing(translateY, {
            toValue: 320,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onClose());
          return;
        }
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 80,
        }).start();
      },
    })
  ).current;

  const options = useMemo<Option[]>(
    () => [
      { key: "save", label: t("post_options.save"), icon: "bookmark" },
      { key: "share", label: t("post_options.share"), icon: "paperplane.fill" },
      { key: "hide", label: t("post_options.hide"), icon: "eye.slash" },
      { key: "report", label: t("post_options.report"), icon: "exclamationmark.triangle", destructive: true },
      ...(showFollowActions
        ? ([
          { key: "unfollow", label: t("post_options.unfollow"), icon: "person.badge.minus" },
          { key: "mute", label: t("post_options.mute"), icon: "speaker.slash" },
        ] as Option[])
        : []),
    ],
    [showFollowActions, t]
  );

  const handleSelect = (key: PostOptionKey) => {
    lightImpact();
    onClose();
    onSelect(key);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} android_disableSound>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface.elevated,
                borderColor: colors.surface.border,
                paddingBottom: insets.bottom + 12,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.text.tertiary }]} {...panResponder.panHandlers} />
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.option,
                  {
                    borderBottomColor: colors.surface.border,
                    borderBottomWidth: idx === options.length - 1 ? 0 : StyleSheet.hairlineWidth,
                  },
                ]}
                onPress={() => handleSelect(opt.key)}
                activeOpacity={0.7}
              >
                <IconSymbol name={opt.icon} size={20} color={opt.destructive ? colors.semantic.error : colors.text.secondary} />
                <Text style={[styles.optionLabel, { color: opt.destructive ? colors.semantic.error : colors.text.primary }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableWithoutFeedback>
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
    paddingTop: 12,
    borderTopWidth: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
