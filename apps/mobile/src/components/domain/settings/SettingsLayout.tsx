import { Stack } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { useTranslation } from "react-i18next";

export default function SettingsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: t("settings_layout.back"),
        headerBackVisible: true,
        headerTintColor: colors.accent.primary,
        headerStyle: { backgroundColor: colors.background.primary },
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 17, fontWeight: "600" },
        gestureEnabled: true,
      }}
      initialRouteName="index"
    />
  );
}
