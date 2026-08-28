import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated, PanResponder, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { mediumImpact } from "@/src/utils/haptics";
import { useTranslation } from "react-i18next";

export interface ProfileOptionsSheetProps {
  visible: boolean;
  displayName: string;
  onClose: () => void;
  onBlock: () => void;
  onReport: () => void;
}

export function ProfileOptionsSheet({ visible, displayName, onClose, onBlock, onReport }: ProfileOptionsSheetProps) {
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

  const handleBlock = () => {
    mediumImpact();
    handleClose();
    setTimeout(() => {
      onBlock();
    }, 300);
  };

  const handleReport = () => {
    mediumImpact();
    handleClose();
    setTimeout(() => {
      onReport();
    }, 300);
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
          <Text style={[styles.title, { color: colors.text.primary }]}>{displayName}</Text>
          <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
            {t("user_profile.report_reason", "Bu hesap ile ilgili işlem yap")}
          </Text>

          {/* Options */}
          <View style={styles.options}>
            <TouchableOpacity
              style={[
                styles.optionItem,
                { backgroundColor: colors.background.tertiary + '80', borderColor: colors.surface.border + '40' },
              ]}
              onPress={handleReport}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconContainer, { backgroundColor: colors.text.secondary + '15' }]}>
                <IconSymbol name="flag" size={24} color={colors.text.primary} />
              </View>
              <Text style={[styles.optionLabel, { color: colors.text.primary }]}>{t("user_profile.report_title", "Raporla")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionItem,
                { backgroundColor: colors.background.tertiary + '80', borderColor: colors.surface.border + '40' },
              ]}
              onPress={handleBlock}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconContainer, { backgroundColor: '#FF3B3015' }]}>
                <IconSymbol name="nosign" size={24} color="#FF3B30" />
              </View>
              <Text style={[styles.optionLabel, { color: '#FF3B30' }]}>{t("user_profile.block", "Engelle")}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
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
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  options: {
    flexDirection: "row",
    gap: 12,
  },
  optionItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  optionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
