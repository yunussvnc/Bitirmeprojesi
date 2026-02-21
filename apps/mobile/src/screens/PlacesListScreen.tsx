import React from "react";
import { FlatList, Text, View } from "react-native";
import { DUMMY_PLACES } from "../data/dummyPlaces";

export default function PlacesListScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        Mekanlar
      </Text>

      <FlatList
        data={DUMMY_PLACES}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{item.name}</Text>
            <Text>
              {item.category ?? item.subtitle} • ⭐ {item.rating ?? "—"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
