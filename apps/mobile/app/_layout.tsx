import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PreferencesProvider } from "../src/store/preferences";
import { ThemeProvider } from "../src/context/ThemeContext";
import { ErrorBoundary } from "@/src/components/ui/ErrorBoundary";
import { checkHealth } from "@/src/services/mekanService";
import { useAppStore } from "@/src/store/useAppStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { setAuthInterceptors } from "@/src/utils/apiClient";
import { UploadProgressBanner } from "@/src/components/ui/UploadProgressBanner";
import { useNotificationSocket } from "@/src/hooks/useNotificationSocket";
import { PushNotificationProvider } from "@/src/providers/PushNotificationProvider";
import "@/src/i18n"; // i18n initialization

if (!__DEV__) {
  // Prevent console logs from leaking and consuming memory in production
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
}

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);
  const [isVerifying, setIsVerifying] = useState(true);

  // Basit JWT süresi kontrolü (Ağ isteği atmadan anında karar vermek için)
  useEffect(() => {
    if (!hydrated) return;
    
    if (accessToken) {
      try {
        const payloadBase64 = accessToken.split('.')[1];
        if (payloadBase64) {
          // React Native ortamında atob uyumluluğu için basit base64 decoder mantığı
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
          let output = '';
          let str = String(payloadBase64).replace(/[=]+$/, '');
          for (
            let bc = 0, bs, buffer, idx = 0;
            (buffer = str.charAt(idx++));
            ~buffer && ((bs = bc % 4 ? (bs || 0) * 64 + buffer : buffer), bc++ % 4)
              ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
              : 0
          ) {
            buffer = chars.indexOf(buffer);
          }
          const payload = JSON.parse(output);
          const isExpired = payload.exp * 1000 <= Date.now();
          
          if (isExpired) {
            console.log("Token expired locally, logging out...");
            logout();
          }
        }
      } catch (e) {
        console.warn("Token parse error", e);
        logout();
      }
    }
    setIsVerifying(false);
  }, [hydrated, accessToken]);

  useEffect(() => {
    // isVerifying bitmeden routing yapma ki uygulamanın içine girmesin
    if (!hydrated || !rootNavigationState?.key || isVerifying) return;

    const inAuthScreen =
      segments[0] === "login" ||
      segments[0] === "register" ||
      segments[0] === "forgot-password" ||
      segments[0] === "verify-email" ||
      (segments.length === 1 && !segments[0]);

    const isPublicLegalScreen =
      segments[0] === "settings" && segments[1] === "legal-document";

    const navigate = () => {
      const user = useAuthStore.getState().user;
      if (!accessToken && !inAuthScreen && !isPublicLegalScreen) {
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
  }, [accessToken, segments, hydrated, rootNavigationState?.key, router, isVerifying]);
}

export default function RootLayout() {
  const setApiHealthy = useAppStore((s) => s.setApiHealthy);
  
  // Initialize notification socket listener globally
  useNotificationSocket();

  useEffect(() => {
    setAuthInterceptors(
      () => useAuthStore.getState().accessToken,
      () => useAuthStore.getState().refreshToken,
      (access, refresh) => {
        useAuthStore.getState().setTokens(access, refresh);
      },
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
          <PushNotificationProvider>
            <PreferencesProvider>
              <UploadProgressBanner />
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
          </PushNotificationProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
