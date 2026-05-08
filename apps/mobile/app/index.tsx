import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/useAuthStore";

export default function Index() {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) return null;
  
  // Yönlendirme mantığı tamamen _layout.tsx içerisindeki useProtectedRoute hook'una bırakıldı
  // Böylece token doğrulama bitmeden uygulamanın içine (tabs) geçilmesi engelleniyor.
  return null;
}
