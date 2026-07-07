import React from "react";
import { RefreshControl, RefreshControlProps } from "react-native";
import { useTheme } from "@/src/hooks/useTheme";

export function PremiumRefreshControl(props: RefreshControlProps) {
  const { colors } = useTheme();

  return (
    <RefreshControl
      tintColor={colors.accent.primary} // iOS
      colors={[colors.accent.primary, colors.semantic.success, colors.semantic.info]} // Android spinner colors
      progressBackgroundColor={colors.surface.elevated} // Android background
      progressViewOffset={10}
      {...props}
    />
  );
}
