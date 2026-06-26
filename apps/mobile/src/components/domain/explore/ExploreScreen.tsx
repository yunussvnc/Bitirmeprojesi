/**
 * Keşfet – Harita
 */

import React, { Component, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import Constants from "expo-constants";
import { ExploreWebMapView } from "@/src/components/domain/explore/ExploreWebMapView";
import { getAllPlaces } from "@/src/services/mekanService";
import type { Place } from "@/src/services/mekanService";

type ExploreMapProps = {
  places: Place[];
  loading: boolean;
  onLoadPlaces: () => void;
};

type ExploreMapComponent = React.ComponentType<ExploreMapProps>;

declare const require: (moduleName: string) => { ExploreMapView?: ExploreMapComponent };

let nativeExploreMapView: ExploreMapComponent | null | undefined;

function resolveNativeExploreMapView(): ExploreMapComponent | null {
  if (Platform.OS === "web" || Constants.appOwnership === "expo") {
    return null;
  }

  if (nativeExploreMapView !== undefined) {
    return nativeExploreMapView;
  }

  try {
    nativeExploreMapView = require("./ExploreMapView").ExploreMapView ?? null;
  } catch {
    nativeExploreMapView = null;
  }

  return nativeExploreMapView;
}

type NativeMapBoundaryProps = ExploreMapProps & {
  NativeMapView: ExploreMapComponent;
};

type NativeMapBoundaryState = {
  didFail: boolean;
};

class NativeMapBoundary extends Component<NativeMapBoundaryProps, NativeMapBoundaryState> {
  state: NativeMapBoundaryState = { didFail: false };

  static getDerivedStateFromError(): NativeMapBoundaryState {
    return { didFail: true };
  }

  render() {
    const { NativeMapView, ...mapProps } = this.props;

    if (this.state.didFail) {
      return <ExploreWebMapView {...mapProps} />;
    }

    return <NativeMapView {...mapProps} />;
  }
}

export default function ExploreScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const NativeMapView = useMemo(resolveNativeExploreMapView, []);

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
      {NativeMapView ? (
        <NativeMapBoundary
          NativeMapView={NativeMapView}
          places={placesWithCoords}
          loading={loading}
          onLoadPlaces={loadPlaces}
        />
      ) : (
        <ExploreWebMapView places={placesWithCoords} loading={loading} onLoadPlaces={loadPlaces} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
