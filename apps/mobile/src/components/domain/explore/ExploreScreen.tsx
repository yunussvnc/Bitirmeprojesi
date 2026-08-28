/**
 * Keşfet – Harita (WebView + Leaflet/OpenStreetMap)
 */

import React, { useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { ExploreMapView } from "@/src/components/domain/explore/ExploreMapView";
import { getAllPlaces } from "@/src/services/mekanService";
import { useAppStore } from "@/src/store/useAppStore";

export default function ExploreScreen() {
  const globalPlaces = useAppStore((s) => s.globalPlaces);
  const isGlobalPlacesLoading = useAppStore((s) => s.isGlobalPlacesLoading);
  const setGlobalPlaces = useAppStore((s) => s.setGlobalPlaces);
  const setIsGlobalPlacesLoading = useAppStore((s) => s.setIsGlobalPlacesLoading);

  const loadPlaces = useCallback(async () => {
    try {
      setIsGlobalPlacesLoading(true);
      const data = await getAllPlaces();
      setGlobalPlaces(data);
    } catch {
      setGlobalPlaces([]);
    } finally {
      setIsGlobalPlacesLoading(false);
    }
  }, [setGlobalPlaces, setIsGlobalPlacesLoading]);

  const placesWithCoords = useMemo(() => globalPlaces.filter((p) => p.latitude != null && p.longitude != null), [globalPlaces]);

  useEffect(() => {
    // Only load if we haven't loaded them yet
    if (globalPlaces.length === 0) {
      loadPlaces();
    }
  }, [globalPlaces.length, loadPlaces]);

  return (
    <View style={styles.container}>
      <ExploreMapView places={placesWithCoords} loading={isGlobalPlacesLoading} onLoadPlaces={loadPlaces} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
