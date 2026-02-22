import { Stack } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";

export default function SettingsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: "Geri",
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
