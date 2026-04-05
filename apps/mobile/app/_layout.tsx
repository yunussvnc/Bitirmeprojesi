import { useEffect } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PreferencesProvider } from "../src/store/preferences";
import { ThemeProvider } from "../src/context/ThemeContext";
import { ErrorBoundary } from "@/src/components/ui/ErrorBoundary";
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
      segments[0] === "forgot-password" ||
      segments[0] === "verify-email" ||
      (segments.length === 1 && !segments[0]);

    const navigate = () => {
      const user = useAuthStore.getState().user;
      if (!accessToken && !inAuthScreen) {
        router.replace("/login");
      } else if (accessToken && inAuthScreen) {
        if (user?.role === 'venue') {
          router.replace("/(venue-tabs)" as any);
        } else if (user && !user.is_email_verified) {
          router.replace("/verify-email");
        } else if (user && (!user.username || !user.birth_date)) {
          router.replace("/first-time-setup" as any);
        } else {
          router.replace("/(tabs)");
        }
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
              <Stack.Screen
                name="match-profile-setup"
                options={{
                  presentation: "modal",
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen name="login" options={{ gestureEnabled: false }} />
              <Stack.Screen name="register" options={{ gestureEnabled: false }} />
              <Stack.Screen name="first-time-setup" options={{ gestureEnabled: false }} />
              <Stack.Screen name="verify-email" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(venue-tabs)" options={{ gestureEnabled: false }} />
            </Stack>
          </PreferencesProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
