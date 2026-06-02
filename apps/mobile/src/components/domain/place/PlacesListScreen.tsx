import React from "react";
import { getTranslatedCategory } from '@/src/utils/categories';
import { FlatList, Text, View } from "react-native";
import { DUMMY_PLACES } from "@/src/data/dummyPlaces";
import { useTranslation } from "react-i18next";

export default function PlacesListScreen() {
  const { t } = useTranslation();
  const data = __DEV__ ? DUMMY_PLACES : [];

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        {t("places.list_title", "Mekanlar")}
      </Text>

      {!__DEV__ ? (
        <Text style={{ fontSize: 15, color: "#666", lineHeight: 22 }}>
          {t("places.dev_only_list", "Mekan listesi geliştirme modunda örnek veri ile gösterilir. Uygulamada keşfet haritasını kullanın.")}
        </Text>
      ) : (
        <FlatList
          data={data}
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
          ListEmptyComponent={
            <Text style={{ color: "#888" }}>{t("places.empty", "Mekan bulunamadı")}</Text>
          }
        />
      )}
    </View>
  );
}
