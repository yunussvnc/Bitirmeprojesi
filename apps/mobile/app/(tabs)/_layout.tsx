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
          title: "Home",
          headerTitle: "Home",
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Chatbot",
          headerTitle: "Chatbot",
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          headerTitle: "Saved",
        }}
      />
    </Tabs>
  );
}
