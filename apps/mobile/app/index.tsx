import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/useAuthStore";

export default function Index() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) return null;

  // Token varsa _layout.tsx'deki useProtectedRoute süresi dolmuşsa logout edecek
  // ve tekrar buraya düşecek. Token yoksa login'e yönlendir.
  if (token) {
    // Sosyal giriş sonrası username veya doğum tarihi eksik kalmış olabilir
    // (örn. Apple ile giriş yapıp first-time-setup'ı tamamlamadan kapatma)
    if (user && (!user.username || !user.birth_date)) {
      return <Redirect href="/first-time-setup" />;
    }
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/login" />;
}
