import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontSize: 16, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          headerTitle: "Ana Sayfa",
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Keşfet",
          headerTitle: "Keşfet",
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Kaydedilenler",
          headerTitle: "Kaydedilenler",
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          headerTitle: "Profil",
        }}
      />
    </Tabs>
  );
}
