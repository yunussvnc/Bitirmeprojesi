import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useEffect, useState } from "react";
import { getMe } from "@/src/services/authService";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Token varsa geçerliliğini kontrol et
    if (hydrated && token) {
      setIsValidating(true);
      getMe()
        .then(() => {
          setIsValid(true);
        })
        .catch(() => {
          // Token geçersiz, temizle
          logout();
          setIsValid(false);
        })
        .finally(() => {
          setIsValidating(false);
        });
    }
  }, [hydrated, token]);

  // Hydration bekleniyor
  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Token validasyonu devam ediyor
  if (token && isValidating) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Token geçersiz çıktı, login'e yönlendir
  if (token && isValid === false) {
    return <Redirect href="/login" />;
  }

  // Token geçerli, kullanıcı durumuna göre yönlendir
  if (token && isValid) {
    if (user?.role === "venue") return <Redirect href="/(venue-tabs)" />;
    if (user && !user.is_email_verified) return <Redirect href="/verify-email" />;
    if (user && (!user.username || !user.birth_date)) return <Redirect href="/first-time-setup" />;
    return <Redirect href="/(tabs)" />;
  }

  // Token yok, login'e yönlendir
  return <Redirect href="/login" />;
}
