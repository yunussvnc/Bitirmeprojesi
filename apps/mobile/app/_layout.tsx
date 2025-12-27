import { Stack } from "expo-router";
import { PreferencesProvider } from "../src/state/preferences";

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <Stack />
    </PreferencesProvider>
  );
}
