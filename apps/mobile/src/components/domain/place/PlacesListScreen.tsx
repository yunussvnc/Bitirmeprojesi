import React from "react";
import { getTranslatedCategory } from '@/src/utils/categories';
import { FlatList, Text, View } from "react-native";
import { DUMMY_PLACES } from "@/src/data/dummyPlaces";

import { useTranslation } from "react-i18next";

export default function PlacesListScreen() {
  const { t } = useTranslation();
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
              {getTranslatedCategory(item.category, t) ?? item.subtitle} • ⭐ {item.rating ?? "—"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
