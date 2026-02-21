import { useEffect } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PreferencesProvider } from "../src/state/preferences";
import { ThemeProvider } from "../context/ThemeContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { checkHealth } from "@/src/services/mekanService";
import { useAppStore } from "@/src/store/useAppStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { setAuthInterceptors } from "@/src/utils/apiClient";

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated || !rootNavigationState?.key) return;

    const inAuthScreen =
      segments[0] === "login" ||
      segments[0] === "register" ||
      (segments.length === 1 && !segments[0]);

    const navigate = () => {
      if (!accessToken && !inAuthScreen) {
        router.replace("/login");
      } else if (accessToken && inAuthScreen) {
        router.replace("/(tabs)");
      }
    };

    // Defer navigation to next tick so Stack has time to mount
    const id = setTimeout(navigate, 0);
    return () => clearTimeout(id);
  }, [accessToken, segments, hydrated, rootNavigationState?.key, router]);
}

export default function RootLayout() {
  const setApiHealthy = useAppStore((s) => s.setApiHealthy);

  useEffect(() => {
    setAuthInterceptors(
      () => useAuthStore.getState().accessToken,
      () => {
        useAuthStore.getState().logout();
      }
    );
  }, []);

  useEffect(() => {
    checkHealth().then(setApiHealthy);
  }, [setApiHealthy]);

  useProtectedRoute();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ErrorBoundary>
          <PreferencesProvider>
            <Stack
            screenOptions={{
              headerShown: false,
              autoHideHomeIndicator: true,
            }}
          >
            <Stack.Screen
              name="create-post"
              options={{
                presentation: "modal",
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="create-story"
              options={{
                presentation: "modal",
                gestureEnabled: true,
              }}
            />
          </Stack>
          </PreferencesProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
