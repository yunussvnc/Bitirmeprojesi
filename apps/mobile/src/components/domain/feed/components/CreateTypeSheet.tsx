import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol, type IconSymbolName } from "@/src/components/ui/icon-symbol";
import { lightImpact, mediumImpact } from "@/src/utils/haptics";
import { spacing } from "@/src/constants/design";
import { useTranslation } from "react-i18next";
import { FEATURE_FLAGS } from "@/src/constants/featureFlags";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import { BlurView } from "expo-blur";

export type CreateType = "post" | "story";

export interface CreateTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: CreateType) => void;
}

export function CreateTypeSheet({ visible, onClose, onSelect }: CreateTypeSheetProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 12,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleClose = () => {
    lightImpact();
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
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
    setTimeout(() => onSelect(type), 250); // wait for animation
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <BlurView 
          intensity={isDark ? 40 : 20} 
          tint={isDark ? "dark" : "light"} 
          style={StyleSheet.absoluteFill} 
        >
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
        </BlurView>
        
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              transform: [{ scale: scaleAnim }]
            },
          ]}
        >
          <BlurView 
            intensity={isDark ? 80 : 100} 
            tint={isDark ? "dark" : "light"} 
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} 
          />
          
          <View style={styles.content}>
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
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                  ]}
                  onPress={() => handleSelect(opt.type)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIconContainer, { backgroundColor: colors.accent.primary + '15' }]}>
                    <IconSymbol name={opt.icon} size={28} color={colors.accent.primary} />
                  </View>

                  <Text style={[styles.optionLabel, { color: colors.text.primary }]}>{opt.label}</Text>
                  <Text style={[styles.optionSub, { color: colors.text.tertiary }]}>{opt.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    width: Dimensions.get("window").width * 0.85,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
    overflow: "hidden",
  },
  content: {
    padding: 24,
    zIndex: 10,
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
    gap: 12,
  },
  option: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 8,
    borderRadius: 20,
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
