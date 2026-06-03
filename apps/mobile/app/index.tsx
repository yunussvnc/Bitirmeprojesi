import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/useAuthStore";

export default function Index() {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) return null;

  // Token varsa _layout.tsx'deki useProtectedRoute süresi dolmuşsa logout edecek
  // ve tekrar buraya düşecek. Token yoksa login'e yönlendir.
  if (token) return <Redirect href="/(tabs)" />;
  return <Redirect href="/login" />;
}
