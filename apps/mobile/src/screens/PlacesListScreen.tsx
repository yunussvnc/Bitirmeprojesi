import React from "react";
import { FlatList, Text, View } from "react-native";
import { dummyPlaces } from "../data/dummyPlaces";

export default function PlacesListScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        Mekanlar
      </Text>

      <FlatList
        data={dummyPlaces}
        keyExtractor={(item) => item.id}
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
              {item.category} • ⭐ {item.rating}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
