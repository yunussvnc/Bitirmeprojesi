import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Geri",
        headerBackVisible: true,
        headerTintColor: colors.accent.primary,
        headerStyle: { backgroundColor: colors.background.primary },
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 17, fontWeight: "600" },
        gestureEnabled: true,
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="story" options={{ headerShown: false }} />
      <Stack.Screen name="content" options={{ headerShown: false }} />
      <Stack.Screen name="camera" options={{ headerShown: false }} />
    </Stack>
  );
}
