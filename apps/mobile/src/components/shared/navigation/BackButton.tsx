import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";

interface BackButtonProps {
  onPress: () => void;
}

export function BackButton({ onPress }: BackButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} style={styles.button} hitSlop={8}>
      <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
