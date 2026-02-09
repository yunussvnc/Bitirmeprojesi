import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PreferencesProvider } from "../src/state/preferences";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <PreferencesProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              autoHideHomeIndicator: true, // iOS home indicator'ı otomatik gizle
            }}
          />
        </PreferencesProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
