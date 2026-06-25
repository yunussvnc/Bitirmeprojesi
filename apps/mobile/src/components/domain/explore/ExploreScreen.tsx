/**
 * Keşfet – Harita (WebView + Leaflet/OpenStreetMap)
 */

import React, { useEffect, useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { ExploreMapView } from "@/src/components/domain/explore/ExploreMapView";
import { getAllPlaces } from "@/src/services/mekanService";
import type { Place } from "@/src/services/mekanService";

export default function ExploreScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const data = await getAllPlaces();
      setPlaces(data);
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const placesWithCoords = useMemo(() => places.filter((p) => p.latitude != null && p.longitude != null), [places]);

  useEffect(() => {
    loadPlaces();
  }, []);

  return (
    <View style={styles.container}>
      <ExploreMapView places={placesWithCoords} loading={loading} onLoadPlaces={loadPlaces} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
